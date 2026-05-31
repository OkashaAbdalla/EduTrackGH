/**
 * Pure GES calendar engine built from API payload (same rules as backend calendarRuntime).
 */

import { isWeekend as isWeekendDate, toLocalDate } from './weekend';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dateToIso(d) {
  if (!d) return null;
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return x.toISOString().split('T')[0];
}

function expandRangeIso(start, end) {
  const a = dateToIso(start);
  const b = dateToIso(end);
  if (!a || !b || a > b) return [];
  const out = [];
  let cur = new Date(`${a}T00:00:00Z`);
  const endT = new Date(`${b}T00:00:00Z`);
  while (cur <= endT) {
    out.push(cur.toISOString().split('T')[0]);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/** @param {object} payload — GET /api/calendar/active body (success stripped) */
export function buildEngineFromPayload(payload) {
  if (!payload || !payload.terms?.length) {
    return buildEngineFromPayload(getEmbeddedFallbackPayload());
  }

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

  const globalHolidaySet = new Set(payload.globalHolidayIsoList || []);
  const yearWideHolidaySet = new Set();
  (payload.yearWideHolidays || []).forEach((h) => {
    expandRangeIso(h.startDate, h.endDate).forEach((iso) => yearWideHolidaySet.add(iso));
  });

  const termHolidaySets = new Map();
  (payload.terms || []).forEach((t) => {
    const set = new Set();
    (t.holidays || []).forEach((h) => {
      expandRangeIso(h.startDate, h.endDate).forEach((iso) => set.add(iso));
    });
    termHolidaySets.set(t.name, set);
  });

  const academicYearLabel = payload.academicYear || '—';

  const TERMS_UI = terms.map((t) => ({
    name: t.name,
    label: t.label,
    start: t.start,
    end: t.end,
    vacationStart: t.vacationStart,
    vacationEnd: t.vacationEnd,
  }));

  const TERM_WEEK_COUNTS = {};
  terms.forEach((t) => {
    TERM_WEEK_COUNTS[t.name] = t.numberOfWeeks;
  });

  const toIso = (dateInput) => {
    if (!dateInput) return null;
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  };

  const inRange = (iso, start, end) => iso && start && end && iso >= start && iso <= end;

  function isWeekend(dateInput) {
    const iso = toIso(dateInput);
    if (!iso) return false;
    return isWeekendDate(iso);
  }

  function isHoliday(dateInput) {
    const iso = toIso(dateInput);
    if (!iso) return false;
    if (globalHolidaySet.has(iso) || yearWideHolidaySet.has(iso)) return true;
    const termName = getTermForDate(iso);
    if (!termName) return false;
    const termSet = termHolidaySets.get(termName);
    return termSet ? termSet.has(iso) : false;
  }

  function getTermForDate(dateInput) {
    const iso = toIso(dateInput);
    if (!iso) return null;
    const term = terms.find((t) => inRange(iso, t.start, t.end));
    return term ? term.name : null;
  }

  function isVacation(dateInput) {
    const iso = toIso(dateInput);
    if (!iso) return false;
    return terms.some(
      (t) => t.vacationStart && t.vacationEnd && inRange(iso, t.vacationStart, t.vacationEnd)
    );
  }

  function isBeceDay(dateInput, level) {
    const iso = toIso(dateInput);
    if (!iso || !beceStart || !beceEnd) return false;
    const normalized = String(level || '').toUpperCase().replace(/\s+/g, '');
    const isJhs3 = normalized === 'JHS3' || normalized === 'JHS_3' || normalized === 'JHS-3';
    return isJhs3 && inRange(iso, beceStart, beceEnd);
  }

  function getSchoolDayDecision(dateInput, level) {
    const iso = toIso(dateInput);
    if (!iso) return { isSchoolDay: false, reason: 'invalid_date', termName: null, date: null };
    if (isWeekend(iso)) return { isSchoolDay: false, reason: 'weekend', termName: null, date: iso };

    const sortedByStart = [...terms]
      .filter((t) => t.start)
      .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
    const termName = getTermForDate(iso);

    if (!termName) {
      const nextTerm = sortedByStart.find((t) => iso < t.start);
      if (nextTerm) {
        return { isSchoolDay: false, reason: 'before_resumption', termName: nextTerm.name, date: iso };
      }
      return { isSchoolDay: false, reason: 'term_ended', termName: null, date: iso };
    }

    if (isHoliday(iso)) return { isSchoolDay: false, reason: 'holiday', termName, date: iso };
    if (isVacation(iso)) return { isSchoolDay: false, reason: 'vacation', termName, date: iso };
    if (isBeceDay(iso, level)) return { isSchoolDay: false, reason: 'bece', termName, date: iso };

    return { isSchoolDay: true, reason: 'school_day', termName, date: iso };
  }

  function isSchoolDay(dateInput, level) {
    return getSchoolDayDecision(dateInput, level).isSchoolDay;
  }

  function getCurrentTermInfo(dateInput = new Date()) {
    const iso = toIso(dateInput);
    if (!iso) return null;
    const termName = getTermForDate(iso);
    if (!termName) return null;
    const term = terms.find((t) => t.name === termName);
    if (!term) return null;
    const termHolidays = (payload.terms || []).find((t) => t.name === termName)?.holidays || [];
    return {
      termName,
      label: term.label,
      start: term.start,
      end: term.end,
      vacationStart: term.vacationStart,
      vacationEnd: term.vacationEnd,
      holidays: termHolidays,
      yearWideHolidays: payload.yearWideHolidays || [],
    };
  }

  function getTermDateRange(termName) {
    const t = terms.find((x) => x.name === termName);
    return t ? { start: t.start, end: t.end } : null;
  }

  const enrichSchoolDayEntry = (entry) => {
    const iso = entry?.date;
    if (!iso) return entry;
    const d = toLocalDate(iso);
    if (!d) return entry;
    const wd = d.getDay();
    const dayNum = Number(iso.split('-')[2]);
    const monthIdx = d.getMonth();
    const year = d.getFullYear();
    return {
      ...entry,
      day: dayNum,
      dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][wd],
      monthAbbr: MONTH_ABBR[monthIdx],
      year,
    };
  };

  function generateSchoolDaysForTerm(termName, level) {
    const range = getTermDateRange(termName);
    if (!range) return [];
    const out = [];
    const start = new Date(`${range.start}T00:00:00Z`);
    const end = new Date(`${range.end}T00:00:00Z`);
    const cur = new Date(start);
    while (cur <= end) {
      const iso = cur.toISOString().split('T')[0];
      if (isWeekend(iso) || isHoliday(iso) || isVacation(iso) || !getTermForDate(iso)) {
        cur.setUTCDate(cur.getUTCDate() + 1);
        continue;
      }
      if (isBeceDay(iso, level)) {
        cur.setUTCDate(cur.getUTCDate() + 1);
        continue;
      }
      out.push(enrichSchoolDayEntry({ date: iso, type: 'school' }));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return out;
  }

  function generateSchoolDaysForHistory(month, year, level) {
    const y = Number(year);
    const m = Number(month);
    if (!y || !m) return [];
    const count = new Date(y, m, 0).getDate();
    const out = [];
    for (let d = 1; d <= count; d += 1) {
      const iso = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (isWeekend(iso) || isHoliday(iso) || isVacation(iso) || !getTermForDate(iso)) continue;
      if (isBeceDay(iso, level)) continue;
      out.push(enrichSchoolDayEntry({ date: iso, type: 'school' }));
    }
    return out;
  }

  function getWeekMonthYearLabel(days) {
    if (!days.length) return '';
    const first = days[0];
    const last = days[days.length - 1];
    const y1 = first.year ?? Number(String(first.date || '').slice(0, 4));
    const y2 = last.year ?? Number(String(last.date || '').slice(0, 4));
    const m1 = first.monthAbbr;
    const m2 = last.monthAbbr;
    if (!m1 || !m2) return '';
    if (m1 === m2 && y1 === y2) return `${m1} ${y1}`;
    if (y1 === y2) return `${m1}–${m2} ${y1}`;
    return `${m1} ${y1}–${m2} ${y2}`;
  }

  function buildWeeksForTerm(schoolDays, termName) {
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
        monthLabel: getWeekMonthYearLabel(days),
      });
    }
    return weeks;
  }

  function generateWeekStructure(month, year, level) {
    const days = generateSchoolDaysForHistory(month, year, level);
    const out = [];
    for (let i = 0; i < days.length; i += 5) {
      const slice = days.slice(i, i + 5);
      out.push({
        week: out.length + 1,
        days: slice,
        monthLabel: getWeekMonthYearLabel(slice),
      });
    }
    return out;
  }

  return {
    payload,
    academicYearLabel,
    TERMS: TERMS_UI,
    TERM_WEEK_COUNTS,
    GES_ACADEMIC_YEAR_LABEL: academicYearLabel,
    toIso,
    isWeekend,
    isHoliday,
    isVacation,
    isBeceDay,
    getSchoolDayDecision,
    isSchoolDay,
    getTermForDate,
    getTermDateRange,
    getCurrentTermInfo,
    generateSchoolDaysForTerm,
    generateSchoolDaysForHistory,
    buildWeeksForTerm,
    generateWeekStructure,
    enrichSchoolDayEntry,
    getWeekMonthYearLabel,
  };
}

