/**
 * Assign statutory / year-wide holidays to the GES term they belong to (by date).
 */

const STATUTORY_HOLIDAY_NAME = "Statutory / public holiday";

function dateToIso(d) {
  if (!d) return null;
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return x.toISOString().split("T")[0];
}

function expandRangeIso(start, end) {
  const a = dateToIso(start);
  const b = dateToIso(end);
  if (!a || !b || a > b) return [];
  const out = [];
  let cur = new Date(`${a}T00:00:00.000Z`);
  const endT = new Date(`${b}T00:00:00.000Z`);
  while (cur <= endT) {
    out.push(cur.toISOString().split("T")[0]);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/**
 * @param {string} iso YYYY-MM-DD
 * @param {Array<{ termKey, start, end, vacationStart?, vacationEnd? }>} boundaries
 */
function resolveTermKeyForDate(iso, boundaries) {
  const sorted = [...boundaries]
    .filter((t) => t.start && t.end)
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));

  for (const t of sorted) {
    if (iso >= t.start && iso <= t.end) return t.termKey;
  }
  for (const t of sorted) {
    if (t.vacationStart && t.vacationEnd && iso >= t.vacationStart && iso <= t.vacationEnd) {
      return t.termKey;
    }
  }
  for (let i = 0; i < sorted.length; i += 1) {
    const t = sorted[i];
    const next = sorted[i + 1];
    if (t.end && iso > t.end) {
      if (next?.start && iso < next.start) return next.termKey;
      if (!next) return t.termKey;
    }
  }
  if (sorted.length && iso < sorted[0].start) return sorted[0].termKey;
  if (sorted.length) return sorted[sorted.length - 1].termKey;
  return null;
}

/** True when iso falls within a term's in-school window (start–end inclusive). */
function isWithinTermDates(iso, boundary) {
  if (!iso || !boundary?.start || !boundary?.end) return false;
  return iso >= boundary.start && iso <= boundary.end;
}

function boundaryForTermKey(boundaries, termKey) {
  return (boundaries || []).find((b) => b.termKey === termKey) || null;
}

function resolveInSchoolTermKey(iso, boundaries) {
  const match = (boundaries || []).find((b) => isWithinTermDates(iso, b));
  return match ? match.termKey : null;
}

/** Merge consecutive calendar days into inclusive date ranges. */
function isoRangesToHolidayEntries(isoDays, name) {
  if (!isoDays.length) return [];
  const sorted = [...new Set(isoDays)].sort();
  const ranges = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i += 1) {
    const cur = sorted[i];
    const prevD = new Date(`${prev}T00:00:00.000Z`);
    prevD.setUTCDate(prevD.getUTCDate() + 1);
    const expectedNext = prevD.toISOString().split("T")[0];
    if (cur !== expectedNext) {
      ranges.push({ name, startDate: start, endDate: prev });
      start = cur;
    }
    prev = cur;
  }
  ranges.push({ name, startDate: start, endDate: prev });
  return ranges;
}

/**
 * Split holiday list into per-term buckets.
 * @returns {Record<string, Array<{ name, startDate, endDate }>>}
 */
function splitHolidaysIntoTerms(holidays, boundaries) {
  const byTerm = {};
  boundaries.forEach((b) => {
    byTerm[b.termKey] = [];
  });

  const daysByTerm = {};
  (holidays || []).forEach((h) => {
    const name = h.name || STATUTORY_HOLIDAY_NAME;
    expandRangeIso(h.startDate, h.endDate).forEach((iso) => {
      const termKey = resolveInSchoolTermKey(iso, boundaries);
      if (!termKey) return;
      if (!daysByTerm[termKey]) daysByTerm[termKey] = [];
      daysByTerm[termKey].push({ iso, name });
    });
  });

  Object.entries(daysByTerm).forEach(([termKey, entries]) => {
    const dayNames = new Map();
    entries.forEach(({ iso, name }) => {
      const existing = dayNames.get(iso);
      if (!existing || /mid[- ]?term/i.test(name)) {
        dayNames.set(iso, /mid[- ]?term/i.test(name) ? name : existing || name);
      }
    });
    const sorted = [...dayNames.keys()].sort();
    const ranges = [];
    let rangeStart = null;
    let rangeEnd = null;
    let rangeName = null;
    sorted.forEach((iso) => {
      const name = dayNames.get(iso);
      if (!rangeStart) {
        rangeStart = iso;
        rangeEnd = iso;
        rangeName = name;
        return;
      }
      const prevD = new Date(`${rangeEnd}T00:00:00.000Z`);
      prevD.setUTCDate(prevD.getUTCDate() + 1);
      const expectedNext = prevD.toISOString().split("T")[0];
      if (iso === expectedNext && name === rangeName) {
        rangeEnd = iso;
      } else {
        ranges.push({ name: rangeName, startDate: rangeStart, endDate: rangeEnd });
        rangeStart = iso;
        rangeEnd = iso;
        rangeName = name;
      }
    });
    if (rangeStart) {
      ranges.push({ name: rangeName, startDate: rangeStart, endDate: rangeEnd });
    }
    byTerm[termKey] = ranges;
  });

  return byTerm;
}

