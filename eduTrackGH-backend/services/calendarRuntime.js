/**
 * Runtime GES calendar: loads active calendar from MongoDB with legacy fallback.
 * Long-lived in-memory cache + in-flight dedupe; invalidate after admin mutations.
 */

const Calendar = require("../models/Calendar");
const { getLegacyCalendarPayload } = require("../utils/gesCalendar.legacy");
const { isWeekend } = require("../utils/weekend");

/** 10 minutes — calendar data changes rarely */
const CACHE_TTL_MS = parseInt(process.env.CALENDAR_CACHE_TTL_MS, 10) || 10 * 60 * 1000;

let cache = { engine: null, expiresAt: 0 };
/** Deduplicate concurrent rebuilds (cold cache / stampede after invalidate). */
let inflightEnginePromise = null;
/** Bumped on invalidate so stale in-flight loads do not overwrite fresh cache. */
let invalidationEpoch = 0;

function invalidateActiveCalendarCache() {
  invalidationEpoch += 1;
  cache = { engine: null, expiresAt: 0 };
  inflightEnginePromise = null;
}

function dateToIso(d) {
  if (!d) return null;
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return x.toISOString().split("T")[0];
}

/** Expand inclusive date range to ISO day strings */
function expandRangeIso(start, end) {
  const a = dateToIso(start);
  const b = dateToIso(end);
  if (!a || !b || a > b) return [];
  const out = [];
  let cur = new Date(`${a}T00:00:00Z`);
  const endT = new Date(`${b}T00:00:00Z`);
  while (cur <= endT) {
    out.push(cur.toISOString().split("T")[0]);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/**
 * Build synchronous rule engine from payload (same shape as GET /api/calendar/active).
 */
function buildEngineFromPayload(payload) {
  const beceStart = payload.beceStart || null;
  const beceEnd = payload.beceEnd || null;
  const terms = (payload.terms || []).map((t) => ({
    name: t.name,
    label: t.label || t.name,
    start: dateToIso(t.start),
    end: dateToIso(t.end),
    vacationStart: t.vacationStart ? dateToIso(t.vacationStart) : null,
    vacationEnd: t.vacationEnd ? dateToIso(t.vacationEnd) : null,
    numberOfWeeks: Number(t.numberOfWeeks) || 12,
  }));

  const holidaySet = new Set(payload.globalHolidayIsoList || []);
  (payload.terms || []).forEach((t) => {
    (t.holidays || []).forEach((h) => {
      expandRangeIso(h.startDate, h.endDate).forEach((iso) => holidaySet.add(iso));
    });
  });
  (payload.yearWideHolidays || []).forEach((h) => {
    expandRangeIso(h.startDate, h.endDate).forEach((iso) => holidaySet.add(iso));
  });

  const toIso = (dateInput) => {
    if (!dateInput) return null;
    if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  };

  const inRange = (iso, start, end) => iso && start && end && iso >= start && iso <= end;

  function isWeekendDate(dateInput) {
    const iso = toIso(dateInput);
    if (!iso) return false;
    return isWeekend(iso);
  }

  function isHolidayDate(dateInput) {
    const iso = toIso(dateInput);
    return iso ? holidaySet.has(iso) : false;
  }

  function getTermForDate(dateInput) {
    const iso = toIso(dateInput);
    if (!iso) return null;
    const term = terms.find((t) => inRange(iso, t.start, t.end));
    return term ? term.name : null;
  }

  function isVacationDate(dateInput) {
    const iso = toIso(dateInput);
    if (!iso) return false;
    return terms.some(
      (t) => t.vacationStart && t.vacationEnd && inRange(iso, t.vacationStart, t.vacationEnd)
    );
  }

  function isBeceDay(dateInput, level) {
    const iso = toIso(dateInput);
    if (!iso || !beceStart || !beceEnd) return false;
    const normalized = String(level || "").toUpperCase().replace(/\s+/g, "");
    const isJhs3 = normalized === "JHS3" || normalized === "JHS_3" || normalized === "JHS-3";
    return isJhs3 && inRange(iso, beceStart, beceEnd);
  }

  function getSchoolDayDecision(dateInput, level) {
    const iso = toIso(dateInput);
    if (!iso) return { isSchoolDay: false, reason: "invalid_date", termName: null, date: null };
    if (isWeekendDate(iso)) return { isSchoolDay: false, reason: "weekend", termName: null, date: iso };

    const sortedByStart = [...terms]
      .filter((t) => t.start)
      .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
    const termName = getTermForDate(iso);

    if (!termName) {
      const nextTerm = sortedByStart.find((t) => iso < t.start);
      if (nextTerm) {
        return {
          isSchoolDay: false,
          reason: "before_resumption",
          termName: nextTerm.name,
          date: iso,
        };
      }
      return { isSchoolDay: false, reason: "term_ended", termName: null, date: iso };
    }

    if (isHolidayDate(iso)) return { isSchoolDay: false, reason: "holiday", termName, date: iso };
    if (isVacationDate(iso)) return { isSchoolDay: false, reason: "vacation", termName, date: iso };
    if (isBeceDay(iso, level)) return { isSchoolDay: false, reason: "bece", termName, date: iso };

    return { isSchoolDay: true, reason: "school_day", termName, date: iso };
  }

  function isSchoolDay(dateInput, level) {
    return getSchoolDayDecision(dateInput, level).isSchoolDay;
  }

  function getTermDateRange(termName) {
    const t = terms.find((x) => x.name === termName);
    return t ? { start: t.start, end: t.end } : null;
  }

  function generateSchoolDaysForHistory(month, year, level) {
    const y = Number(year);
    const m = Number(month);
    if (!y || !m) return [];
    const count = new Date(y, m, 0).getDate();
    const out = [];
    for (let d = 1; d <= count; d += 1) {
      const iso = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (isWeekendDate(iso) || isHolidayDate(iso) || isVacationDate(iso) || !getTermForDate(iso)) continue;
      if (isBeceDay(iso, level)) {
        out.push({ date: iso, type: "exam" });
        continue;
      }
      out.push({ date: iso, type: "school" });
    }
    return out;
  }

  const TERM_WEEK_COUNTS = {};
  terms.forEach((t) => {
    TERM_WEEK_COUNTS[t.name] = t.numberOfWeeks;
  });

  return {
    payload,
    terms,
    TERM_WEEK_COUNTS,
    toIso,
    getSchoolDayDecision,
    isSchoolDay,
    getTermDateRange,
    getTermForDate,
    generateSchoolDaysForHistory,
    isWeekend: isWeekendDate,
    isHolidayDate,
    isVacationDate,
    isBeceDay,
  };
}

function docsToPayload(docs) {
  if (!docs.length) return null;
  const academicYear = docs[0].academicYear;
  const t1 = docs.find((d) => d.termKey === "TERM_1");
  const yearWide = t1?.yearWideHolidays?.length ? t1.yearWideHolidays : [];
  const t3 = docs.find((d) => d.termKey === "TERM_3");

  const terms = docs.map((d) => ({
    name: d.termKey,
    label: d.termLabel || d.termKey.replace("TERM_", "Term ").replace("_", " "),
    start: dateToIso(d.startDate),
    end: dateToIso(d.endDate),
    numberOfWeeks: d.numberOfWeeks,
    vacationStart: d.vacationStart ? dateToIso(d.vacationStart) : null,
    vacationEnd: d.vacationEnd ? dateToIso(d.vacationEnd) : null,
    holidays: (d.holidays || []).map((h) => ({
      name: h.name,
      startDate: h.startDate,
      endDate: h.endDate,
    })),
  }));

  return {
    academicYear,
    source: "database",
    beceStart: t3?.beceStart ? dateToIso(t3.beceStart) : null,
    beceEnd: t3?.beceEnd ? dateToIso(t3.beceEnd) : null,
    globalHolidayIsoList: [],
    yearWideHolidays: yearWide.map((h) => ({ name: h.name, startDate: h.startDate, endDate: h.endDate })),
    terms,
  };
}

async function seedFromLegacyIfEmpty() {
  const anyRow = await Calendar.findOne({ isDeleted: { $ne: true } }).select("_id").lean();
  if (anyRow) return;
  if (process.env.DISABLE_GES_AUTO_SEED === "true") return;

  const p = getLegacyCalendarPayload();
  const yearWide = (p.globalHolidayIsoList || []).map((iso) => ({
    name: "Statutory / public holiday",
    startDate: new Date(`${iso}T00:00:00.000Z`),
    endDate: new Date(`${iso}T00:00:00.000Z`),
  }));

  const ops = p.terms.map((t, idx) => {
    const doc = {
      academicYear: p.academicYear,
      termKey: t.name,
      termLabel: t.label,
      startDate: new Date(`${t.start}T00:00:00.000Z`),
      endDate: new Date(`${t.end}T00:00:00.000Z`),
      numberOfWeeks: t.numberOfWeeks,
      vacationStart: t.vacationStart ? new Date(`${t.vacationStart}T00:00:00.000Z`) : undefined,
      vacationEnd: t.vacationEnd ? new Date(`${t.vacationEnd}T00:00:00.000Z`) : undefined,
      holidays: [],
      isActive: true,
      isDeleted: false,
    };
    if (idx === 0) doc.yearWideHolidays = yearWide;
    if (t.name === "TERM_3" && p.beceStart && p.beceEnd) {
      doc.beceStart = new Date(`${p.beceStart}T00:00:00.000Z`);
      doc.beceEnd = new Date(`${p.beceEnd}T00:00:00.000Z`);
    }
    return doc;
  });

  try {
    await Calendar.insertMany(ops);
  } catch (e) {
    if (e.code !== 11000) throw e;
  }
}

async function loadActivePayload() {
  let docs = await Calendar.find({ isActive: true, isDeleted: { $ne: true } })
    .sort({ termKey: 1 })
    .lean();

  if (docs.length === 0) {
    await seedFromLegacyIfEmpty();
    docs = await Calendar.find({ isActive: true, isDeleted: { $ne: true } })
      .sort({ termKey: 1 })
      .lean();
  }

  if (docs.length === 0) return getLegacyCalendarPayload();
  return docsToPayload(docs);
}

async function getEngine() {
  if (cache.engine && Date.now() < cache.expiresAt) {
    return cache.engine;
  }
  if (inflightEnginePromise) {
    return inflightEnginePromise;
  }

  const epochAtStart = invalidationEpoch;
  inflightEnginePromise = (async () => {
    try {
      if (process.env.CALENDAR_DEBUG === "1") {
        console.time("calendarEngineLoad");
      }
      const payload = await loadActivePayload();
      const engine = buildEngineFromPayload(payload);
      if (epochAtStart === invalidationEpoch) {
        cache = { engine, expiresAt: Date.now() + CACHE_TTL_MS };
      }
      if (process.env.CALENDAR_DEBUG === "1") {
        console.timeEnd("calendarEngineLoad");
      }
      return engine;
    } finally {
      inflightEnginePromise = null;
    }
  })();

  return inflightEnginePromise;
}

async function isSchoolDay(dateInput, level) {
  return (await getEngine()).isSchoolDay(dateInput, level);
}

async function getSchoolDayDecision(dateInput, level) {
  return (await getEngine()).getSchoolDayDecision(dateInput, level);
}

async function getTermDateRange(termName) {
  return (await getEngine()).getTermDateRange(termName);
}

async function generateSchoolDaysForHistory(month, year, level) {
  return (await getEngine()).generateSchoolDaysForHistory(month, year, level);
}

/** Same cache as attendance — avoids DB on every /api/calendar/active hit */
async function getActiveCalendarForApi() {
  const eng = await getEngine();
  const payload = eng.payload;
  return {
    success: true,
    ...payload,
    terms: (payload.terms || []).map((t) => ({
      ...t,
      start: t.start,
      end: t.end,
      vacationStart: t.vacationStart,
      vacationEnd: t.vacationEnd,
    })),
  };
}

module.exports = {
  buildEngineFromPayload,
  invalidateActiveCalendarCache,
  getEngine,
  loadActivePayload,
  getSchoolDayDecision,
  isSchoolDay,
  getTermDateRange,
  generateSchoolDaysForHistory,
  getActiveCalendarForApi,
  getLegacyCalendarPayload,
};
