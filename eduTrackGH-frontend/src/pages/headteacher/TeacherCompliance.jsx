/**
 * Teacher Compliance Page (Headteacher)
 * Monitor daily attendance marking compliance by teachers
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import { useToast, useAuthContext, useSocket } from '../../context';
import headteacherService from '../../services/headteacherService';
import { ROUTES } from '../../utils/constants';

const getLocalDateIso = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TeacherCompliance = ({ apiService = headteacherService, messageRoute = ROUTES.HEADTEACHER_CHAT } = {}) => {
  const { showToast } = useToast();
  const { user } = useAuthContext();
  const { socket } = useSocket();
  const schoolLevel = user?.schoolLevel;
  const [date, setDate] = useState(getLocalDateIso);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompliance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getCompliance(date);
      setTeachers(res.teachers || []);
    } catch (error) {
      showToast('Failed to load compliance data', 'error');
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [date, showToast, apiService]);

  useEffect(() => {
    fetchCompliance();
    const pollId = setInterval(fetchCompliance, 30000);
    return () => clearInterval(pollId);
  }, [fetchCompliance]);

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      if (data?.date === date) fetchCompliance();
    };
    socket.on('compliance_updated', handler);
    return () => socket.off('compliance_updated', handler);
  }, [socket, date, fetchCompliance]);

  /** Only GES school days count toward compliance (weekends/holidays/vacation/BECE excluded per backend). */
  const applicableTeachers = teachers.filter((t) => t.schoolDayExpected !== false);
  const stats = {
    total: applicableTeachers.length,
    marked: applicableTeachers.filter((t) => t.marked).length,
    unmarked: applicableTeachers.filter((t) => !t.marked).length,
  };
  const allNonSchoolDay = teachers.length > 0 && applicableTeachers.length === 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-stack">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Teacher Compliance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {schoolLevel === 'PRIMARY'
              ? "Monitor Primary section teachers' daily attendance marking"
              : schoolLevel === 'JHS'
              ? "Monitor JHS section teachers' daily attendance marking"
              : 'Monitor daily attendance marking compliance'}
          </p>
        </div>

        <Card className="p-6">
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={getLocalDateIso()}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </Card>

        {allNonSchoolDay && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
            This date is not a GES school day (weekend, public holiday, vacation, or non-term day). Attendance
            compliance is not tracked — teachers are not expected to mark.
          </div>
        )}

        <div className="stats-grid-3">
          <Card className="stat-tile">
            <p className="stat-tile-label">Total Teachers</p>
            <p className="stat-tile-value text-gray-900 dark:text-white">{stats.total}</p>
          </Card>
          <Card className="stat-tile">
            <p className="stat-tile-label">Marked Today</p>
            <p className="stat-tile-value text-green-600 dark:text-green-400">{stats.marked}</p>
          </Card>
          <Card className="stat-tile">
            <p className="stat-tile-label">Not Marked</p>
            <p className="stat-tile-value text-red-600 dark:text-red-400">{stats.unmarked}</p>
          </Card>
        </div>

        <Card className="grid-card md:p-6">
          <h2 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
            Teacher Status for {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          <div className="card-grid-2">
            {teachers.map((teacher) => {
              const neutral = teacher.schoolDayExpected === false;
              return (
              <div
                key={teacher.id}
                className={`p-2.5 md:p-4 rounded-lg border min-w-0 ${
                  neutral
                    ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30'
                    : teacher.marked
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                    : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ${
                          neutral
                            ? 'bg-slate-100 dark:bg-slate-800'
                            : teacher.marked
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}
                      >
                        <span
                          className={`font-semibold ${
                            neutral
                              ? 'text-slate-600 dark:text-slate-400'
                              : teacher.marked
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {(teacher.fullName || teacher.name || 'T').charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white truncate">{teacher.fullName || teacher.name}</h3>
                        <p className="text-[10px] md:text-sm text-gray-600 dark:text-gray-400 truncate">
                          {(teacher.assignedClasses || teacher.classes || []).join(', ') || '—'}
                        </p>
                      </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {neutral ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] md:text-sm font-medium bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                        No attendance expected
                      </span>
                    ) : teacher.marked ? (
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-green-600 text-white rounded text-[10px] md:text-sm font-medium">
                          Marked
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {teacher.markedAt &&
                            new Date(teacher.markedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ) : (
                      <span className="inline-block px-2 py-0.5 bg-red-600 text-white rounded text-[10px] md:text-sm font-medium">
                        Not Marked
                      </span>
                    )}
                    {!neutral && (
                    <Link
                      to={`${messageRoute}?teacher=${teacher.id}&name=${encodeURIComponent(teacher.fullName || '')}`}
                      className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-[10px] md:text-sm font-medium"
                    >
                      Message
                    </Link>
                    )}
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherCompliance;
