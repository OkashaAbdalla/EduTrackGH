/**
 * Styled Excel export for class attendance register — matches on-screen grid colors/structure.
 */

import {
  attendanceRatePercent,
  countMarksForStudent,
  presentEquivalent,
  schoolDaysFromWeeks,
} from './attendanceRegisterStats';

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function statusCell(status) {
  if (status === 'present') {
    return `<td style="border:1px solid #86efac;background:#dcfce7;color:#15803d;font-family:Consolas,monospace;font-weight:bold;text-align:center;padding:3px;">1</td>`;
  }
  if (status === 'late') {
    return `<td style="border:1px solid #fcd34d;background:#fef3c7;color:#92400e;font-family:Consolas,monospace;font-weight:bold;text-align:center;padding:3px;">1</td>`;
  }
  if (status === 'absent') {
    return `<td style="border:1px solid #fca5a5;background:#fee2e2;color:#b91c1c;font-family:Consolas,monospace;font-weight:bold;text-align:center;padding:3px;">0</td>`;
  }
  return `<td style="border:1px dashed #94a3b8;background:#f8fafc;color:#64748b;font-family:Consolas,monospace;text-align:center;padding:3px;">-</td>`;
}

function examCell() {
  return `<td style="border:1px solid #94a3b8;background:#e2e8f0;color:#334155;font-size:9px;font-weight:bold;text-align:center;padding:3px;">EXAM</td>`;
}

function weekSummaryCell(p, a, l) {
  return `<td style="border:1px solid #a5b4fc;background:#eef2ff;color:#312e81;font-family:Consolas,monospace;font-size:9px;text-align:left;padding:3px 4px;vertical-align:middle;">
    <div style="color:#15803d;">${presentEquivalent(p, l)}P</div>
    <div style="color:#b91c1c;">${a}A</div>
    <div style="color:#92400e;">${l}L</div>
  </td>`;
}

/**
 * @param {object} opts
 * @param {object[]} opts.historyRows
 * @param {object[]} opts.weeks
 * @param {Map<string,string>} opts.marksMap
 * @param {string} opts.subtitlePeriod
 * @param {string} [opts.className]
 * @param {string} [opts.exportFilePrefix]
 * @param {string} [opts.periodLabelForExport]
 */
export function downloadStyledRegisterExcel({
  historyRows,
  weeks,
  marksMap,
  subtitlePeriod,
  className = '',
  exportFilePrefix = 'class-register',
  periodLabelForExport = 'export',
}) {
  if (!historyRows.length) return;

  const schoolDays = schoolDaysFromWeeks(weeks);
  const th = 'border:1px solid #cbd5e1;padding:4px 6px;font-size:9px;font-weight:bold;text-align:center;vertical-align:middle;';
  const thWeek = `${th}background:#e0e7ff;color:#312e81;border-color:#a5b4fc;`;
  const thDay = `${th}background:#f8fafc;color:#475569;`;
  const thIndigo = `${th}background:#c7d2fe;color:#312e81;border-color:#a5b4fc;`;
  const thSticky = `${th}background:#ffffff;color:#0f172a;text-align:left;`;

  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="UTF-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Register</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  table { border-collapse: collapse; font-family: Segoe UI, Arial, sans-serif; }
  td, th { mso-number-format:\\@; }
</style></head><body>`;

  html += `<div style="font-family:Segoe UI,Arial,sans-serif;margin-bottom:8px;">
    <div style="font-size:16px;font-weight:800;color:#0f172a;">Class Register</div>
    <div style="font-size:11px;color:#475569;margin-top:2px;">${esc(subtitlePeriod)}${className ? ` · ${esc(className)}` : ''} · ${historyRows.length} students</div>
  </div>`;

  html += `<table style="border-collapse:collapse;">`;

  // Row 1 — week blocks + term totals
  html += `<tr><th rowspan="2" style="${thSticky}width:28px;">#</th>`;
  html += `<th rowspan="2" style="${thSticky}width:160px;">Student</th>`;
  weeks.forEach((w) => {
    const colSpan = Math.max(w.days.length, 0) + 1;
    html += `<th colspan="${colSpan}" style="${thWeek}">${esc(w.label)}${w.monthLabel ? `<br/><span style="font-weight:normal;font-size:8px;">${esc(w.monthLabel)}</span>` : ''}</th>`;
  });
  html += `<th rowspan="2" style="${thIndigo}">Term Total<br/><span style="font-weight:normal;font-size:8px;">P / A / L</span></th>`;
  html += `<th rowspan="2" style="${thIndigo}width:48px;">Rate<br/><span style="font-weight:normal;font-size:8px;">%</span></th></tr>`;

  // Row 2 — day numbers + week P/A/L subheaders
  html += '<tr>';
  weeks.forEach((w) => {
    w.days.forEach((day) => {
      html += `<th style="${thDay}">${esc(String(day.day))}</th>`;
    });
    html += `<th style="${thIndigo}font-size:8px;">P / A / L</th>`;
  });
  html += '</tr>';

  // Data rows
  historyRows.forEach((row, idx) => {
    const periodCounts = countMarksForStudent(row.studentId, schoolDays, marksMap);
    const termP = periodCounts.present;
    const termA = periodCounts.absent;
    const termL = periodCounts.late;
    const rowRate = attendanceRatePercent(termP, termA, termL);
    const rowBg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';

    html += `<tr><td style="border:1px solid #e2e8f0;background:${rowBg};font-family:Consolas,monospace;font-size:10px;padding:3px 4px;text-align:center;">${idx + 1}</td>`;
    html += `<td style="border:1px solid #e2e8f0;background:${rowBg};font-size:10px;font-weight:600;padding:3px 6px;text-align:left;">${esc(row.name)}</td>`;

    weeks.forEach((w) => {
      let wP = 0;
      let wA = 0;
      let wL = 0;
      w.days.forEach((day) => {
        if (day.type === 'exam') {
          html += examCell();
          return;
        }
        const status = marksMap.get(`${row.studentId}:${day.date}`);
        if (status === 'present') wP += 1;
        else if (status === 'absent') wA += 1;
        else if (status === 'late') wL += 1;
        html += statusCell(status);
      });
      html += weekSummaryCell(wP, wA, wL);
    });

    html += weekSummaryCell(termP, termA, termL);
    html += `<td style="border:1px solid #a5b4fc;background:#eef2ff;color:#0f172a;font-family:Consolas,monospace;font-weight:bold;font-size:11px;text-align:center;padding:3px;">${rowRate}%</td>`;
    html += '</tr>';
  });

  html += '</table>';

  // Legend
  html += `<div style="margin-top:10px;font-size:9px;color:#475569;font-family:Segoe UI,Arial,sans-serif;">
    <span style="display:inline-block;margin-right:12px;"><span style="background:#dcfce7;color:#15803d;border:1px solid #86efac;padding:1px 5px;font-weight:bold;">1</span> Present</span>
    <span style="display:inline-block;margin-right:12px;"><span style="background:#fef3c7;color:#92400e;border:1px solid #fcd34d;padding:1px 5px;font-weight:bold;">1</span> Late</span>
    <span style="display:inline-block;"><span style="background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;padding:1px 5px;font-weight:bold;">0</span> Absent</span>
  </div>`;

  html += '</body></html>';

  const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${exportFilePrefix}-${periodLabelForExport}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
}