const STATUTORY = 'Statutory / public holiday';

/** Last-resort embedded fallback (GES 2025/2026) if API unavailable */
function getEmbeddedFallbackPayload() {
  const day = (iso) => ({ name: STATUTORY, startDate: iso, endDate: iso });
  const range = (start, end, name = STATUTORY) => ({ name, startDate: start, endDate: end });
  return {
    academicYear: '2025/2026',
    source: 'embedded-fallback',
    beceStart: '2026-05-04',
    beceEnd: '2026-05-11',
    globalHolidayIsoList: [],
    yearWideHolidays: [],
    terms: [
      {
        name: 'TERM_1',
        label: 'Term 1',
        start: '2025-09-02',
        end: '2025-12-18',
        numberOfWeeks: 15,
        vacationStart: '2025-12-19',
        vacationEnd: '2026-01-07',
        holidays: [
          range('2025-10-31', '2025-11-03', 'Mid-term break'),
          day('2025-09-21'),
          day('2025-12-04'),
        ],
      },
      {
        name: 'TERM_2',
        label: 'Term 2',
        start: '2026-01-08',
        end: '2026-04-01',
        numberOfWeeks: 12,
        vacationStart: '2026-04-02',
        vacationEnd: '2026-04-20',
        holidays: [
          range('2026-02-26', '2026-02-27', 'Mid-term break'),
          day('2026-03-06'),
          range('2026-03-20', '2026-03-21'),
        ],
      },
      {
        name: 'TERM_3',
        label: 'Term 3',
        start: '2026-04-21',
        end: '2026-07-23',
        numberOfWeeks: 13,
        vacationStart: '2026-07-24',
        vacationEnd: '2026-12-31',
        holidays: [
          range('2026-06-04', '2026-06-05', 'Mid-term break'),
          day('2026-05-01'),
          day('2026-05-27'),
          day('2026-07-01'),
        ],
      },
    ],
  };
}

export { getEmbeddedFallbackPayload };
