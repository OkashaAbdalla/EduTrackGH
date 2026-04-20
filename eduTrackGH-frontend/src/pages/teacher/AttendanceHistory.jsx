import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import { useCalendar } from '../../context';
import classroomService from '../../services/classroomService';
import attendanceService from '../../services/attendanceService';

const formatMonthYearHuman = (yyyyMm) => {
  if (!yyyyMm || !/^\d{4}-\d{2}$/.test(yyyyMm)) return yyyyMm;
  const [y, m] = yyyyMm.split('-');
  return new Date(Number(y), Number(m) - 1, 15).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

const historyQueryParams = (periodMode, selectedMonth, selectedTerm) => {
  if (periodMode === 'term') return { term: selectedTerm };
  return { month: selectedMonth };
};

const chipForStatus = (status) => {
  if (status === 'present') {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-green-500/50 bg-green-100 font-mono text-sm font-bold text-green-700 dark:border-green-500/40 dark:bg-green-500/15 dark:text-green-400">
        1
      </span>
    );
  }
  if (status === 'late') {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-amber-500/50 bg-amber-100 font-mono text-sm font-bold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-400">
        1
      </span>
    );
  }
  if (status === 'absent') {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-500/50 bg-red-100 font-mono text-sm font-bold text-red-700 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-400">
        0
      </span>
    );
  }
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-400 border-dashed font-mono text-xs text-gray-500 dark:border-slate-600 dark:text-slate-500">
      -
    </span>
  );
};

