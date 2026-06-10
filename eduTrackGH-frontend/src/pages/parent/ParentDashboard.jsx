/**
 * Parent Dashboard
 * Purpose: View children's attendance for smartphone parents
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { ROUTES } from '../../utils/constants';
import { Card, Loader, Button } from '../../components/common';
import parentService from '../../services/parentService';
import notificationService from '../../services/notificationService';

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [term, setTerm] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [overview, notifRes] = await Promise.all([
          parentService.getAttendanceOverview(),
          notificationService.getMyNotifications(),
        ]);
        setChildren(overview?.children || []);
        setTerm(overview?.term || null);
        setNotifications((notifRes?.notifications || []).slice(0, 5));
        setUnreadCount(notifRes?.unreadCount || 0);
      } catch (error) {
        setChildren([]);
        setTerm(null);
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
    const pollId = setInterval(() => loadDashboard(), 30000);
    return () => clearInterval(pollId);
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="ui-page-title">Parent Dashboard</h1>
          <p className="ui-page-subtitle">Monitor your children's attendance and receive alerts</p>
          {term && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Active term: {term.name} ({term.start} to {term.end})
            </p>
          )}
        </div>

        {/* Children List */}
        <div className="space-y-3">
          {children.map((child) => (
            <Link key={child.studentId} to={`${ROUTES.CHILDREN_ATTENDANCE}/${child.studentId}`} className="block">
              <Card variant="action" hover className="p-4 group cursor-pointer transition-all duration-200 hover:shadow-lg">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-blue-600 dark:bg-dashboard-accent rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-base font-bold text-white">{(child.studentName || 'C').charAt(0)}</span>
                  </div>
                  
                  {/* Info Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{child.studentName}</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{child.className}</span>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-gray-500 dark:text-gray-400">Rate:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">{child.attendancePercentage}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        <span className="text-gray-500 dark:text-gray-400">Absent:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">{child.absent}</span>
                      </div>
                      <span className="text-gray-400 dark:text-gray-500">P: {child.present} • L: {child.late}</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="hidden sm:block w-32 shrink-0">
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-1.5 bg-green-600 dark:bg-green-500 transition-all"
                        style={{ width: `${Math.min(child.attendancePercentage || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
          {children.length === 0 && (
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">No linked children found for this parent account.</p>
            </Card>
          )}
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Notifications</h2>
            <Link to={ROUTES.PARENT_NOTIFICATIONS} className="text-xs font-semibold text-green-600 dark:text-green-400">
              View all
            </Link>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Unread alerts: {unreadCount}</p>
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`rounded-lg p-2.5 border ${notif.read ? 'border-gray-200 dark:border-gray-700' : 'border-green-400'}`}
              >
                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                  {notif.child} • {notif.status || 'Update'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{notif.message}</p>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-500">No notifications yet.</p>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <Link to={ROUTES.CHILDREN_ATTENDANCE}>
            <Card variant="action" hover className="p-5 group cursor-pointer transition-shadow duration-300 hover:shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-uds-green dark:bg-green-700 rounded-lg flex items-center justify-center transition-opacity duration-300 group-hover:opacity-90 shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">View All Attendance</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">See detailed attendance history</p>
                  <div className="mt-1.5 flex items-center text-green-600 dark:text-green-400 text-xs font-medium">
                    <span>View details</span>
                    <svg className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link to={ROUTES.PARENT_NOTIFICATIONS}>
            <Card variant="action" hover className="p-5 group cursor-pointer transition-shadow duration-300 hover:shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-600 dark:bg-dashboard-accent rounded-lg flex items-center justify-center transition-opacity duration-300 group-hover:opacity-90 shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">Notifications</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">View absence alerts and updates</p>
                  <div className="mt-1.5 flex items-center text-blue-600 dark:text-blue-400 text-xs font-medium">
                    <span>View alerts</span>
                    <svg className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;
