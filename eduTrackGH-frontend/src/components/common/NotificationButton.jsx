/**
 * Notification Button Component
 * Purpose: Display notifications in navbar with toggle for sound
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import notificationService from '../../services/notificationService';
import {
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
  unlockNotificationSound,
  playParentNotificationSound,
} from '../../utils/notificationSound';

const NotificationButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(() => isNotificationSoundEnabled());
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const previousUnreadRef = useRef(0);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fetch notifications
  const fetchNotifications = async (withSound = false) => {
    try {
      if (!withSound) setLoading(true);
      const response = await notificationService.getMyNotifications();
      const notifs = response?.notifications || [];
      const latestUnread = response?.unreadCount || 0;

      // Filter to show only unread notifications
      const unreadNotifs = notifs.filter(notif => !notif.read);
      setNotifications(unreadNotifs.slice(0, 5));
      setUnreadCount(latestUnread);

      // Play sound if new notifications arrived
      if (withSound && soundEnabled && latestUnread > previousUnreadRef.current) {
        playParentNotificationSound();
      }
      previousUnreadRef.current = latestUnread;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      if (!withSound) setLoading(false);
    }
  };

  // Initial load and polling
  useEffect(() => {
    fetchNotifications(false);
    const pollId = setInterval(() => fetchNotifications(true), 15000);
    return () => clearInterval(pollId);
  }, [soundEnabled]);

  const handleToggleSound = async () => {
    if (!soundEnabled) {
      const unlocked = await unlockNotificationSound();
      if (unlocked) {
        setNotificationSoundEnabled(true);
        setSoundEnabled(true);
        await playParentNotificationSound();
      } else {
        setNotificationSoundEnabled(false);
        setSoundEnabled(false);
      }
    } else {
      setNotificationSoundEnabled(false);
      setSoundEnabled(false);
    }
  };

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={handleToggleDropdown}
        className="relative p-2 rounded-lg text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--glass)] transition-all duration-150"
        aria-label="Notifications"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-[color:var(--bg-elevated)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 ui-modal shadow-2xl z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[color:var(--glass-border)] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">
                Notifications
              </h3>
              <p className="text-xs text-[color:var(--text-secondary)] mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            <Link
              to={ROUTES.PARENT_NOTIFICATIONS}
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-[color:var(--accent)] hover:text-[color:var(--accent-hover)] transition"
            >
              View all
            </Link>
          </div>

          {/* Sound Toggle */}
          <div className="px-4 py-3 border-b border-[color:var(--glass-border)] bg-[color:var(--glass)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg
                  className={`w-4 h-4 ${soundEnabled ? 'text-[color:var(--accent)]' : 'text-[color:var(--text-muted)]'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={soundEnabled 
                      ? "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      : "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                    }
                  />
                </svg>
                <span className="text-xs font-medium text-[color:var(--text-primary)]">
                  Notification Sound
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleSound}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] focus:ring-offset-2 ${
                  soundEnabled ? 'bg-[color:var(--accent)]' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="ui-spinner w-6 h-6" />
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-[color:var(--glass-border)]">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="px-4 py-3 hover:bg-[color:var(--glass)] transition-colors cursor-pointer bg-[color:var(--accent-muted)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-[color:var(--accent)]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[color:var(--text-primary)] mb-0.5">
                          {notif.child} • {notif.status || 'Update'}
                        </p>
                        <p className="text-xs text-[color:var(--text-secondary)] line-clamp-2">
                          {notif.message}
                        </p>
                        {notif.timestamp && (
                          <p className="text-[10px] text-[color:var(--text-muted)] mt-1">
                            {new Date(notif.timestamp).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <svg
                  className="w-12 h-12 text-[color:var(--text-muted)] opacity-50 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-[color:var(--text-primary)] mb-1">
                  All caught up!
                </p>
                <p className="text-xs text-[color:var(--text-secondary)] text-center">
                  No unread notifications
                </p>
              </div>
            )}
          </div>

          {/* View All Footer - Only show if there are notifications */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-[color:var(--glass-border)] bg-[color:var(--glass)]">
              <Link
                to={ROUTES.PARENT_NOTIFICATIONS}
                onClick={() => setIsOpen(false)}
                className="block text-center text-sm font-medium text-[color:var(--accent)] hover:text-[color:var(--accent-hover)] transition"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationButton;