const AttendanceHistory = () => {
  const { engine } = useCalendar();
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const todayIso = new Date().toISOString().slice(0, 10);
  const [periodMode, setPeriodMode] = useState('term');
  const [selectedTerm, setSelectedTerm] = useState('TERM_1');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [historyRows, setHistoryRows] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setInitialLoading(true);
        const res = await classroomService.getTeacherClassrooms();
        if (res.success && res.classrooms?.length) {
          setClassrooms(res.classrooms);
          setSelectedClass(res.classrooms[0]._id);
        } else {
          setError('No classrooms assigned. Contact your headteacher.');
        }
      } catch {
        setError('Failed to load classrooms.');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchClassrooms();
  }, []);

  useEffect(() => {
    const t = engine.getTermForDate(todayIso);
    if (t) setSelectedTerm(t);
  }, [engine, todayIso]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedClass) return;
      try {
        setRecordsLoading(true);
        setError(null);
        const res = await attendanceService.getClassroomAttendanceHistory(
          selectedClass,
          historyQueryParams(periodMode, selectedMonth, selectedTerm)
        );
        if (res.success) setHistoryRows(res.historyRows || []);
        else {
          setHistoryRows([]);
          setError(res.message || 'Failed to load attendance records.');
        }
      } catch {
        setHistoryRows([]);
        setError('Error loading attendance records.');
      } finally {
        setRecordsLoading(false);
      }
    };
    fetchHistory();
  }, [selectedClass, periodMode, selectedMonth, selectedTerm]);

  const selectedClassroom = useMemo(
    () => classrooms.find((c) => c._id === selectedClass) || null,
    [classrooms, selectedClass]
  );
  const classLevelRef = selectedClassroom?.grade || selectedClassroom?.level || '';

  const weeks = useMemo(() => {
    if (periodMode === 'term') {
      const days = engine.generateSchoolDaysForTerm(selectedTerm, classLevelRef);
      return engine.buildWeeksForTerm(days, selectedTerm);
    }
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) return [];
    const [yearStr, monthStr] = selectedMonth.split('-');
    const y = Number(yearStr);
    const m = Number(monthStr);
    const structure = engine.generateWeekStructure(m, y, classLevelRef);
    return structure.map((w) => ({
      index: w.week,
      label: `WEEK-${w.week}`,
      days: w.days,
      monthLabel: w.monthLabel,
    }));
  }, [periodMode, selectedTerm, selectedMonth, classLevelRef, engine]);

  const marksMap = useMemo(() => {
    const map = new Map();
    historyRows.forEach((row) => {
      (row.dailyRecords || []).forEach((r) => {
        map.set(`${row.studentId}:${r.date}`, r.status);
      });
    });
    return map;
  }, [historyRows]);

  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    historyRows.forEach((row) => {
      present += row.monthlyTotals?.present || 0;
      absent += row.monthlyTotals?.absent || 0;
      late += row.monthlyTotals?.late || 0;
    });
    const presentEquivalent = present + late;
    const totalMarked = present + absent + late;
    const rate = totalMarked > 0 ? ((presentEquivalent / totalMarked) * 100).toFixed(1) : '0.0';
    return { onRoll: historyRows.length, presentEquivalent, absent, late, rate };
  }, [historyRows]);

  const periodLabelForExport = useMemo(() => {
    if (periodMode === 'term')
      return `${selectedTerm.toLowerCase()}-ges-${engine.GES_ACADEMIC_YEAR_LABEL.replace('/', '-')}`;
    return selectedMonth;
  }, [periodMode, selectedTerm, selectedMonth, engine.GES_ACADEMIC_YEAR_LABEL]);

  const subtitlePeriod = useMemo(() => {
    if (periodMode === 'term') {
      const meta = engine.TERMS.find((t) => t.name === selectedTerm);
      const wk = engine.TERM_WEEK_COUNTS[selectedTerm];
      return meta
        ? `${meta.label} · GES ${engine.GES_ACADEMIC_YEAR_LABEL} · ${wk} weeks (register)`
        : selectedTerm;
    }
    return formatMonthYearHuman(selectedMonth);
  }, [periodMode, selectedTerm, selectedMonth, engine]);

  const exportCsv = () => {
    if (!historyRows.length) return;
    const headers = ['No.', 'Name', 'Roll Number'];
    weeks.forEach((w, wi) => {
      w.days.forEach((d) =>
        headers.push(`W${wi + 1}_${d.monthAbbr || ''}${d.year || ''}_${d.dayName}${d.day}`)
      );
      headers.push(`W${wi + 1}_P`, `W${wi + 1}_A`, `W${wi + 1}_L`);
    });
    headers.push('TERM_P', 'TERM_A', 'TERM_L', 'RATE');

    const rows = historyRows.map((row, idx) => {
      const out = [idx + 1, `"${row.name}"`, row.rollNumber || ''];
      let termP = 0;
      let termA = 0;
      let termL = 0;
      weeks.forEach((w) => {
        let wP = 0;
        let wA = 0;
        let wL = 0;
        w.days.forEach((d) => {
          if (d.type === 'exam') {
            out.push('EXAM');
            return;
          }
          const s = marksMap.get(`${row.studentId}:${d.date}`) || '';
          out.push(s === 'present' ? 'P' : s === 'late' ? 'L' : s === 'absent' ? 'A' : '');
          if (s === 'present') wP += 1;
          else if (s === 'absent') wA += 1;
          else if (s === 'late') wL += 1;
        });
        termP += wP;
        termA += wA;
        termL += wL;
        out.push(wP + wL, wA, wL);
      });
      const rate = (((termP + termL) / Math.max(termP + termA + termL, 1)) * 100).toFixed(1);
      out.push(termP + termL, termA, termL, `${rate}%`);
      return out.join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-history-register-${periodLabelForExport}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportExcel = () => {
    if (!historyRows.length) return;
    let html = '<table><tr><th>No.</th><th>Name</th><th>Roll Number</th>';
    weeks.forEach((w, wi) => {
      w.days.forEach((d) => {
        html += `<th>W${wi + 1} ${d.monthAbbr || ''} ${d.year || ''} ${d.day} ${d.dayName}</th>`;
      });
      html += `<th>W${wi + 1} P</th><th>W${wi + 1} A</th><th>W${wi + 1} L</th>`;
    });
    html += '<th>Term P</th><th>Term A</th><th>Term L</th><th>Rate</th></tr>';

    historyRows.forEach((row, idx) => {
      html += `<tr><td>${idx + 1}</td><td>${row.name}</td><td>${row.rollNumber || ''}</td>`;
      let termP = 0;
      let termA = 0;
      let termL = 0;
      weeks.forEach((w) => {
        let wP = 0;
        let wA = 0;
        let wL = 0;
        w.days.forEach((d) => {
          if (d.type === 'exam') {
            html += '<td>EXAM</td>';
            return;
          }
          const s = marksMap.get(`${row.studentId}:${d.date}`) || '';
          html += `<td>${s === 'present' ? 'P' : s === 'late' ? 'L' : s === 'absent' ? 'A' : ''}</td>`;
          if (s === 'present') wP += 1;
          else if (s === 'absent') wA += 1;
          else if (s === 'late') wL += 1;
        });
        termP += wP;
        termA += wA;
        termL += wL;
        html += `<td>${wP + wL}</td><td>${wA}</td><td>${wL}</td>`;
      });
      html += `<td>${termP + termL}</td><td>${termA}</td><td>${termL}</td><td>${(((termP + termL) / Math.max(termP + termA + termL, 1)) * 100).toFixed(1)}%</td></tr>`;
    });
    html += '</table>';

    const link = document.createElement('a');
    link.href = `data:application/vnd.ms-excel;charset=utf-8,${encodeURIComponent(html)}`;
    link.download = `attendance-history-register-${periodLabelForExport}.xls`;
    link.click();
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-green-600"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your classrooms...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
        <div className="sticky top-0 z-20 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Attendance <span className="text-indigo-600 dark:text-indigo-400">History</span>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-slate-500">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-semibold text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {classrooms.map((cls) => (
                  <option key={cls._id} value={cls._id}>{cls.name} ({cls.grade})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-slate-500">Period</label>
              <div className="flex rounded-md border border-gray-300 bg-gray-100 p-0.5 dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setPeriodMode('term')}
                  className={`rounded px-2 py-1 text-[11px] font-bold ${periodMode === 'term' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  Term
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodMode('month')}
                  className={`rounded px-2 py-1 text-[11px] font-bold ${periodMode === 'month' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  Month
                </button>
              </div>
            </div>
            {periodMode === 'term' ? (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-slate-500">GES term</label>
                <div className="flex flex-wrap gap-1">
                  {engine.TERMS.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => setSelectedTerm(t.name)}
                      className={`rounded-md border px-2 py-1.5 text-[11px] font-bold ${
                        selectedTerm === t.name
                          ? 'border-emerald-500/50 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-slate-500">Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-semibold text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            )}
            <button
              type="button"
              onClick={exportCsv}
              disabled={!historyRows.length}
              className="rounded-md border border-green-500/40 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 disabled:opacity-50 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-400"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={exportExcel}
              disabled={!historyRows.length}
              className="rounded-md border border-emerald-500/40 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 disabled:opacity-50 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"
            >
              Excel
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Print
            </button>
          </div>
        </div>

        <div className="px-4 text-xs text-gray-600 dark:text-slate-400">
          {subtitlePeriod} · {historyRows.length} students on roll
          {periodMode === 'term' && (
            <span className="ml-2 text-gray-500 dark:text-slate-500">· Scroll horizontally to see all {weeks.length} week blocks</span>
          )}
          {periodMode === 'month' && (
            <span className="ml-2 text-gray-500 dark:text-slate-500">· GES {engine.GES_ACADEMIC_YEAR_LABEL}</span>
          )}
        </div>

        {error && (
          <Card className="mx-4 border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </Card>
        )}

        <div className="flex flex-wrap items-center gap-4 px-4 text-xs text-gray-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-green-500/40 bg-green-100 font-mono text-sm font-bold text-green-700 dark:bg-green-500/15 dark:text-green-400">
              1
            </span>
            Present
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-amber-500/40 bg-amber-100 font-mono text-sm font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-400">
              1
            </span>
            Late
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-500/40 bg-red-100 font-mono text-sm font-bold text-red-700 dark:bg-red-500/15 dark:text-red-400">
              0
            </span>
            Absent
          </div>
        </div>

        <div className="overflow-x-auto px-4 pb-4 print:overflow-visible">
          <div className="inline-block min-w-full overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {recordsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-green-600"></div>
              </div>
            ) : (
              <table className="w-max min-w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-600 dark:bg-slate-800/80 dark:text-slate-400">
                    <th rowSpan={2} className="sticky left-0 z-10 w-10 border-r border-gray-200 bg-white px-2 py-2 align-middle text-left dark:border-slate-700 dark:bg-slate-950">
                      #
                    </th>
                    <th rowSpan={2} className="sticky left-10 z-10 w-52 border-r border-gray-200 bg-white px-3 py-2 align-middle text-left dark:border-slate-700 dark:bg-slate-950">
                      Student
                    </th>
                    {weeks.map((w) => (
                      <th
                        key={`wk-${w.index}`}
                        className="border-r border-gray-200 bg-indigo-50 px-2 py-2 text-indigo-900 dark:border-slate-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                        colSpan={Math.max(w.days.length, 0) + 1}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span>{w.label}</span>
                          {w.monthLabel ? (
                            <span className="text-[9px] font-semibold normal-case tracking-normal text-gray-500 dark:text-slate-400">{w.monthLabel}</span>
                          ) : null}
                        </div>
                      </th>
                    ))}
                    <th rowSpan={2} className="border-r border-indigo-200 bg-indigo-100/90 px-2 py-2 align-middle text-indigo-900 dark:border-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                      <div className="text-[10px] uppercase tracking-wider">Term Total</div>
                      <div className="mt-1 text-[9px] font-normal normal-case tracking-normal text-indigo-800 dark:text-indigo-300/90">P / A / L</div>
                    </th>
                    <th rowSpan={2} className="bg-indigo-100/90 px-2 py-2 align-middle text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-200">
                      <div className="text-[10px] uppercase tracking-wider">Rate</div>
                      <div className="mt-1 text-[9px] font-normal">%</div>
                    </th>
                  </tr>
                  <tr className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-600 dark:bg-slate-950 dark:text-slate-500">
                    {weeks.flatMap((w) => [
                      ...w.days.map((day) => (
                        <th key={`day-${w.index}-${day.date}`} className="border-r border-gray-200 px-1.5 py-2.5 text-center dark:border-slate-800">
                          <span className="font-mono text-sm font-bold tabular-nums text-gray-900 dark:text-slate-100">{day.day}</span>
                        </th>
                      )),
                      <th
                        key={`wsub-${w.index}`}
                        className="border-r border-indigo-200 bg-indigo-50 px-2 py-2 text-[9px] text-indigo-900 dark:border-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200"
                      >
                        P / A / L
                      </th>,
                    ])}
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((row, idx) => {
                    let termP = 0;
                    let termA = 0;
                    let termL = 0;
                    const rowBg = idx % 2 === 0 ? 'bg-gray-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-950';
                    return (
                      <tr key={row.studentId} className={rowBg}>
                        <td
                          className={`sticky left-0 z-10 border-r border-gray-200 px-2 py-2 font-mono text-xs text-gray-600 dark:border-slate-800 ${idx % 2 === 0 ? 'bg-gray-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-950'}`}
                        >
                          {idx + 1}
                        </td>
                        <td
                          className={`sticky left-10 z-10 border-r border-gray-200 px-3 py-2 text-left dark:border-slate-800 ${idx % 2 === 0 ? 'bg-gray-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-950'}`}
                        >
                          <div className="truncate text-sm font-bold text-gray-900 dark:text-slate-100">{row.name}</div>
                          <div className="font-mono text-[10px] text-gray-500 dark:text-slate-500">{row.rollNumber || '-'}</div>
                        </td>
                        {weeks.flatMap((w) => {
                          let wP = 0;
                          let wA = 0;
                          let wL = 0;
                          const dayCells = w.days.map((day) => {
                            if (day.type === 'exam') {
                              return (
                                <td key={`${row.studentId}-${day.date}`} className="border-r border-gray-200 px-1 py-2 text-center dark:border-slate-800">
                                  <span className="inline-flex rounded-md border border-gray-400 bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-800 dark:border-slate-500/60 dark:bg-slate-700/40 dark:text-slate-200">
                                    EXAM
                                  </span>
                                </td>
                              );
                            }
                            const status = marksMap.get(`${row.studentId}:${day.date}`);
                            if (status === 'present') wP += 1;
                            else if (status === 'absent') wA += 1;
                            else if (status === 'late') wL += 1;
                            return (
                              <td key={`${row.studentId}-${day.date}`} className="border-r border-gray-200 px-1 py-2 text-center dark:border-slate-800">
                                {chipForStatus(status)}
                              </td>
                            );
                          });
                          termP += wP;
                          termA += wA;
                          termL += wL;
                          dayCells.push(
                            <td
                              key={`wt-${row.studentId}-${w.index}`}
                              className="border-r border-indigo-200 bg-indigo-50/80 px-2 py-1 dark:border-indigo-700 dark:bg-indigo-500/10"
                            >
                              <div className="space-y-0.5 text-left font-mono text-[10px]">
                                <div className="text-green-700 dark:text-green-400">{wP + wL}P</div>
                                <div className="text-red-600 dark:text-red-400">{wA}A</div>
                                <div className="text-amber-700 dark:text-amber-400">{wL}L</div>
                              </div>
                            </td>
                          );
                          return dayCells;
                        })}
                        <td className="border-r border-indigo-200 bg-indigo-100/70 px-2 py-1 dark:border-indigo-700 dark:bg-indigo-500/20">
                          <div className="space-y-0.5 text-left font-mono text-[10px]">
                            <div className="text-green-700 dark:text-green-400">{termP + termL}P</div>
                            <div className="text-red-600 dark:text-red-400">{termA}A</div>
                            <div className="text-amber-700 dark:text-amber-400">{termL}L</div>
                          </div>
                        </td>
                        <td className="bg-indigo-100/70 px-2 py-2 text-center font-mono text-xs font-bold text-gray-900 dark:bg-indigo-500/20 dark:text-slate-100">
                          {(((termP + termL) / Math.max(termP + termA + termL, 1)) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 px-4 pb-4 sm:grid-cols-5">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="font-mono text-2xl font-bold text-gray-900 dark:text-slate-100">{summary.onRoll}</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-500">On Roll</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="font-mono text-2xl font-bold text-green-600 dark:text-green-400">{summary.presentEquivalent}</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-500">Present (incl. late)</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="font-mono text-2xl font-bold text-red-600 dark:text-red-400">{summary.absent}</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-500">Total Absent</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="font-mono text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.late}</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-500">Late Arrivals</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="font-mono text-2xl font-bold text-indigo-700 dark:text-indigo-300">{summary.rate}%</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-500">Overall Rate</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceHistory;
