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

const TeacherCompliance = () => {
  const { showToast } = useToast();
  const { user } = useAuthContext();
  const { socket } = useSocket();
  const schoolLevel = user?.schoolLevel;
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompliance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await headteacherService.getCompliance(date);
      setTeachers(res.teachers || []);
    } catch (error) {
      showToast('Failed to load compliance data', 'error');
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [date, showToast]);

  useEffect(() => {
    fetchCompliance();
  }, [fetchCompliance]);

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      if (data?.date === date) fetchCompliance();
    };
    socket.on('compliance_updated', handler);
    return () => socket.off('compliance_updated', handler);
  }, [socket, date, fetchCompliance]);

  const stats = {
    total: teachers.length,
    marked: teachers.filter((t) => t.marked).length,
    unmarked: teachers.filter((t) => !t.marked).length,
  };

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teacher Compliance</h1>
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
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Teachers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Marked Today</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.marked}</p>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Not Marked</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.unmarked}</p>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Teacher Status for {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          <div className="space-y-3">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className={`p-4 rounded-lg border ${
                  teacher.marked
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                    : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          teacher.marked ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                        }`}
                      >
                        <span className={`font-semibold ${teacher.marked ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {(teacher.fullName || teacher.name || 'T').charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{teacher.fullName || teacher.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(teacher.assignedClasses || teacher.classes || []).join(', ') || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    {teacher.marked ? (
                      <div>
                        <span className="inline-block px-3 py-1 bg-green-600 text-white rounded text-sm font-medium mb-1">
                          Marked
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {teacher.markedAt &&
                            new Date(teacher.markedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-red-600 text-white rounded text-sm font-medium">
                        Not Marked
                      </span>
                    )}
                    <Link
                      to={`${ROUTES.HEADTEACHER_CHAT}?teacher=${teacher.id}&name=${encodeURIComponent(teacher.fullName || '')}`}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium"
                    >
                      Message
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeacherCompliance;
