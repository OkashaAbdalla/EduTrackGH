/**
 * Notifications Page
 * Purpose: View SMS and email notifications sent to parent
 */

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import ContextMenu from '../../components/common/ContextMenu';
import { useConfirm } from '../../context';
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
  const [contextMenu, setContextMenu] = useState(null);
  const { requestConfirmation } = useConfirm();

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
    } catch {
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

  const handleDeleteNotif = async (notif) => {
    const ok = await requestConfirmation({
      title: 'Delete Notification',
      message: 'Remove this notification permanently?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      tone: 'danger',
    });
    if (!ok) return;

    const response = await notificationService.deleteNotification(notif.id);
    if (response.success) {
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      if (!notif.read) {
        setUnreadCount((c) => Math.max(0, c - 1));
        previousUnreadRef.current = Math.max(0, previousUnreadRef.current - 1);
      }
    }
  };

  const handleNotifContextMenu = (e, notif) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, notif });
  };

  const getTypeIcon = (type) => {
    if (type === 'present') {
      return (
        <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    if (type === 'absence') {
      return (
        <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    }
    if (type === 'late') {
      return (
        <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="page-stack max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">SMS and email alerts about your children</p>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500 mt-1">Unread: {unreadCount}</p>
          <div className="mt-2 md:mt-3 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleEnableSound}
              className="px-3 py-2 rounded-lg text-xs md:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {soundEnabled ? 'Notification Sound Enabled' : 'Enable Notification Sound'}
            </button>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-3 py-2 rounded-lg text-xs md:text-sm font-semibold bg-green-600 text-white hover:bg-green-700"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {error && (
          <Card className="p-3 md:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </Card>
        )}
        {loading ? (
          <Card className="p-8 md:p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
          </Card>
        ) : notifications.length > 0 ? (
          <div className="space-y-2 md:space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onContextMenu={(e) => handleNotifContextMenu(e, notif)}
                className="cursor-context-menu"
              >
                <Card className={`p-3 md:p-5 ${!notif.read ? 'border-l-4 border-green-600' : ''}`}>
                  <div className="flex items-start gap-3">
                    {getTypeIcon(notif.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between">
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white min-w-0 break-words">
                          {notif.child} • {notif.status}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-500 shrink-0">{notif.date}</span>
                      </div>
                      {notif.schoolName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{notif.schoolName}</p>
                      )}
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
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-8 md:p-12">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-base md:text-lg font-medium">No notifications yet</p>
            </div>
          </Card>
        )}

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={[
              {
                id: 'delete',
                label: 'Delete',
                danger: true,
                onClick: () => handleDeleteNotif(contextMenu.notif),
              },
            ]}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
