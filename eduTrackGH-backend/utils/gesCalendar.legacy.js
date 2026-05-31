/**
 * Legacy static GES calendar (2025/2026) — used as fallback when DB has no active calendar,
 * and as the default seed payload.
 */

const { splitGlobalIsoListIntoTermHolidays } = require("./calendarHolidaySplit");

const TERMS = [
  {
    name: "TERM_1",
    label: "Term 1",
    start: "2025-09-02",
    end: "2025-12-18",
    vacationStart: "2025-12-19",
    vacationEnd: "2026-01-07",
  },
  {
    name: "TERM_2",
    label: "Term 2",
    start: "2026-01-08",
    end: "2026-04-01",
    vacationStart: "2026-04-02",
    vacationEnd: "2026-04-20",
  },
  {
    name: "TERM_3",
    label: "Term 3",
    start: "2026-04-21",
    end: "2026-07-23",
    vacationStart: "2026-07-24",
    vacationEnd: "2026-12-31",
  },
];

/** GES two-day mid-term break per term (2025/2026). */
const MID_TERM_BREAKS = {
  TERM_1: { name: "Mid-term break", startDate: "2025-10-31", endDate: "2025-11-03" },
  TERM_2: { name: "Mid-term break", startDate: "2026-02-26", endDate: "2026-02-27" },
  TERM_3: { name: "Mid-term break", startDate: "2026-06-04", endDate: "2026-06-05" },
};

const HOLIDAYS = new Set([
  "2025-09-21",
  "2025-12-04",
  "2025-12-25",
  "2025-12-26",
  "2026-01-01",
  "2026-01-07",
  "2026-03-06",
  "2026-04-03",
  "2026-04-06",
  "2026-05-01",
  "2026-07-01",
  "2026-03-20",
  "2026-03-21",
  "2026-05-27",
]);

const BECE_START = "2026-05-04";
const BECE_END = "2026-05-11";

const TERM_WEEK_COUNTS = { TERM_1: 15, TERM_2: 12, TERM_3: 13 };
const { isWeekend: isWeekendDate } = require("./weekend");

function toIso(dateInput) {
  if (!dateInput) return null;
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

function inRange(iso, start, end) {
  return iso >= start && iso <= end;
}

function isWeekend(dateInput) {
  const iso = toIso(dateInput);
  if (!iso) return false;
  return isWeekendDate(iso);
}

function isHoliday(dateInput) {
  const iso = toIso(dateInput);
  return iso ? HOLIDAYS.has(iso) : false;
}

function isBeceDay(dateInput, level) {
  const iso = toIso(dateInput);
  if (!iso) return false;
  const normalized = String(level || "").toUpperCase().replace(/\s+/g, "");
  const isJhs3 = normalized === "JHS3" || normalized === "JHS_3" || normalized === "JHS-3";
  return isJhs3 && inRange(iso, BECE_START, BECE_END);
}

function getTermForDate(dateInput) {
  const iso = toIso(dateInput);
  if (!iso) return null;
  const term = TERMS.find((t) => inRange(iso, t.start, t.end));
  return term ? term.name : null;
}

function isVacation(dateInput) {
  const iso = toIso(dateInput);
  if (!iso) return false;
  return TERMS.some((t) => inRange(iso, t.vacationStart, t.vacationEnd));
}

function isSchoolDay(dateInput, level) {
  const iso = toIso(dateInput);
  if (!iso) return false;
  return (
    !isWeekend(iso) &&
    !isHoliday(iso) &&
    !isVacation(iso) &&
    !!getTermForDate(iso) &&
    !isBeceDay(iso, level)
  );
}

function generateSchoolDaysForHistory(month, year, level) {
  const y = Number(year);
  const m = Number(month);
  if (!y || !m) return [];
  const count = new Date(y, m, 0).getDate();
  const out = [];
  for (let d = 1; d <= count; d += 1) {
    const iso = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (isWeekend(iso) || isHoliday(iso) || isVacation(iso) || !getTermForDate(iso)) continue;
    if (isBeceDay(iso, level)) continue;
    out.push({ date: iso, type: "school" });
  }
  return out;
}

function getTermDateRange(termName) {
  const t = TERMS.find((x) => x.name === termName);
  return t ? { start: t.start, end: t.end } : null;
}

function buildTermHolidaysForSeed() {
  const boundaries = TERMS.map((t) => ({
    termKey: t.name,
    start: t.start,
    end: t.end,
    vacationStart: t.vacationStart,
    vacationEnd: t.vacationEnd,
  }));
  const statutory = splitGlobalIsoListIntoTermHolidays(Array.from(HOLIDAYS), boundaries);
  const out = {};
  TERMS.forEach((t) => {
    const mid = MID_TERM_BREAKS[t.name];
    out[t.name] = [...(mid ? [mid] : []), ...(statutory[t.name] || [])];
  });
  return out;
}

/** Unified payload shape for calendarRuntime + frontend */
function getLegacyCalendarPayload() {
  const holidaysByTerm = buildTermHolidaysForSeed();
  return {
    academicYear: "2025/2026",
    source: "legacy",
    beceStart: BECE_START,
    beceEnd: BECE_END,
    globalHolidayIsoList: Array.from(HOLIDAYS),
    terms: TERMS.map((t) => ({
      name: t.name,
      label: t.label || t.name.replace("TERM_", "Term "),
      start: t.start,
      end: t.end,
      numberOfWeeks: TERM_WEEK_COUNTS[t.name] || 12,
      vacationStart: t.vacationStart,
      vacationEnd: t.vacationEnd,
      holidays: holidaysByTerm[t.name] || [],
    })),
  };
}

module.exports = {
  TERMS,
  HOLIDAYS,
  MID_TERM_BREAKS,
  BECE_START,
  BECE_END,
  TERM_WEEK_COUNTS,
  toIso,
  isSchoolDay,
  isVacation,
  isHoliday,
  isWeekend,
  isBeceDay,
  getTermForDate,
  generateSchoolDaysForHistory,
  getTermDateRange,
  buildTermHolidaysForSeed,
  getLegacyCalendarPayload,
};
