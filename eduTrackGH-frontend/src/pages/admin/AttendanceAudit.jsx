/**
 * Attendance Audit Dashboard – under 300 lines
 */

import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import { useAttendanceAudit } from '../../hooks/useAttendanceAudit';
import AuditRecordsTable, { AuditFlagsTable } from '../../components/admin/AuditRecordsTable';

const AttendanceAudit = () => {
  const {
    schools,
    classrooms,
    filters,
    setFilters,
    records,
    summary,
    flags,
    loading,
    flagsLoading,
    handleUnlock,
  } = useAttendanceAudit();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Audit</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Verify attendance integrity and review suspicious patterns</p>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School</label>
              <select
                value={filters.schoolId}
                onChange={(e) => setFilters((f) => ({ ...f, schoolId: e.target.value, classroomId: '' }))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="">All schools</option>
                {schools.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Classroom</label>
              <select
                value={filters.classroomId}
                onChange={(e) => setFilters((f) => ({ ...f, classroomId: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="">All classrooms</option>
                {classrooms.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} ({c.grade})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-end gap-2">
              {filters.classroomId && filters.date && (
                <button
                  onClick={() => handleUnlock(filters.classroomId, filters.date)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium"
                >
                  Unlock Attendance
                </button>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">Select at least one filter to load data</p>
            </div>
          </div>
        </Card>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Records</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalRecords}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">% Photo Verified</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.photoVerifiedPct}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">% Manual Verified</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.manualVerifiedPct}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">100% Present Days</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.hundredPercentPresentDays}</p>
            </Card>
          </div>
        )}

        <AuditFlagsTable flags={flags} flagsLoading={flagsLoading} />
        <AuditRecordsTable records={records} loading={loading} filters={filters} />
      </div>
    </DashboardLayout>
  );
};

export default AttendanceAudit;
