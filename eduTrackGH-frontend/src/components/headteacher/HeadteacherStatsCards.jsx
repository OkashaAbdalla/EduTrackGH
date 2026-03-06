/**
 * Stats cards for Headteacher Dashboard
 */

import { Card } from '../common';

export default function HeadteacherStatsCards({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <Card variant="stats" className="p-6 border-l-4 border-l-blue-500 dark:border-l-blue-400">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Total Students</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">In your section</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      </Card>
      <Card variant="stats" className="p-6 border-l-4 border-l-green-500 dark:border-l-green-400">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Attendance Rate</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.attendanceRate}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Overall average</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </Card>
      <Card variant="stats" className="p-6 border-l-4 border-l-purple-500 dark:border-l-purple-400">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Teachers Compliant</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.teachersCompliant}/10</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Marked today</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
      </Card>
      <Card variant="stats" className="p-6 border-l-4 border-l-orange-500 dark:border-l-orange-400">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Flagged Students</p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.flaggedStudents}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Need attention</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </Card>
    </div>
  );
}
