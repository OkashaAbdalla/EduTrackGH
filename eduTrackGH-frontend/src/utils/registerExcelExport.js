/**
 * EduTrack GH — Class Registers dashboard Excel export.
 * HTML-for-Excel layout mirroring the dark-mode Class Registers UI.
 */

import {
  attendanceRatePercent,
  countMarksForStudent,
  presentEquivalent,
  schoolDaysFromWeeks,
} from './attendanceRegisterStats';

/** Exact dark-dashboard palette (Tailwind dark + screenshot) */
const C = {
  page: '#0f172a',
  surface: '#020617',
  card: '#0f172a',
  cardBorder: '#1e293b',
  headerBar: '#111827',
  label: '#64748b',
  labelBright: '#94a3b8',
  text: '#f8fafc',
  textMuted: '#cbd5e1',
  accent: '#818cf8',
  accentIndigo: '#a5b4fc',
  weekBg: '#1e1b4b',
  weekBgSoft: '#151b33',
  weekBorder: '#4338ca',
  rowA: '#0f172a',
  rowB: '#020617',
  presentFill: '#14532d',
  presentBorder: '#22c55e',
  presentGlow: '#166534',
  lateFill: '#78350f',
  lateBorder: '#f59e0b',
  absentFill: '#7f1d1d',
  absentBorder: '#ef4444',
  emptyBorder: '#475569',
  emptyText: '#64748b',
  green: '#4ade80',
  amber: '#fbbf24',
  red: '#f87171',
  indigo: '#818cf8',
  examBg: '#334155',
  examText: '#e2e8f0',
  white: '#ffffff',
};

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const NW = 'white-space:nowrap;word-wrap:normal;mso-wrap-style:none;';
const FONT = "font-family:Calibri,'Segoe UI',Arial,sans-serif;";

const colPt = (pt) =>
  `<col style="mso-width-source:userset;mso-width-alt:${Math.round(pt * 28.35)};width:${pt}pt" />`;

function td(style, html, bg = '', extra = '') {
  const b = bg ? ` bgcolor="${bg}"` : '';
  return `<td${b} ${extra} style="${style}">${html}</td>`;
}

function th(style, html, bg = '', extra = '') {
  const b = bg ? ` bgcolor="${bg}"` : '';
  return `<th${b} ${extra} style="${style}">${html}</th>`;
}

function numTd(style, n, bg = '', extra = '') {
  const b = bg ? ` bgcolor="${bg}"` : '';
  return `<td${b} ${extra} x:num="${n}" style="${style}">${n}</td>`;
}

function numTh(style, n, bg = '', extra = '') {
  const b = bg ? ` bgcolor="${bg}"` : '';
  return `<th${b} ${extra} x:num="${n}" style="${style}">${n}</th>`;
}

function spacerRow(cols, h = 10) {
  return `<tr><td colspan="${cols}" bgcolor="${C.page}" style="border:none;background:${C.page};height:${h}pt;font-size:1px;">&nbsp;</td></tr>`;
}

/** Dashboard pill badge */
function metaPill(label, value) {
  return `<span style="display:inline-block;margin:0 10px 8px 0;padding:6px 12px;background:${C.card};border:1px solid ${C.cardBorder};border-radius:6px;${FONT}">
    <span style="font-size:9px;font-weight:bold;color:${C.label};text-transform:uppercase;letter-spacing:0.08em;">${esc(label)}</span>
    <span style="font-size:12px;font-weight:700;color:#FFFFFF;margin-left:6px;">${esc(value)}</span>
  </span>`;
}

/** Status legend chip */
function statusBadge(bg, border, glyph, label) {
  return `<span style="display:inline-block;margin-right:18px;vertical-align:middle;">
    <span style="display:inline-block;min-width:26px;height:26px;line-height:24px;text-align:center;background:${bg};border:2px solid ${border};color:${C.white};font-weight:800;font-size:13px;border-radius:4px;margin-right:8px;${FONT}">${glyph}</span>
    <span style="font-size:13px;font-weight:600;color:${C.textMuted};${FONT}">${label}</span>
  </span>`;
}

