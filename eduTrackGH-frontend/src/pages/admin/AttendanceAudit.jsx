/**
 * Attendance Audit Dashboard – under 300 lines
 */

import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import { useAttendanceAudit } from '../../hooks/useAttendanceAudit';
import AuditRecordsTable, { AuditFlagsTable } from '../../components/admin/AuditRecordsTable';
import { useConfirm } from '../../context';

const AttendanceAudit = () => {
  const { requestConfirmation } = useConfirm();
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
      <div className="max-w-7xl mx-auto page-stack">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Attendance Audit</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Verify attendance integrity and review suspicious patterns</p>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h2>
          <div className="card-grid-2 md:grid-cols-4 gap-2 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School</label>
              <select
                value={filters.schoolId}
                onChange={(e) => setFilters((f) => ({ ...f, schoolId: e.target.value, classroomId: '' }))}
                className="ui-select w-full"
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
                className="ui-select w-full"
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
                className="ui-select w-full"
              />
            </div>
            <div className="flex items-end gap-2">
              {filters.classroomId && filters.date && (
                <button
                  onClick={async () => {
                    const ok = await requestConfirmation({
                      title: 'Unlock attendance',
                      message: `Unlock attendance for this classroom on ${filters.date}? Teachers will be able to make corrections.`,
                      confirmText: 'Unlock',
                      cancelText: 'Cancel',
                      tone: 'danger',
                    });
                    if (ok) handleUnlock(filters.classroomId, filters.date);
                  }}
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
          <div className="stats-grid-4">
            <Card className="stat-tile">
              <p className="stat-tile-label">Total Records</p>
              <p className="stat-tile-value text-gray-900 dark:text-white">{summary.totalRecords}</p>
            </Card>
            <Card className="stat-tile">
              <p className="stat-tile-label">% Photo Verified</p>
              <p className="stat-tile-value text-green-600 dark:text-green-400">{summary.photoVerifiedPct}%</p>
            </Card>
            <Card className="stat-tile">
              <p className="stat-tile-label">% Manual Verified</p>
              <p className="stat-tile-value text-amber-600 dark:text-amber-400">{summary.manualVerifiedPct}%</p>
            </Card>
            <Card className="stat-tile">
              <p className="stat-tile-label">100% Present Days</p>
              <p className="stat-tile-value text-blue-600 dark:text-blue-400">{summary.hundredPercentPresentDays}</p>
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
