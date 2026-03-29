/**
 * Frontend GES Calendar Engine (2025/2026) - Primary & JHS only.
 * Mirrors backend rules (no mid-term logic).
 */

/** GES 2025/2026 — expected instructional weeks per term (register columns). */
export const TERM_WEEK_COUNTS = {
  TERM_1: 15,
  TERM_2: 12,
  TERM_3: 13,
};

export const TERMS = [
  { name: "TERM_1", label: "Term 1", start: "2025-09-02", end: "2025-12-18", vacationStart: "2025-12-19", vacationEnd: "2026-01-06" },
  { name: "TERM_2", label: "Term 2", start: "2026-01-08", end: "2026-04-01", vacationStart: "2026-04-02", vacationEnd: "2026-04-20" },
  { name: "TERM_3", label: "Term 3", start: "2026-04-21", end: "2026-07-23", vacationStart: "2026-07-24", vacationEnd: "2026-12-31" },
];

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

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toIso = (dateInput) => {
  if (!dateInput) return null;
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
};

export const getTermDateRange = (termName) => {
  const t = TERMS.find((x) => x.name === termName);
  return t ? { start: t.start, end: t.end } : null;
};

/** Enrich calendar entries with display fields (month abbr, day number). */
export const enrichSchoolDayEntry = (entry) => {
  const iso = entry?.date;
  if (!iso) return entry;
  const d = new Date(`${iso}T00:00:00Z`);
  const wd = d.getUTCDay();
  const dayNum = Number(iso.split("-")[2]);
  const monthIdx = d.getUTCMonth();
  return {
    ...entry,
    day: dayNum,
    dayName: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][wd],
    monthAbbr: MONTH_ABBR[monthIdx],
  };
};

/**
 * All valid school days (and JHS3 BECE exam days) in a GES term, in chronological order.
 */
export const generateSchoolDaysForTerm = (termName, level) => {
  const range = getTermDateRange(termName);
  if (!range) return [];
  const out = [];
  const start = new Date(`${range.start}T00:00:00Z`);
  const end = new Date(`${range.end}T00:00:00Z`);
  const cur = new Date(start);
  while (cur <= end) {
    const iso = cur.toISOString().split("T")[0];
    if (isWeekend(iso) || isHoliday(iso) || isVacation(iso) || !getTermForDate(iso)) {
      cur.setUTCDate(cur.getUTCDate() + 1);
      continue;
    }
    if (isBeceDay(iso, level)) out.push(enrichSchoolDayEntry({ date: iso, type: "exam" }));
    else out.push(enrichSchoolDayEntry({ date: iso, type: "school" }));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
};

/**
 * Split term school days into WEEK-1..N (5 school days per week). Ensures at least
 * TERM_WEEK_COUNTS[termName] columns; pads with empty weeks if needed; extends if more data exists.
 */
export const buildWeeksForTerm = (schoolDays, termName) => {
  const expected = TERM_WEEK_COUNTS[termName] || 12;
  const chunks = [];
  for (let i = 0; i < (schoolDays || []).length; i += 5) {
    chunks.push(schoolDays.slice(i, i + 5));
  }
  const weekCount = Math.max(expected, chunks.length);
  const weeks = [];
  for (let w = 0; w < weekCount; w += 1) {
    const days = chunks[w] || [];
    weeks.push({
      index: w + 1,
      label: `WEEK-${w + 1}`,
      days,
      monthLabel: getWeekMonthLabel(days),
    });
  }
  return weeks;
};

/** Short label for week header: one month or "Jan–Mar". */
export const getWeekMonthLabel = (days) => {
  if (!days.length) return "";
  const months = [...new Set(days.map((d) => d.monthAbbr).filter(Boolean))];
  if (months.length <= 1) return months[0] || "";
  return `${months[0]}–${months[months.length - 1]}`;
};

const inRange = (iso, start, end) => iso >= start && iso <= end;

export const isWeekend = (dateInput) => {
  const d = new Date(`${toIso(dateInput)}T00:00:00Z`);
  const wd = d.getUTCDay();
  return wd === 0 || wd === 6;
};

export const isHoliday = (dateInput) => {
  const iso = toIso(dateInput);
  return iso ? HOLIDAYS.has(iso) : false;
};

export const isBeceDay = (dateInput, level) => {
  const iso = toIso(dateInput);
  if (!iso) return false;
  const normalized = String(level || "").toUpperCase().replace(/\s+/g, "");
  const isJhs3 = normalized === "JHS3" || normalized === "JHS_3" || normalized === "JHS-3";
  return isJhs3 && inRange(iso, BECE_START, BECE_END);
};

export const getTermForDate = (dateInput) => {
  const iso = toIso(dateInput);
  if (!iso) return null;
  const term = TERMS.find((t) => inRange(iso, t.start, t.end));
  return term ? term.name : null;
};

export const isVacation = (dateInput) => {
  const iso = toIso(dateInput);
  if (!iso) return false;
  return TERMS.some((t) => inRange(iso, t.vacationStart, t.vacationEnd));
};

export const isSchoolDay = (dateInput, level) => {
  const iso = toIso(dateInput);
  if (!iso) return false;
  return !isWeekend(iso) && !isHoliday(iso) && !isVacation(iso) && !!getTermForDate(iso) && !isBeceDay(iso, level);
};

export const generateSchoolDaysForHistory = (month, year, level) => {
  const y = Number(year);
  const m = Number(month);
  if (!y || !m) return [];
  const count = new Date(y, m, 0).getDate();
  const out = [];
  for (let d = 1; d <= count; d += 1) {
    const iso = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (isWeekend(iso) || isHoliday(iso) || isVacation(iso) || !getTermForDate(iso)) continue;
    if (isBeceDay(iso, level)) out.push(enrichSchoolDayEntry({ date: iso, type: "exam" }));
    else out.push(enrichSchoolDayEntry({ date: iso, type: "school" }));
  }
  return out;
};

// Helper utilities requested
export const generateWeekStructure = (month, year, level) => {
  const days = generateSchoolDaysForHistory(month, year, level);
  const out = [];
  for (let i = 0; i < days.length; i += 5) {
    const slice = days.slice(i, i + 5);
    out.push({
      week: out.length + 1,
      days: slice,
      monthLabel: getWeekMonthLabel(slice),
    });
  }
  return out;
};

export const filterValidSchoolDays = (daysArray, level) =>
  (daysArray || []).filter((d) => isSchoolDay(d, level) || isBeceDay(d, level));

export const mapAttendanceToDays = (studentRecords, validDays) => {
  const map = new Map();
  (studentRecords || []).forEach((r) => map.set(r.date, r.status));
  return (validDays || []).map((d) => ({ ...d, status: map.get(d.date) || null }));
};

export const calculateWeeklyTotals = (mappedDays) => {
  let present = 0;
  let absent = 0;
  let late = 0;
  (mappedDays || []).forEach((d) => {
    if (d.status === "present") present += 1;
    else if (d.status === "absent") absent += 1;
    else if (d.status === "late") late += 1;
  });
  return { present: present + late, absent, late };
};

export const calculateMonthlyTotals = (weeklyTotals) => {
  return (weeklyTotals || []).reduce(
    (acc, w) => ({
      present: acc.present + (w.present || 0),
      absent: acc.absent + (w.absent || 0),
      late: acc.late + (w.late || 0),
    }),
    { present: 0, absent: 0, late: 0 }
  );
};

export const formatExamDayCell = () => "EXAM";