function markCell(status, rowBg) {
  const base = `${NW}${FONT}text-align:center;vertical-align:middle;font-size:16px;font-weight:800;padding:10px 6px;width:44pt;min-width:44pt;height:40pt;mso-height-source:userset;border:2px solid;`;

  if (status === 'present') {
    return numTd(
      `${base}background:${C.presentFill};border-color:${C.presentBorder};color:${C.white};`,
      1,
      C.presentFill
    );
  }
  if (status === 'late') {
    return numTd(
      `${base}background:${C.lateFill};border-color:${C.lateBorder};color:${C.white};`,
      1,
      C.lateFill
    );
  }
  if (status === 'absent') {
    return numTd(
      `${base}background:${C.absentFill};border-color:${C.absentBorder};color:${C.white};`,
      0,
      C.absentFill
    );
  }
  return td(
    `${base}background:${rowBg};border:1px dashed ${C.emptyBorder};color:${C.emptyText};font-weight:700;font-size:14px;`,
    '–',
    rowBg
  );
}

function weekPalCell(p, a, l, strong = false) {
  const bg = strong ? C.weekBg : C.weekBgSoft;
  return td(
    `${NW}width:56pt;min-width:56pt;border:1px solid ${C.weekBorder};background:${bg};${FONT}font-size:12px;text-align:center;vertical-align:middle;padding:10px 6px;line-height:1.7;mso-number-format:"\\@";`,
    `<font color="${C.green}"><b>${presentEquivalent(p, l)}P</b></font><br/>` +
      `<font color="${C.red}"><b>${a}A</b></font><br/>` +
      `<font color="${C.amber}"><b>${l}L</b></font>`,
    bg
  );
}

function summaryCard(value, label, valueColor, widthPt = 118) {
  return td(
    `${NW}width:${widthPt}pt;min-width:${widthPt}pt;border:1px solid ${C.cardBorder};background:${C.card};text-align:center;vertical-align:middle;padding:16px 12px;`,
    `<font color="${valueColor}"><span style="${FONT}font-size:30px;font-weight:800;font-family:Consolas,Monaco,monospace;line-height:1.2;">${esc(String(value))}</span></font>` +
      `<br/><font color="${C.labelBright}"><span style="${FONT}font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;line-height:1.4;">${esc(label)}</span></font>`,
    C.card
  );
}

function registerColCount(weeks) {
  let n = 2;
  weeks.forEach((w) => { n += w.days.length + 1; });
  return n + 2;
}

function buildColgroup(weeks) {
  let cols = colPt(38) + colPt(184);
  weeks.forEach((w) => {
    w.days.forEach(() => { cols += colPt(44); });
    cols += colPt(56);
  });
  cols += colPt(62) + colPt(54);
  return `<colgroup>${cols}</colgroup>`;
}

