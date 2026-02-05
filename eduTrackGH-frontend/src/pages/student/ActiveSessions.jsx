/**
 * Active Sessions Page
 * Purpose: Display all currently active attendance sessions
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import ActiveSessionCard from '../../components/student/ActiveSessionCard';

const ActiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with real API call
    const fetchSessions = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setSessions([
        {
          id: 1,
          courseName: 'Computer Networks',
          courseCode: 'CSC 301',
          lecturerName: 'Dr. Mensah',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 45 * 60000).toISOString(),
          hasMarked: false,
        },
        {
          id: 2,
          courseName: 'Database Systems',
          courseCode: 'CSC 302',
          lecturerName: 'Prof. Addo',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 90 * 60000).toISOString(),
          hasMarked: true,
        },
      ]);
      setLoading(false);
    };

    fetchSessions();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Active Sessions</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Mark your attendance for ongoing classes</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Active Sessions</h3>
            <p className="text-gray-600 dark:text-gray-400">There are no active attendance sessions at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sessions.map(session => (
              <ActiveSessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ActiveSessions;
