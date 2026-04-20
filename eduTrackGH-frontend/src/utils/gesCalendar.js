/**
 * @deprecated Prefer useCalendar() + gesCalendarEngine for DB-backed GES rules.
 * Static compatibility layer (embedded fallback).
 */
import { buildEngineFromPayload, getEmbeddedFallbackPayload } from './gesCalendarEngine';

const _e = buildEngineFromPayload(getEmbeddedFallbackPayload());

export const TERMS = _e.TERMS;
export const TERM_WEEK_COUNTS = _e.TERM_WEEK_COUNTS;
export const GES_ACADEMIC_YEAR_LABEL = _e.GES_ACADEMIC_YEAR_LABEL;
export const getTermDateRange = (...a) => _e.getTermDateRange(...a);
export const generateSchoolDaysForTerm = (...a) => _e.generateSchoolDaysForTerm(...a);
export const buildWeeksForTerm = (...a) => _e.buildWeeksForTerm(...a);
export const generateWeekStructure = (...a) => _e.generateWeekStructure(...a);
export const getTermForDate = (...a) => _e.getTermForDate(...a);
export const isSchoolDay = (...a) => _e.isSchoolDay(...a);
export const generateSchoolDaysForHistory = (...a) => _e.generateSchoolDaysForHistory(...a);
export const enrichSchoolDayEntry = (...a) => _e.enrichSchoolDayEntry(...a);
export const getWeekMonthYearLabel = (...a) => _e.getWeekMonthYearLabel(...a);
export const getWeekMonthLabel = (...a) => _e.getWeekMonthYearLabel(...a);
export const isWeekend = (...a) => _e.isWeekend(...a);
export const isHoliday = (...a) => _e.isHoliday(...a);
export const isVacation = (...a) => _e.isVacation(...a);
export const isBeceDay = (...a) => _e.isBeceDay(...a);
export const filterValidSchoolDays = (daysArray, level) =>
  (daysArray || []).filter((d) => _e.isSchoolDay(d, level) || _e.isBeceDay(d, level));
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
    if (d.status === 'present') present += 1;
    else if (d.status === 'absent') absent += 1;
    else if (d.status === 'late') late += 1;
  });
  return { present: present + late, absent, late };
};
export const calculateMonthlyTotals = (weeklyTotals) =>
  (weeklyTotals || []).reduce(
    (acc, w) => ({
      present: acc.present + (w.present || 0),
      absent: acc.absent + (w.absent || 0),
      late: acc.late + (w.late || 0),
    }),
    { present: 0, absent: 0, late: 0 }
  );
export const formatExamDayCell = () => 'EXAM';