function excelHead() {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="UTF-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Class Register</x:Name>
<x:WorksheetOptions><x:DoNotDisplayGridlines/><x:DoNotDisplayHeadings/><x:PrintGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  body { margin:0; padding:16px; background:${C.page}; }
  table { border-collapse:collapse; }
  br { mso-data-placement:same-cell; }
</style></head>
<body bgcolor="${C.page}">`;
}

/**
 * @param {object} opts
 * @param {object} [opts.meta]
 * @param {object} [opts.summary]
 */
export function downloadStyledRegisterExcel({
  historyRows,
  weeks,
  marksMap,
  subtitlePeriod,
  className = '',
  exportFilePrefix = 'class-register',
  periodLabelForExport = 'export',
  pageTitle = 'Class',
  pageTitleAccent = 'Registers',
  meta = {},
  summary = null,
}) {
  if (!historyRows.length) return;

  const schoolDays = schoolDaysFromWeeks(weeks);
  const stats = summary || {
    onRoll: historyRows.length,
    presentEquivalent: 0,
    absent: 0,
    late: 0,
    rate: '0.0',
  };

  const classLabel = meta.className || className || '—';
  const viewMode = meta.periodMode === 'month' ? 'Month' : 'Term';
  const termLabel = meta.termLabel || meta.termName || '—';
  const academicYear = meta.academicYear || '—';
  const weekCount = meta.weekCount ?? weeks.length;

  const thBase = `${NW}${FONT}border:1px solid ${C.cardBorder};padding:7px 6px;font-size:9px;font-weight:800;text-align:center;vertical-align:middle;text-transform:uppercase;letter-spacing:0.06em;`;
  const thSticky = `${thBase}background:${C.surface};color:${C.labelBright};text-align:left;font-size:10px;`;
  const thWeek = `${thBase}background:${C.weekBgSoft};color:${C.accentIndigo};border-color:${C.weekBorder};font-size:10px;`;
  const thDay = `${NW}width:44pt;min-width:44pt;border:1px solid ${C.cardBorder};background:${C.surface};color:#FFFFFF;font-size:16px;font-weight:800;text-align:center;vertical-align:middle;padding:10px 4px;${FONT}`;
  const thPal = `${thBase}width:56pt;min-width:56pt;background:${C.weekBgSoft};color:${C.accentIndigo};border-color:${C.weekBorder};font-size:9px;padding:8px 4px;`;

  let html = excelHead();

  // ── Dashboard shell ──
  html += `<table cellspacing="0" cellpadding="0" width="100%" bgcolor="${C.page}" style="border:none;${FONT}">`;

  // Title
  html += `<tr><td bgcolor="${C.page}" style="border:none;padding:0 0 4px 0;background:${C.page};">
    <span style="font-size:28px;font-weight:900;color:${C.text};letter-spacing:-0.02em;">${esc(pageTitle)} </span>
    <span style="font-size:28px;font-weight:900;color:${C.accent};letter-spacing:-0.02em;">${esc(pageTitleAccent)}</span>
  </td></tr>`;

  // Meta pills
  html += `<tr><td bgcolor="${C.page}" style="border:none;padding:8px 0 4px 0;background:${C.page};">
    ${metaPill('Class', classLabel)}
    ${metaPill('View Mode', viewMode)}
    ${metaPill('GES Term', termLabel)}
    ${metaPill('Academic Year', academicYear)}
  </td></tr>`;

  // Subtitle line (matches UI info row)
  html += `<tr><td bgcolor="${C.page}" style="border:none;padding:4px 0 12px 0;font-size:14px;background:${C.page};line-height:1.6;">
    <font color="${C.textMuted}">${esc(subtitlePeriod)} &middot; ${weekCount} weeks register &middot; ${stats.onRoll} students on roll &middot; ${esc(classLabel)}</font>
  </td></tr>`;

  // Status badges
  html += `<tr><td bgcolor="${C.page}" style="border:none;padding:0 0 14px 0;background:${C.page};">
    ${statusBadge(C.presentFill, C.presentBorder, '1', 'Present')}
    ${statusBadge(C.lateFill, C.lateBorder, '1', 'Late')}
    ${statusBadge(C.absentFill, C.absentBorder, '0', 'Absent')}
  </td></tr>`;

  html += `<tr><td bgcolor="${C.page}" style="border:none;padding:0;background:${C.page};">`;

  // ── Register grid (inset panel) ──
  html += `<table cellspacing="0" cellpadding="0" bgcolor="${C.surface}" style="table-layout:fixed;border:1px solid ${C.cardBorder};${FONT}">`;
  html += buildColgroup(weeks);

  // Header row 1
  html += `<tr style="height:36pt;mso-height-source:userset;">`;
  html += th(`${thSticky}color:#FFFFFF;`, '#', C.surface, 'rowspan="2"');
  html += th(`${thSticky}color:#FFFFFF;`, '<font color="#FFFFFF"><b>Student</b></font>', C.surface, 'rowspan="2"');
  weeks.forEach((w) => {
    const span = Math.max(w.days.length, 0) + 1;
    const lbl =
      `${esc(w.label)}` +
      (w.monthLabel
        ? `<br/><span style="font-size:9px;font-weight:600;color:${C.labelBright};text-transform:none;letter-spacing:0;">${esc(w.monthLabel)}</span>`
        : '');
    html += th(`${thWeek}`, lbl, C.weekBgSoft, `colspan="${span}"`);
  });
  html += th(
    `${thBase}background:${C.weekBg};color:${C.accentIndigo};border-color:${C.weekBorder};`,
    `Term Total<br/><span style="font-size:8px;font-weight:600;color:${C.labelBright};text-transform:none;">P / A / L</span>`,
    C.weekBg,
    'rowspan="2"'
  );
  html += th(
    `${thBase}background:${C.weekBg};color:${C.accentIndigo};border-color:${C.weekBorder};`,
    `Rate<br/><span style="font-size:8px;font-weight:600;color:${C.labelBright};text-transform:none;">%</span>`,
    C.weekBg,
    'rowspan="2"'
  );
  html += '</tr>';

  // Header row 2 — dates
  html += `<tr style="height:30pt;mso-height-source:userset;">`;
  weeks.forEach((w) => {
    w.days.forEach((day) => {
      const n = Number(day.day);
    if (Number.isFinite(n)) html += numTh(`${thDay}`, n, C.surface);
      else html += th(`${thDay}`, `<font color="#FFFFFF"><b>${esc(String(day.day))}</b></font>`, C.surface);
    });
    html += th(`${thPal}`, 'P / A / L', C.weekBgSoft);
  });
  html += '</tr>';

  // Student rows — proportional height for mark chips + P/A/L
  const ROW_H = 'height:48pt;mso-height-source:userset;';
  historyRows.forEach((row, idx) => {
    const counts = countMarksForStudent(row.studentId, schoolDays, marksMap);
    const rowRate = attendanceRatePercent(counts.present, counts.absent, counts.late);
    const rowBg = idx % 2 === 0 ? C.rowA : C.rowB;

    html += `<tr style="${ROW_H}">`;
    html += numTd(
      `${NW}border:1px solid ${C.cardBorder};background:${rowBg};color:${C.labelBright};font-size:12px;text-align:center;vertical-align:middle;padding:8px 4px;${FONT}`,
      idx + 1,
      rowBg
    );
    html += td(
      `${NW}border:1px solid ${C.cardBorder};background:${rowBg};color:${C.white};font-size:12px;font-weight:700;text-align:left;vertical-align:middle;padding:10px 10px;mso-number-format:"\\@";${FONT}`,
      `<font face="Calibri" color="#FFFFFF"><b>${esc(row.name)}</b></font>`,
      rowBg
    );

    weeks.forEach((w) => {
      let wP = 0;
      let wA = 0;
      let wL = 0;
      w.days.forEach((day) => {
        if (day.type === 'exam') {
          html += td(
            `${NW}border:1px solid ${C.cardBorder};background:${C.examBg};text-align:center;vertical-align:middle;font-size:8px;font-weight:800;color:${C.examText};${FONT}`,
            'EXAM',
            C.examBg
          );
          return;
        }
        const st = marksMap.get(`${row.studentId}:${day.date}`);
        if (st === 'present') wP += 1;
        else if (st === 'absent') wA += 1;
        else if (st === 'late') wL += 1;
        html += markCell(st, rowBg);
      });
      html += weekPalCell(wP, wA, wL, false);
    });

    html += weekPalCell(counts.present, counts.absent, counts.late, true);
    html += td(
      `${NW}border:1px solid ${C.weekBorder};background:${C.weekBg};font-size:14px;font-weight:800;text-align:center;vertical-align:middle;padding:8px 4px;${FONT}font-family:Consolas,Monaco,monospace;`,
      `<font color="#FFFFFF"><b>${rowRate}%</b></font>`,
      C.weekBg
    );
    html += '</tr>';
  });

  // Bottom buffer inside grid so last student row is never clipped by summary section
  const colSpan = registerColCount(weeks);
  html += `<tr style="height:20pt;mso-height-source:userset;">`;
  html += td(
    `border:none;background:${C.surface};height:14pt;font-size:1px;`,
    '&nbsp;',
    C.surface,
    `colspan="${colSpan}"`
  );
  html += '</tr>';

  html += '</table>'; // end register grid
  html += `</td></tr>`;

  html += spacerRow(1, 32);

  // ── Summary dashboard cards ──
  html += `<tr><td bgcolor="${C.page}" style="border:none;padding:0;background:${C.page};">`;
  html += `<table cellspacing="8" cellpadding="0" bgcolor="${C.page}" style="border:none;${FONT}"><tr>`;
  html += summaryCard(stats.onRoll, 'On Roll', C.text);
  html += summaryCard(stats.presentEquivalent, 'Present (incl. late)', C.green);
  html += summaryCard(stats.absent, 'Total Absent', C.red);
  html += summaryCard(stats.late, 'Late Arrivals', C.amber);
  html += summaryCard(`${stats.rate}%`, 'Overall Rate', C.indigo);
  html += `</tr></table>`;
  html += `</td></tr>`;

  // Footer brand
  html += `<tr><td bgcolor="${C.page}" style="border:none;padding:16px 0 8px 0;font-size:11px;background:${C.page};">
    <font color="${C.labelBright}">EduTrack GH &middot; Class Register Report &middot; Generated ${esc(new Date().toLocaleString())}</font>
  </td></tr>`;

  html += '</table>'; // end shell
  html += '</body></html>';

  const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${exportFilePrefix}-${periodLabelForExport}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
}
