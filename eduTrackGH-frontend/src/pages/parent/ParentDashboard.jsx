/**
 * Parent Dashboard
 * Purpose: View children's attendance for smartphone parents
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { ROUTES } from '../../utils/constants';
import { Card } from '../../components/common';
import parentService from '../../services/parentService';
import notificationService from '../../services/notificationService';
import {
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
  unlockNotificationSound,
  playParentNotificationSound,
} from '../../utils/notificationSound';

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [term, setTerm] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const previousUnreadRef = useRef(0);
  const [soundEnabled, setSoundEnabled] = useState(() => isNotificationSoundEnabled());

  const handleEnableSound = async () => {
    const unlocked = await unlockNotificationSound();
    if (unlocked) {
      setNotificationSoundEnabled(true);
      setSoundEnabled(true);
      await playParentNotificationSound();
      return;
    }
    setNotificationSoundEnabled(false);
    setSoundEnabled(false);
  };

  useEffect(() => {
    const loadDashboard = async (withSound = false) => {
      try {
        if (!withSound) setLoading(true);
        const [overview, notifRes] = await Promise.all([
          parentService.getAttendanceOverview(),
          notificationService.getMyNotifications(),
        ]);
        setChildren(overview?.children || []);
        setTerm(overview?.term || null);
        setNotifications((notifRes?.notifications || []).slice(0, 5));
        const latestUnread = notifRes?.unreadCount || 0;
        setUnreadCount(latestUnread);
        if (withSound && soundEnabled && latestUnread > previousUnreadRef.current) {
          playParentNotificationSound();
        }
        previousUnreadRef.current = latestUnread;
      } catch (error) {
        setChildren([]);
        setTerm(null);
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        if (!withSound) setLoading(false);
      }
    };
    loadDashboard(false);
    const pollId = setInterval(() => loadDashboard(true), 15000);
    return () => clearInterval(pollId);
  }, [soundEnabled]);

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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parent Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor your children's attendance and receive alerts</p>
          <div className="mt-3">
            <button
              type="button"
              onClick={handleEnableSound}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {soundEnabled ? 'Notification Sound Enabled' : 'Enable Notification Sound'}
            </button>
          </div>
          {term && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Active term: {term.name} ({term.start} to {term.end})
            </p>
          )}
        </div>

        {/* Children List */}
        <div>
          {children.map((child) => (
            <Link key={child.studentId} to={`${ROUTES.CHILDREN_ATTENDANCE}/${child.studentId}`} className="block mb-6">
              <Card variant="action" hover className="p-8 group cursor-pointer transition-shadow duration-300 hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-2xl font-bold text-white">{(child.studentName || 'C').charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{child.studentName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{child.className}</p>
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Attendance Rate</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              {child.attendancePercentage}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Absent</p>
                            <p className="text-lg font-bold text-red-600 dark:text-red-400">{child.absent}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-2 bg-green-600 dark:bg-green-500"
                            style={{ width: `${Math.min(child.attendancePercentage || 0, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Present: {child.present} • Late: {child.late} • Total school days: {child.totalSchoolDays}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 group-hover:translate-x-1 transition-transform">
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          {children.length === 0 && (
            <Card className="p-6">
              <p className="text-gray-600 dark:text-gray-400">No linked children found for this parent account.</p>
            </Card>
          )}
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h2>
            <Link to={ROUTES.PARENT_NOTIFICATIONS} className="text-sm font-semibold text-green-600 dark:text-green-400">
              View all
            </Link>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Unread alerts: {unreadCount}</p>
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`rounded-lg p-3 border ${notif.read ? 'border-gray-200 dark:border-gray-700' : 'border-green-400'}`}
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {notif.child} • {notif.status || 'Update'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{notif.message}</p>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-500">No notifications yet.</p>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <Link to={ROUTES.CHILDREN_ATTENDANCE}>
            <Card variant="action" hover className="p-8 group cursor-pointer transition-shadow duration-300 hover:shadow-xl">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:from-green-600 group-hover:to-green-700 dark:group-hover:from-green-700 dark:group-hover:to-green-800">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">View All Attendance</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">See detailed attendance history</p>
                  <div className="mt-3 flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                    <span>View details</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link to={ROUTES.PARENT_NOTIFICATIONS}>
            <Card variant="action" hover className="p-8 group cursor-pointer transition-shadow duration-300 hover:shadow-xl">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:from-blue-600 group-hover:to-blue-700 dark:group-hover:from-blue-700 dark:group-hover:to-blue-800">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">View absence alerts and updates</p>
                  <div className="mt-3 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                    <span>View alerts</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
