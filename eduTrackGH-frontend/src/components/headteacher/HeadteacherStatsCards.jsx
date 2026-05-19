/**
 * Stats cards for Headteacher Dashboard
 */

import { Card } from '../common';

const StatTile = ({ label, value, hint, iconBoxClass, children }) => (
  <Card variant="stats" className="!p-5">
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="ui-stat-label mb-1.5">{label}</p>
        <p className="ui-stat-value text-[color:var(--text-primary)]">{value}</p>
        {hint && <p className="text-xs text-[color:var(--text-muted)] mt-1.5">{hint}</p>}
      </div>
      <div className={`ui-icon-box ${iconBoxClass}`}>{children}</div>
    </div>
  </Card>
);

export default function HeadteacherStatsCards({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      <StatTile label="Total Students" value={stats.totalStudents} hint="In your section" iconBoxClass="ui-icon-box-secondary">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </StatTile>
      <StatTile label="Attendance Rate" value={`${stats.attendanceRate}%`} hint="Overall average" iconBoxClass="">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </StatTile>
      <StatTile
        label="Teachers Compliant"
        value={`${stats.teachersCompliant}/10`}
        hint="Marked today"
        iconBoxClass="ui-icon-box-purple"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </StatTile>
      <StatTile label="Flagged Students" value={stats.flaggedStudents} hint="Need attention" iconBoxClass="ui-icon-box-warning">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </StatTile>
    </div>
  );
}
