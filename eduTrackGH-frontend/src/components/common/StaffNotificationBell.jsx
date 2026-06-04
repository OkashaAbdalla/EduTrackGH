/**
 * In-app notification bell for teachers and headteachers.
 * Alerts: chat messages, attendance unlock requests / unlock confirmations, unmarked attendance (HT).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES, ROLES } from '../../utils/constants';
import { useAuthContext, useSocket } from '../../context';
import headteacherService from '../../services/headteacherService';
import teacherNotificationService from '../../services/teacherNotificationService';
import {
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
  unlockNotificationSound,
  playParentNotificationSound,
} from '../../utils/notificationSound';

const formatNotifTitle = (notif, isHeadteacher) => {
  if (notif.type === 'unmarked_attendance') {
    return `${notif.teacherName || 'Teacher'}: Unmarked attendance`;
  }
  if (notif.type === 'chat_message') {
    return isHeadteacher ? 'New message from teacher' : 'New message from headteacher';
  }
  if (notif.type === 'unlock_request') {
    return 'Attendance unlock request';
  }
  if (notif.type === 'attendance_unlocked') {
    return 'Attendance unlocked';
  }
  return notif.senderName || 'Notification';
};

const notifDotClass = (type) => {
  if (type === 'chat_message') return 'bg-indigo-500';
  if (type === 'unlock_request') return 'bg-amber-500';
  if (type === 'attendance_unlocked') return 'bg-emerald-500';
  if (type === 'unmarked_attendance') return 'bg-red-500';
  return 'bg-[color:var(--accent)]';
};

const normalizeNotif = (n) => ({
  ...n,
  id: n?.id?.toString?.() || String(n?.id ?? ''),
  read: Boolean(n?.read),
});

const mergeUnread = (incoming, prev) => {
  const id = String(incoming.id);
  const without = prev.filter((n) => String(n.id) !== id);
  return [normalizeNotif({ ...incoming, read: false }), ...without].slice(0, 10);
};

const StaffNotificationBell = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { socket } = useSocket();
  const isHeadteacher = user?.role === ROLES.HEADTEACHER;

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(() => isNotificationSoundEnabled());
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const dropdownRef = useRef(null);
  const previousUnreadRef = useRef(0);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const fetchNotifications = useCallback(
    async ({ withSound = false, showSpinner = false } = {}) => {
      if (fetchingRef.current && !showSpinner) return;
      fetchingRef.current = true;
      if (showSpinner) setLoading(true);
      setFetchError(null);

      try {
        const response = isHeadteacher
          ? await headteacherService.getNotifications()
          : await teacherNotificationService.getNotifications();

        if (response?.success === false) {
          setFetchError(response?.message || 'Could not load notifications');
          return;
        }

        const notifs = (response?.notifications || []).map(normalizeNotif);
        const latestUnread = response?.unreadCount ?? notifs.filter((n) => !n.read).length;
        const unreadNotifs = notifs.filter((n) => !n.read);
        setNotifications(unreadNotifs.slice(0, 10));
        setUnreadCount(latestUnread);

        if (withSound && soundEnabled && latestUnread > previousUnreadRef.current) {
          playParentNotificationSound();
        }
        previousUnreadRef.current = latestUnread;
      } catch (error) {
        console.error('Failed to fetch staff notifications:', error);
        setFetchError('Could not load notifications. Check that the backend is running.');
      } finally {
        fetchingRef.current = false;
        if (showSpinner) setLoading(false);
      }
    },
    [isHeadteacher, soundEnabled]
  );

  useEffect(() => {
    fetchNotifications({ withSound: false, showSpinner: false });
    const pollId = setInterval(() => fetchNotifications({ withSound: true, showSpinner: false }), 15000);
    return () => clearInterval(pollId);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return;

    const onStaffPayload = (payload) => {
      const incoming = payload?.notification;
      if (incoming?.id) {
        setNotifications((prev) => mergeUnread(incoming, prev));
        if (soundEnabled) playParentNotificationSound();
        fetchNotifications({ withSound: false, showSpinner: false });
        return;
      }
      fetchNotifications({ withSound: true, showSpinner: false });
    };

    const onRefresh = () => fetchNotifications({ withSound: true, showSpinner: false });

    socket.on('staff_notification', onStaffPayload);
    socket.on('chat_message', onRefresh);
    if (isHeadteacher) {
      socket.on('headteacher_notification', onRefresh);
      socket.on('unlock_request', onRefresh);
      socket.on('compliance_updated', onRefresh);
    } else {
      socket.on('attendance_unlocked', onRefresh);
    }
    return () => {
      socket.off('staff_notification', onStaffPayload);
      socket.off('chat_message', onRefresh);
      if (isHeadteacher) {
        socket.off('headteacher_notification', onRefresh);
        socket.off('unlock_request', onRefresh);
        socket.off('compliance_updated', onRefresh);
      } else {
        socket.off('attendance_unlocked', onRefresh);
      }
    };
  }, [socket, fetchNotifications, isHeadteacher, soundEnabled]);

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

  const handleOpenNotif = async (notif) => {
    setIsOpen(false);
    const source = notif.source === 'staff' ? 'staff' : 'compliance';
    try {
      if (isHeadteacher) {
        await headteacherService.markNotificationRead(notif.id, source);
      } else {
        await teacherNotificationService.markAsRead(notif.id);
      }
      setNotifications((prev) => prev.filter((n) => String(n.id) !== String(notif.id)));
      setUnreadCount((c) => Math.max(0, c - 1));
      previousUnreadRef.current = Math.max(0, previousUnreadRef.current - 1);
    } catch {
      /* ignore */
    }

    if (notif.type === 'chat_message') {
      if (isHeadteacher && notif.otherUserId) {
        navigate(`${ROUTES.HEADTEACHER_CHAT}?teacher=${notif.otherUserId}`);
      } else {
        navigate(ROUTES.TEACHER_CHAT, { state: { openUserId: notif.otherUserId } });
      }
      return;
    }
    if (notif.type === 'unlock_request') {
      navigate(ROUTES.HEADTEACHER_DASHBOARD);
      return;
    }
    if (notif.type === 'attendance_unlocked') {
      const params = new URLSearchParams();
      if (notif.classroomId) params.set('classroomId', notif.classroomId);
      if (notif.attendanceDate) params.set('date', notif.attendanceDate);
      navigate(`${ROUTES.MARK_ATTENDANCE}${params.toString() ? `?${params}` : ''}`);
      return;
    }
    if (notif.type === 'unmarked_attendance') {
      navigate(ROUTES.TEACHER_COMPLIANCE);
    }
  };

  const quickLink = isHeadteacher ? ROUTES.HEADTEACHER_DASHBOARD : ROUTES.TEACHER_CHAT;
  const quickLinkLabel = isHeadteacher ? 'Dashboard' : 'Messages';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          const opening = !isOpen;
          setIsOpen(opening);
          if (opening) fetchNotifications({ showSpinner: true });
        }}
        className="relative p-2 rounded-lg text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--glass)] transition-all duration-150"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 ui-modal shadow-2xl z-50 max-h-[500px] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[color:var(--glass-border)] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">Notifications</h3>
              <p className="text-xs text-[color:var(--text-secondary)] mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            <Link
              to={quickLink}
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-[color:var(--accent)] hover:text-[color:var(--accent-hover)] transition"
            >
              {quickLinkLabel}
            </Link>
          </div>

          <div className="px-4 py-3 border-b border-[color:var(--glass-border)] bg-[color:var(--glass)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[color:var(--text-primary)]">Notification Sound</span>
              <button
                type="button"
                onClick={handleToggleSound}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
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

          <div className="flex-1 overflow-y-auto min-h-[120px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="ui-spinner w-6 h-6" />
              </div>
            ) : fetchError ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-red-600 dark:text-red-400">{fetchError}</p>
                <button
                  type="button"
                  onClick={() => fetchNotifications({ showSpinner: true })}
                  className="mt-2 text-xs font-semibold text-[color:var(--accent)]"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-[color:var(--glass-border)]">
                {notifications.map((notif) => (
                  <button
                    key={`${notif.source || 'staff'}-${notif.id}`}
                    type="button"
                    onClick={() => handleOpenNotif(notif)}
                    className="w-full text-left px-4 py-3 hover:bg-[color:var(--glass)] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notifDotClass(notif.type)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[color:var(--text-primary)]">
                          {formatNotifTitle(notif, isHeadteacher)}
                        </p>
                        <p className="text-xs text-[color:var(--text-secondary)] line-clamp-2 mt-0.5">
                          {notif.message}
                        </p>
                        {notif.createdAt && (
                          <p className="text-[10px] text-[color:var(--text-muted)] mt-1">
                            {new Date(notif.createdAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <p className="text-sm font-medium text-[color:var(--text-primary)] mb-1">All caught up!</p>
                <p className="text-xs text-[color:var(--text-secondary)] text-center">
                  Messages and unlock alerts will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffNotificationBell;
