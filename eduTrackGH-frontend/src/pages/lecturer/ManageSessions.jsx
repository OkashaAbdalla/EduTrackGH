/**
 * Manage Sessions Page (Lecturer)
 * Purpose: View and manage all created sessions
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';

const ManageSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // TODO: Replace with real API call
    const fetchSessions = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSessions([
        { id: 1, courseName: 'Computer Networks', courseCode: 'CSC 301', location: 'Lecture Hall A', status: 'active', attendees: 45, startTime: '2026-01-18T08:00:00', duration: 60 },
        { id: 2, courseName: 'Database Systems', courseCode: 'CSC 302', location: 'Lab B', status: 'active', attendees: 38, startTime: '2026-01-18T10:00:00', duration: 90 },
        { id: 3, courseName: 'Software Engineering', courseCode: 'CSC 303', location: 'Lecture Hall C', status: 'completed', attendees: 52, startTime: '2026-01-17T14:00:00', duration: 60 },
      ]);
      setLoading(false);
    };

    fetchSessions();
  }, []);

  const handleToggleStatus = (id) => {
    setSessions(sessions.map(session => 
      session.id === id ? { ...session, status: session.status === 'active' ? 'completed' : 'active' } : session
    ));
  };

  const filteredSessions = filter === 'all' ? sessions : sessions.filter(s => s.status === filter);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Manage Sessions</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">View and control your attendance sessions</p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Sessions</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Sessions Found</h3>
            <p className="text-gray-600 dark:text-gray-400">No sessions match your filter</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Attendees</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{session.courseCode}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{session.courseName}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{session.location}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{session.duration} min</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{session.attendees}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'active' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(session.id)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium mr-3"
                      >
                        {session.status === 'active' ? 'End' : 'Reactivate'}
                      </button>
                      <button className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium">
                        View
                      </button>
                    </td>
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

export default ManageSessions;
