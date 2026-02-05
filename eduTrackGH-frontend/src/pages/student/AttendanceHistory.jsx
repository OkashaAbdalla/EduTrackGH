/**
 * Attendance History Page (Student)
 * Purpose: View past attendance records
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AttendanceHistoryTable from '../../components/student/AttendanceHistoryTable';

const AttendanceHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // TODO: Replace with real API call
    const fetchHistory = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setRecords([
        { id: 1, date: '2026-01-15', courseCode: 'CSC 301', courseName: 'Computer Networks', time: '08:15 AM', status: 'present', confidence: 0.92 },
        { id: 2, date: '2026-01-14', courseCode: 'CSC 302', courseName: 'Database Systems', time: '10:30 AM', status: 'present', confidence: 0.88 },
        { id: 3, date: '2026-01-13', courseCode: 'CSC 303', courseName: 'Software Engineering', time: '02:45 PM', status: 'late', confidence: 0.85 },
        { id: 4, date: '2026-01-12', courseCode: 'CSC 301', courseName: 'Computer Networks', time: '-', status: 'absent', confidence: null },
        { id: 5, date: '2026-01-11', courseCode: 'CSC 304', courseName: 'Web Development', time: '11:20 AM', status: 'present', confidence: 0.95 },
      ]);
      setLoading(false);
    };

    fetchHistory();
  }, []);

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Attendance History</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">View your past attendance records</p>
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent">
            <option value="all">All Records</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Records Found</h3>
            <p className="text-gray-600 dark:text-gray-400">No attendance records match your filter</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <AttendanceHistoryTable records={filteredRecords} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AttendanceHistory;
