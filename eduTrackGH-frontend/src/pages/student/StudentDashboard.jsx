/**
 * Student Dashboard Page
 * Purpose: Main landing page after student login
 * Shows: Quick stats, active sessions, quick actions
 */

import DashboardLayout from '../../layouts/DashboardLayout';
import StatsCard from '../../components/student/StatsCard';
import QuickActionCard from '../../components/student/QuickActionCard';
import { ROUTES } from '../../utils/constants';

const StudentDashboard = () => {
  // TODO: Replace with real data from API
  const studentData = {
    name: 'John Doe',
    studentId: 'CSC/0030/22',
    totalSessions: 24,
    attended: 22,
    activeSessions: 2,
  };

  const attendanceRate = Math.round((studentData.attended / studentData.totalSessions) * 100);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Welcome back, {studentData.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{studentData.studentId}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatsCard
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>}
            label="Total Sessions"
            value={studentData.totalSessions}
            color="blue"
          />
          <StatsCard
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>}
            label="Attendance Rate"
            value={`${attendanceRate}%`}
            color="green"
          />
          <StatsCard
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>}
            label="Active Sessions"
            value={studentData.activeSessions}
            color="orange"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickActionCard
            to={ROUTES.ACTIVE_SESSIONS}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>}
            title="Mark Attendance"
            description="View active sessions and mark your attendance"
            color="green"
          />
          <QuickActionCard
            to={ROUTES.ATTENDANCE_HISTORY}
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>}
            title="View History"
            description="Check your attendance records and reports"
            color="blue"
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
