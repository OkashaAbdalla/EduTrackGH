/**
 * Attendance Audit Dashboard
 * Phase 7: Admin view for attendance integrity verification
 * Filter by school, classroom, date. Display verification type, photo, time, location.
 * Highlight manual verification rows. Summary: % photo, % manual, 100% present days.
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import adminService from '../../services/adminService';
import { useToast } from '../../context';

const AttendanceAudit = () => {
  const { showToast } = useToast();
  const [schools, setSchools] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [filters, setFilters] = useState({
    schoolId: '',
    classroomId: '',
    date: '',
  });
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [flagsLoading, setFlagsLoading] = useState(false);

  useEffect(() => {
    const loadSchools = async () => {
      try {
        const res = await adminService.getSchools(false);
        if (res.success && res.schools) {
          setSchools(res.schools);
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to load schools', 'error');
      }
    };
    loadSchools();
  }, [showToast]);

  useEffect(() => {
    if (filters.schoolId) {
      adminService.getSchoolClassrooms(filters.schoolId).then((res) => {
        if (res.success && res.classrooms) {
          setClassrooms(res.classrooms);
        } else {
          setClassrooms([]);
        }
      }).catch(() => setClassrooms([]));
    } else {
      setClassrooms([]);
    }
  }, [filters.schoolId]);

  useEffect(() => {
    const loadAudit = async () => {
      if (!filters.schoolId && !filters.classroomId && !filters.date) {
        setRecords([]);
        setSummary(null);
        return;
      }
      setLoading(true);
      try {
        const params = {};
        if (filters.schoolId) params.schoolId = filters.schoolId;
        if (filters.classroomId) params.classroomId = filters.classroomId;
        if (filters.date) params.date = filters.date;
        const res = await adminService.getAttendanceAudit(params);
        if (res.success) {
          setRecords(res.records || []);
          setSummary(res.summary || null);
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to load audit data', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadAudit();
  }, [filters.schoolId, filters.classroomId, filters.date, showToast]);

  useEffect(() => {
    setFlagsLoading(true);
    adminService.getAttendanceFlags({ resolved: 'false' })
      .then((res) => {
        if (res.success && res.flags) setFlags(res.flags);
      })
      .catch(() => setFlags([]))
      .finally(() => setFlagsLoading(false));
  }, []);

  const handleUnlock = async (classroomId, date) => {
    try {
      const res = await adminService.unlockAttendance(classroomId, date);
      if (res.success) {
        showToast(res.message || 'Attendance unlocked', 'success');
        setFilters((f) => ({ ...f }));
      } else {
        showToast(res.message || 'Failed to unlock', 'error');
      }
    } catch (err) {
      showToast('Failed to unlock attendance', 'error');
    }
  };

  const formatTime = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Audit</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Verify attendance integrity and review suspicious patterns</p>
        </div>

        {/* Filters */}
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select at least one filter to load data
              </p>
            </div>
          </div>
        </Card>

        {/* Summary */}
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

        {/* Flags */}
        {flags.length > 0 && (
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
                        <td className="py-2">{formatDate(f.date)}</td>
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
        )}

        {/* Records Table */}
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
                        {r.manualReason && (
                          <span className="block text-xs text-gray-500">{r.manualReason}</span>
                        )}
                      </td>
                      <td className="py-2">
                        {r.photoUrl ? (
                          <a href={r.photoUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2">{formatTime(r.markedAt)}</td>
                      <td className="py-2">
                        {r.location?.latitude != null ? `${r.location.latitude?.toFixed(4)}, ${r.location.longitude?.toFixed(4)}` : '-'}
                      </td>
                      <td className="py-2">{formatDate(r.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceAudit;
