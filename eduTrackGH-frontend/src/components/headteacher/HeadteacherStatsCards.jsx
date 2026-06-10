/**
 * Stats cards for Headteacher Dashboard — admin-style accents
 */

import { Card } from '../common';

const tiles = [
  {
    key: 'students',
    label: 'Total Students',
    hint: 'In your section',
    border: 'border-l-blue-500 dark:border-l-blue-400',
    gradient: 'from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
    shadow: 'shadow-blue-500/20',
    valueKey: 'totalStudents',
    format: (v) => v,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    ),
  },
  {
    key: 'rate',
    label: 'Attendance Rate',
    hint: 'Overall average',
    border: 'border-l-green-500 dark:border-l-green-400',
    gradient: 'from-green-500 to-green-600 dark:from-green-600 dark:to-green-700',
    shadow: 'shadow-green-500/20',
    valueKey: 'attendanceRate',
    format: (v) => `${v}%`,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    key: 'compliant',
    label: 'Teachers Compliant',
    hint: 'Marked today',
    border: 'border-l-orange-500 dark:border-l-orange-400',
    gradient: 'from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700',
    shadow: 'shadow-orange-500/20',
    valueKey: 'teachersCompliant',
    format: (v, stats) => `${stats.teachersCompliant}/10`,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    ),
  },
  {
    key: 'flagged',
    label: 'Flagged Students',
    hint: 'Need attention',
    border: 'border-l-purple-500 dark:border-l-purple-400',
    gradient: 'from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700',
    shadow: 'shadow-purple-500/20',
    valueKey: 'flaggedStudents',
    format: (v) => v,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    ),
  },
];

export default function HeadteacherStatsCards({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((t) => (
        <Card key={t.key} variant="stats" className={`!p-4 border-l-4 ${t.border}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                {t.label}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-0.5">
                {t.format(stats[t.valueKey], stats)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">{t.hint}</p>
            </div>
            <div
              className={`w-12 h-12 shrink-0 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center shadow-lg ${t.shadow}`}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {t.icon}
              </svg>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
