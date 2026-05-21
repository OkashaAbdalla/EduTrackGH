/**
 * Attendance register stats — derived only from marks on school days shown in the grid.
 * Keeps row totals, summary cards, and rates aligned with visible cells.
 */

export function schoolDaysFromWeeks(weeks) {
  return (weeks || []).flatMap((w) => (w.days || []).filter((d) => d.type !== 'exam'));
}

export function countMarksForStudent(studentId, schoolDays, marksMap) {
  let present = 0;
  let absent = 0;
  let late = 0;
  for (const day of schoolDays) {
    const status = marksMap.get(`${studentId}:${day.date}`);
    if (status === 'present') present += 1;
    else if (status === 'absent') absent += 1;
    else if (status === 'late') late += 1;
  }
  return { present, absent, late };
}

/** Present-equivalent count (present + late) for GES-style attendance rate. */
export function presentEquivalent(present, late) {
  return present + late;
}

export function markedTotal(present, absent, late) {
  return present + absent + late;
}

export function attendanceRatePercent(present, absent, late) {
  const marked = markedTotal(present, absent, late);
  if (marked === 0) return '0.0';
  return ((presentEquivalent(present, late) / marked) * 100).toFixed(1);
}

export function aggregateRegisterStats(historyRows, weeks, marksMap) {
  const schoolDays = schoolDaysFromWeeks(weeks);
  let present = 0;
  let absent = 0;
  let late = 0;

  for (const row of historyRows || []) {
    const counts = countMarksForStudent(row.studentId, schoolDays, marksMap);
    present += counts.present;
    absent += counts.absent;
    late += counts.late;
  }

  return {
    onRoll: (historyRows || []).length,
    present,
    absent,
    late,
    presentEquivalent: presentEquivalent(present, late),
    rate: attendanceRatePercent(present, absent, late),
  };
}
