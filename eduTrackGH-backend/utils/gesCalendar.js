/**
 * GES Calendar Engine (2025/2026) - Primary & JHS only.
 * No mid-term logic by design.
 */

const TERMS = [
  {
    name: "TERM_1",
    start: "2025-09-02",
    end: "2025-12-18",
    vacationStart: "2025-12-19",
    vacationEnd: "2026-01-06",
  },
  {
    name: "TERM_2",
    start: "2026-01-08",
    end: "2026-04-01",
    vacationStart: "2026-04-02",
    vacationEnd: "2026-04-20",
  },
  {
    name: "TERM_3",
    start: "2026-04-21",
    end: "2026-07-23",
    vacationStart: "2026-07-24",
    vacationEnd: "2026-12-31",
  },
];

// Public holidays for 2025/2026 policy window.
// Movable Islamic holidays are represented for these academic years.
const HOLIDAYS = new Set([
  "2025-09-21", // Founders' Day
  "2025-12-04", // Farmers' Day
  "2025-12-25", // Christmas
  "2025-12-26", // Boxing Day
  "2026-01-01", // New Year's Day
  "2026-01-07", // Constitution Day
  "2026-03-06", // Independence Day
  "2026-04-03", // Good Friday
  "2026-04-06", // Easter Monday
  "2026-05-01", // Labour Day
  "2026-07-01", // Republic Day
  // Islamic observances (2026 projected window)
  "2026-03-20", // Eid ul-Fitr (projected)
  "2026-03-21", // Shaqq Day
  "2026-05-27", // Eid ul-Adha (projected)
]);

const BECE_START = "2026-05-04";
const BECE_END = "2026-05-11";

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
  const d = new Date(`${toIso(dateInput)}T00:00:00Z`);
  const wd = d.getUTCDay();
  return wd === 0 || wd === 6;
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
    if (isBeceDay(iso, level)) {
      out.push({ date: iso, type: "exam" });
      continue;
    }
    out.push({ date: iso, type: "school" });
  }
  return out;
}

/** @param {string} termName e.g. TERM_1 */
function getTermDateRange(termName) {
  const t = TERMS.find((x) => x.name === termName);
  return t ? { start: t.start, end: t.end } : null;
}

module.exports = {
  isSchoolDay,
  isVacation,
  isHoliday,
  isWeekend,
  isBeceDay,
  getTermForDate,
  generateSchoolDaysForHistory,
  getTermDateRange,
};

