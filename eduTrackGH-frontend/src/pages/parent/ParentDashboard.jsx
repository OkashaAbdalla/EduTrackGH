/**
 * Parent Dashboard
 * Purpose: View children's attendance for smartphone parents
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { ROUTES } from '../../utils/constants';
import { Card, Loader } from '../../components/common';
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
      } catch {
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
      <div className="page-stack max-w-4xl">
        <div>
          <h1 className="ui-page-title">Parent Dashboard</h1>
          <p className="ui-page-subtitle">Monitor your children's attendance and receive alerts</p>
          {term && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Active term: {term.name} ({term.start} to {term.end})
            </p>
          )}
        </div>

        {children.length > 0 && (
          <Card className="grid-card">
            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Children's Schools
            </p>
            <div className="card-grid-2 gap-2">
              {children.map((child) => (
                <div
                  key={child.studentId}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-2.5 py-2 min-w-0"
                >
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{child.studentName}</p>
                  <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
                    {child.schoolName || 'School not set'}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="card-grid-2">
          {children.map((child) => (
            <Link key={child.studentId} to={`${ROUTES.CHILDREN_ATTENDANCE}/${child.studentId}`} className="block min-w-0">
              <Card variant="action" hover className="grid-card group cursor-pointer transition-all duration-200 hover:shadow-lg h-full">
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 dark:bg-dashboard-accent rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-white">{(child.studentName || 'C').charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white truncate">{child.studentName}</h3>
                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">{child.className}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] md:text-xs">
                      <span className="font-semibold text-green-600 dark:text-green-400">{child.attendancePercentage}%</span>
                      <span className="text-gray-400">A: {child.absent}</span>
                      <span className="text-gray-400">P: {child.present}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          {children.length === 0 && (
            <Card className="grid-card col-span-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">No linked children found for this parent account.</p>
            </Card>
          )}
        </div>

        <Card className="grid-card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm md:text-base font-bold text-gray-900 dark:text-white">Notifications</h2>
            <Link to={ROUTES.PARENT_NOTIFICATIONS} className="text-xs font-semibold text-green-600 dark:text-green-400">
              View all
            </Link>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Unread alerts: {unreadCount}</p>
          {notifications.length > 0 ? (
            <div className="card-grid-2 gap-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`rounded-lg p-2 min-w-0 border ${notif.read ? 'border-gray-200 dark:border-gray-700' : 'border-green-400'}`}
                >
                  <p className="text-[10px] md:text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {notif.child} • {notif.status || 'Update'}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-500">{notif.date}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-500">No notifications yet.</p>
          )}
        </Card>

        <div className="card-grid-2 pt-1">
          <Link to={ROUTES.CHILDREN_ATTENDANCE} className="min-w-0">
            <Card variant="action" hover className="grid-card group cursor-pointer h-full">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-9 h-9 md:w-12 md:h-12 bg-uds-green dark:bg-green-700 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">View Attendance</h3>
                  <p className="hidden md:block text-xs text-gray-600 dark:text-gray-400">Detailed history</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to={ROUTES.PARENT_NOTIFICATIONS} className="min-w-0">
            <Card variant="action" hover className="grid-card group cursor-pointer h-full">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-9 h-9 md:w-12 md:h-12 bg-blue-600 dark:bg-dashboard-accent rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">Notifications</h3>
                  <p className="hidden md:block text-xs text-gray-600 dark:text-gray-400">Alerts & updates</p>
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
