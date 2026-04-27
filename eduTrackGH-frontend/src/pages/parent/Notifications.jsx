/**
 * Notifications Page
 * Purpose: View SMS and email notifications sent to parent
 */

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import notificationService from '../../services/notificationService';
import {
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
  unlockNotificationSound,
  playParentNotificationSound,
} from '../../utils/notificationSound';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
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

  const fetchNotifications = async (withSound = false) => {
    try {
      if (!withSound) {
        setLoading(true);
        setError(null);
      }
      const response = await notificationService.getMyNotifications();
      if (response.success && Array.isArray(response.notifications)) {
        setNotifications(response.notifications);
        const latestUnread = response.unreadCount || 0;
        setUnreadCount(latestUnread);
        if (withSound && soundEnabled && latestUnread > previousUnreadRef.current) {
          playParentNotificationSound();
        }
        previousUnreadRef.current = latestUnread;
      } else {
        setNotifications([]);
        setUnreadCount(0);
        if (!response.success) setError(response.message || 'Failed to load notifications');
      }
    } catch (err) {
      setNotifications([]);
      setUnreadCount(0);
      setError('Failed to load notifications');
    } finally {
      if (!withSound) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(false);
    const pollId = setInterval(() => fetchNotifications(true), 15000);
    return () => clearInterval(pollId);
  }, [soundEnabled]);

  const handleMarkAsRead = async (id) => {
    const response = await notificationService.markAsRead(id);
    if (response.success) fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    const response = await notificationService.markAllAsRead();
    if (response.success) fetchNotifications();
  };

  const getTypeIcon = (type) => {
    if (type === 'present') {
      return (
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    if (type === 'absence') {
      return (
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    }
    if (type === 'late') {
      return (
        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">SMS and email alerts about your children</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Unread: {unreadCount}</p>
          <div className="mt-3">
            <button
              type="button"
              onClick={handleEnableSound}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {soundEnabled ? 'Notification Sound Enabled' : 'Enable Notification Sound'}
            </button>
          </div>
        </div>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="px-3 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700"
          >
            Mark all as read
          </button>
        )}

        {error && (
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </Card>
        )}
        {loading ? (
          <Card className="p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
          </Card>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Card key={notif.id} className={`p-5 ${!notif.read ? 'border-l-4 border-green-600' : ''}`}>
                <div className="flex items-start space-x-4">
                  {getTypeIcon(notif.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notif.child} • {notif.status}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-500">{notif.date}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                    {!notif.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="mt-2 text-xs font-semibold text-green-600 dark:text-green-400 hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-lg font-medium">No notifications yet</p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
