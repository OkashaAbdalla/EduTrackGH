/**
 * Attendance audit records table and flags table for admin
 */

import { Card } from '../common';
import { formatAuditTime, formatAuditDate } from '../../hooks/useAttendanceAudit';

export function AuditFlagsTable({ flags, flagsLoading }) {
  if (flags.length === 0) return null;
  return (
    <Card className="p-6 border-amber-200 dark:border-amber-800">
      <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400 mb-3">Suspicious Patterns</h2>
      {flagsLoading ? (
        <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded" />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-2 text-gray-700 dark:text-gray-300">Date</th>
                <th className="text-left py-2 text-gray-700 dark:text-gray-300">Classroom</th>
                <th className="text-left py-2 text-gray-700 dark:text-gray-300">Type</th>
                <th className="text-left py-2 text-gray-700 dark:text-gray-300">Details</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => (
                <tr key={f._id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">{formatAuditDate(f.date)}</td>
                  <td className="py-2">{f.classroomId?.name || f.classroomId}</td>
                  <td className="py-2">
                    <span className="px-2 py-0.5 rounded text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200">
                      {f.flagType?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2 text-gray-600 dark:text-gray-400">{f.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function AuditRecordsTable({ records, loading, filters }) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attendance Records</h2>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
        </div>
      ) : records.length === 0 ? (
        <p className="text-center py-12 text-gray-500 dark:text-gray-400">
          {filters.schoolId || filters.classroomId || filters.date
            ? 'No records found for the selected filters'
            : 'Select school, classroom, or date to load audit data'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-2 text-gray-700 dark:text-gray-300">Student</th>
                <th className="text-left py-2 text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-left py-2 text-gray-700 dark:text-gray-300">Verification</th>
                <th className="text-left py-2 text-gray-700 dark:text-gray-300">Photo</th>
                <th className="text-left py-2 text-gray-700 dark:text-gray-300">Time</th>
                <th className="text-left py-2 text-gray-700 dark:text-gray-300">Location</th>
                <th className="text-left py-2 text-gray-700 dark:text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr
                  key={r._id}
                  className={`border-b border-gray-100 dark:border-gray-700 ${
                    r.verificationType === 'manual' ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                  }`}
                >
                  <td className="py-2">
                    <span className="font-medium">{r.studentId?.fullName || '-'}</span>
                    <br />
                    <span className="text-xs text-gray-500">{r.studentId?.studentIdNumber || r.studentId?.studentId || ''}</span>
                  </td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      r.status === 'present' ? 'bg-green-100 dark:bg-green-900/50 text-green-800' :
                      r.status === 'late' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-800' :
                      'bg-red-100 dark:bg-red-900/50 text-red-800'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2">
                    <span className={r.verificationType === 'manual' ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                      {r.verificationType || '-'}
                    </span>
                    {r.manualReason && <span className="block text-xs text-gray-500">{r.manualReason}</span>}
                  </td>
                  <td className="py-2">
                    {r.photoUrl ? (
                      <a href={r.photoUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">View</a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-2">{formatAuditTime(r.markedAt)}</td>
                  <td className="py-2">
                    {r.location?.latitude != null ? `${r.location.latitude?.toFixed(4)}, ${r.location.longitude?.toFixed(4)}` : '-'}
                  </td>
                  <td className="py-2">{formatAuditDate(r.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
