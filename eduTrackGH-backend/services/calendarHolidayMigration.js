/**
 * Move yearWideHolidays from Term 1 rows into each term's holidays array,
 * and normalize duplicate / vacation-period holiday rows.
 */

const Calendar = require("../models/Calendar");
const {
  boundariesFromCalendarDocs,
  splitHolidaysIntoTerms,
  normalizeTermHolidays,
  boundaryForTermKey,
  toMongoHolidayEntries,
  holidayListSignature,
} = require("../utils/calendarHolidaySplit");

function normalizeHolidaysForDocs(docs) {
  const boundaries = boundariesFromCalendarDocs(docs);
  let changed = 0;

  for (const doc of docs) {
    const boundary = boundaryForTermKey(boundaries, doc.termKey);
    if (!boundary) continue;

    const normalized = toMongoHolidayEntries(
      normalizeTermHolidays(doc.holidays || [], boundary)
    );
    if (holidayListSignature(doc.holidays) !== holidayListSignature(normalized)) {
      doc.holidays = normalized;
      changed += 1;
    }
  }

  return changed;
}

async function normalizeHolidaysForYear(academicYear) {
  const docs = await Calendar.find({
    academicYear,
    isDeleted: { $ne: true },
  }).sort({ termKey: 1 });

  if (docs.length === 0) {
    return { academicYear, changed: 0, message: "No calendar rows for this year" };
  }

  const changed = normalizeHolidaysForDocs(docs);
  for (const doc of docs) {
    await doc.save();
  }

  return {
    academicYear,
    changed,
    message:
      changed > 0
        ? `Cleaned holiday rows on ${changed} term(s) for ${academicYear}`
        : `Holiday rows already clean for ${academicYear}`,
    perTerm: Object.fromEntries(
      docs.map((d) => [d.termKey, (d.holidays || []).length])
    ),
  };
}

async function normalizeAllHolidays(academicYearFilter) {
  const query = { isDeleted: { $ne: true } };
  if (academicYearFilter) query.academicYear = academicYearFilter;

  const rows = await Calendar.find(query).select("academicYear").lean();
  const years = [...new Set(rows.map((r) => r.academicYear))];
  const results = [];
  for (const y of years) {
    results.push(await normalizeHolidaysForYear(y));
  }
  return { results, totalYears: years.length };
}

async function splitYearWideHolidaysForYear(academicYear) {
  const docs = await Calendar.find({
    academicYear,
    isDeleted: { $ne: true },
  }).sort({ termKey: 1 });

  if (docs.length === 0) {
    return { academicYear, moved: 0, message: "No calendar rows for this year" };
  }

  const t1 = docs.find((d) => d.termKey === "TERM_1");
  const yearWide = t1?.yearWideHolidays || [];
  const boundaries = boundariesFromCalendarDocs(docs);
  let moved = 0;

  if (yearWide.length) {
    const byTerm = splitHolidaysIntoTerms(yearWide, boundaries);
    for (const doc of docs) {
      const boundary = boundaryForTermKey(boundaries, doc.termKey);
      const fromYearWide = toMongoHolidayEntries(byTerm[doc.termKey] || []);
      const merged = [...(doc.holidays || []), ...fromYearWide];
      doc.holidays = toMongoHolidayEntries(normalizeTermHolidays(merged, boundary));

      if (doc.termKey === "TERM_1") {
        doc.yearWideHolidays = [];
      }
      moved += 1;
      await doc.save();
    }
  } else {
    const changed = normalizeHolidaysForDocs(docs);
    for (const doc of docs) {
      await doc.save();
    }
    moved = changed;
  }

  return {
    academicYear,
    moved,
    message: yearWide.length
      ? `Moved ${yearWide.length} year-wide holiday entries into term-specific holidays`
      : moved > 0
        ? `Cleaned duplicate holiday rows on ${moved} term(s)`
        : "Holiday rows already clean",
    perTerm: Object.fromEntries(
      docs.map((d) => [d.termKey, (d.holidays || []).length])
    ),
  };
}

async function splitAllYearWideHolidays(academicYearFilter) {
  const query = { isDeleted: { $ne: true }, termKey: "TERM_1", "yearWideHolidays.0": { $exists: true } };
  if (academicYearFilter) query.academicYear = academicYearFilter;

  const t1Rows = await Calendar.find(query).select("academicYear").lean();
  const yearsFromYearWide = [...new Set(t1Rows.map((r) => r.academicYear))];

  if (yearsFromYearWide.length === 0) {
    return normalizeAllHolidays(academicYearFilter);
  }

  const results = [];
  for (const y of yearsFromYearWide) {
    results.push(await splitYearWideHolidaysForYear(y));
  }
  return { results, totalYears: yearsFromYearWide.length };
}

module.exports = {
  normalizeHolidaysForYear,
  normalizeAllHolidays,
  splitYearWideHolidaysForYear,
  splitAllYearWideHolidays,
};