/** Build per-term holidays from flat ISO list + term boundary docs. */
function splitGlobalIsoListIntoTermHolidays(globalIsoList, boundaries) {
  const holidays = (globalIsoList || []).map((iso) => ({
    name: STATUTORY_HOLIDAY_NAME,
    startDate: iso,
    endDate: iso,
  }));
  return splitHolidaysIntoTerms(holidays, boundaries);
}

/**
 * Collapse duplicate/overlapping rows; keep only in-school days; merge consecutive ranges.
 */
function normalizeTermHolidays(holidays, boundary) {
  if (!boundary?.start || !boundary?.end) return [];

  const dayNames = new Map();
  (holidays || []).forEach((h) => {
    const baseName = (h.name || STATUTORY_HOLIDAY_NAME).trim() || STATUTORY_HOLIDAY_NAME;
    expandRangeIso(h.startDate, h.endDate).forEach((iso) => {
      if (!isWithinTermDates(iso, boundary)) return;
      const existing = dayNames.get(iso);
      if (!existing || /mid[- ]?term/i.test(baseName)) {
        dayNames.set(iso, /mid[- ]?term/i.test(baseName) ? baseName : existing || baseName);
      }
    });
  });

  if (dayNames.size === 0) return [];

  const sorted = [...dayNames.keys()].sort();
  const ranges = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];
  let rangeName = dayNames.get(sorted[0]);

  for (let i = 1; i < sorted.length; i += 1) {
    const iso = sorted[i];
    const name = dayNames.get(iso);
    const prevD = new Date(`${rangeEnd}T00:00:00.000Z`);
    prevD.setUTCDate(prevD.getUTCDate() + 1);
    const expectedNext = prevD.toISOString().split("T")[0];
    if (iso === expectedNext && name === rangeName) {
      rangeEnd = iso;
    } else {
      ranges.push({ name: rangeName, startDate: rangeStart, endDate: rangeEnd });
      rangeStart = iso;
      rangeEnd = iso;
      rangeName = name;
    }
  }
  ranges.push({ name: rangeName, startDate: rangeStart, endDate: rangeEnd });

  const seen = new Set();
  return ranges.filter((r) => {
    const k = `${r.startDate}|${r.endDate}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Stable signature for comparing holiday lists (ignores _id and name-only dupes). */
function holidayListSignature(holidays) {
  return (holidays || [])
    .map((h) => `${dateToIso(h.startDate)}|${dateToIso(h.endDate)}`)
    .filter((k) => k && !k.startsWith("|"))
    .sort()
    .join(";");
}

function holidayKey(h) {
  const s = dateToIso(h.startDate);
  const e = dateToIso(h.endDate);
  return `${(h.name || "").trim()}|${s}|${e}`;
}

function mergeHolidayLists(existing, additions) {
  const seen = new Set((existing || []).map(holidayKey));
  const out = [...(existing || [])];
  (additions || []).forEach((h) => {
    const k = holidayKey(h);
    if (seen.has(k)) return;
    seen.add(k);
    out.push({
      name: h.name || "Statutory / public holiday",
      startDate: h.startDate instanceof Date ? h.startDate : new Date(`${dateToIso(h.startDate)}T00:00:00.000Z`),
      endDate: h.endDate instanceof Date ? h.endDate : new Date(`${dateToIso(h.endDate)}T00:00:00.000Z`),
    });
  });
  return out;
}

function boundariesFromCalendarDocs(docs) {
  return docs.map((d) => ({
    termKey: d.termKey,
    start: dateToIso(d.startDate),
    end: dateToIso(d.endDate),
    vacationStart: dateToIso(d.vacationStart),
    vacationEnd: dateToIso(d.vacationEnd),
  }));
}

function toMongoHolidayEntries(entries) {
  return (entries || []).map((h) => ({
    name: h.name || "Statutory / public holiday",
    startDate: new Date(`${dateToIso(h.startDate)}T00:00:00.000Z`),
    endDate: new Date(`${dateToIso(h.endDate)}T00:00:00.000Z`),
  }));
}

module.exports = {
  STATUTORY_HOLIDAY_NAME,
  dateToIso,
  expandRangeIso,
  resolveTermKeyForDate,
  isWithinTermDates,
  boundaryForTermKey,
  resolveInSchoolTermKey,
  splitHolidaysIntoTerms,
  splitGlobalIsoListIntoTermHolidays,
  normalizeTermHolidays,
  holidayListSignature,
  mergeHolidayLists,
  boundariesFromCalendarDocs,
  toMongoHolidayEntries,
};
