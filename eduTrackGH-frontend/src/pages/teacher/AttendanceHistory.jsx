/**
 * Attendance History Page
 * Purpose: View past attendance records for teacher's classrooms
 * 
 * Security:
 * - Fetches only classrooms assigned to this teacher
 * - Cannot access other teachers' attendance data
 * - Authorization checked on backend
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import classroomService from '../../services/classroomService';
import attendanceService from '../../services/attendanceService';
import { useToast } from '../../context';

const AttendanceHistory = () => {
  const { showToast } = useToast();
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [records, setRecords] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch teacher's classrooms on mount
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        setInitialLoading(true);
        const response = await classroomService.getTeacherClassrooms();

        if (response.success && response.classrooms.length > 0) {
          setClassrooms(response.classrooms);

          // Auto-select if only one classroom
          if (response.classrooms.length === 1) {
            setSelectedClass(response.classrooms[0]._id);
          }
        } else {
          setError('No classrooms assigned. Contact your headteacher.');
          setClassrooms([]);
        }
      } catch (err) {
        console.error('Error fetching classrooms:', err);
        setError('Failed to load classrooms.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchClassrooms();
  }, []);

  // Fetch attendance records when classroom or month changes
  useEffect(() => {
    if (selectedClass) {
      fetchAttendanceRecords();
    }
  }, [selectedClass, selectedMonth]);

  const fetchAttendanceRecords = async () => {
    try {
      setRecordsLoading(true);
      setError(null);
      const response = await attendanceService.getClassroomAttendanceHistory(selectedClass, selectedMonth);

      if (response.success) {
        setRecords(response.records || []);
      } else {
        setError(response.message || 'Failed to load attendance records.');
        setRecords([]);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Error loading attendance records.');
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00Z');
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getAttendanceRate = (record) => {
    if (!record.total || record.total === 0) return '0.0';
    return ((record.present / record.total) * 100).toFixed(1);
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your classrooms...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance History</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View past attendance records for your class{classrooms.length > 1 ? 'es' : ''}</p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </Card>
        )}

        {/* Filters */}
        {classrooms.length > 0 && (
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Class{classrooms.length > 1 ? 'es' : ''}
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">
                    {classrooms.length === 1 ? 'Auto-selected: ' : 'Choose a class...'}
                  </option>
                  {classrooms.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} (Grade {cls.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Month
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  max={new Date().toISOString().slice(0, 7)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Records Table */}
        {selectedClass && (
          <Card className="p-6">
            {recordsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
              </div>
            ) : records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Present</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Absent</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Late</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                          {formatDate(record.date)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            {record.present}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            {record.absent}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                            {record.late}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                          {getAttendanceRate(record)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                {recordsLoading ? 'Loading records...' : 'No attendance records found for this period'}
              </div>
            )}
          </Card>
        )}

        {!selectedClass && classrooms.length > 0 && !recordsLoading && (
          <Card className="p-12">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">Select your class to view attendance history</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AttendanceHistory;
