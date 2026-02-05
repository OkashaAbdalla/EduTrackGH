/**
 * View Attendance Page (Lecturer)
 * Purpose: View attendance records for sessions
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';

const ViewAttendance = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with real API call
    const fetchSessions = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSessions([
        { id: 1, name: 'CSC 301 - Computer Networks' },
        { id: 2, name: 'CSC 302 - Database Systems' },
        { id: 3, name: 'CSC 303 - Software Engineering' },
      ]);
      setLoading(false);
    };

    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      setLoading(true);
      // TODO: Replace with real API call
      const fetchAttendance = async () => {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setAttendanceRecords([
          { id: 1, studentName: 'John Doe', studentId: 'CSC/0030/22', timeMarked: '08:15 AM', confidence: 0.95, status: 'present' },
          { id: 2, studentName: 'Jane Smith', studentId: 'CSC/0031/22', timeMarked: '08:17 AM', confidence: 0.89, status: 'present' },
          { id: 3, studentName: 'Michael Brown', studentId: 'CSC/0032/22', timeMarked: '08:45 AM', confidence: 0.82, status: 'late' },
          { id: 4, studentName: 'Sarah Johnson', studentId: 'CSC/0033/22', timeMarked: '-', confidence: null, status: 'absent' },
        ]);
        setLoading(false);
      };

      fetchAttendance();
    }
  }, [selectedSession]);

  const getStatusBadge = (status) => {
    const styles = {
      present: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      late: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      absent: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">View Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Check attendance records for your sessions</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Session
          </label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
          >
            <option value="">Choose a session...</option>
            {sessions.map(session => (
              <option key={session.id} value={session.id}>{session.name}</option>
            ))}
          </select>
        </div>

        {!selectedSession ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Session</h3>
            <p className="text-gray-600 dark:text-gray-400">Choose a session to view attendance records</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total: {attendanceRecords.length} students</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Present: {attendanceRecords.filter(r => r.status === 'present').length} | 
                  Late: {attendanceRecords.filter(r => r.status === 'late').length} | 
                  Absent: {attendanceRecords.filter(r => r.status === 'absent').length}
                </p>
              </div>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition">
                Export CSV
              </button>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Student ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Time Marked</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Confidence</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{record.studentName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{record.studentId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{record.timeMarked}</td>
                    <td className="px-4 py-3 text-sm">
                      {record.confidence ? (
                        <span className={`font-medium ${
                          record.confidence >= 0.9 ? 'text-green-600 dark:text-green-400' : 
                          record.confidence >= 0.8 ? 'text-yellow-600 dark:text-yellow-400' : 
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {Math.round(record.confidence * 100)}%
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewAttendance;
