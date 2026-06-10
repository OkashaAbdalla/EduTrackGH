/**
 * Dashboard Layout — glass shell, sticky topbar, role navigation
 */

import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext, useConfirm } from '../context';
import { ROUTES, ROLES } from '../utils/constants';
import {
  TEACHER_MENU_ITEMS,
  HEADTEACHER_MENU_ITEMS,
  ASSISTANT_STANDBY_MENU_ITEMS,
  ASSISTANT_ACTIVE_MENU_ITEMS,
  formatSchoolLevelLabel,
} from '../navigation/dashboardNavConfig';
import { useDelegationStatus } from '../hooks/useDelegationStatus';
import ThemeSwitcher from '../components/common/ThemeSwitcher';
import { NotificationButton, StaffNotificationBell, ProfileAvatar } from '../components/common';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthContext();
  const { requestConfirmation } = useConfirm();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [topbarScrolled, setTopbarScrolled] = useState(false);
  const mainRef = useRef(null);

  const userRole = user?.role || ROLES.TEACHER;
  const displayName = user?.name || user?.email || userRole.replace(/_/g, ' ');
  const { isActing: assistantIsActing, loading: delegationLoading, status: delegationStatus } = useDelegationStatus();

  const handleLogout = async () => {
    const confirmed = await requestConfirmation({
      title: 'Logout',
      message: 'Are you sure to logout?',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      tone: 'danger',
    });
    if (!confirmed) return;
    logout();
    navigate(ROUTES.HOME);
  };

  const handleMainScroll = useCallback(() => {
    const el = mainRef.current;
    if (!el) return;
    setTopbarScrolled(el.scrollTop > 8);
  }, []);

  const navigationMenus = {
    [ROLES.TEACHER]: TEACHER_MENU_ITEMS,
    [ROLES.HEADTEACHER]: HEADTEACHER_MENU_ITEMS,
    [ROLES.PARENT]: [
      { name: 'Dashboard', path: ROUTES.PARENT_DASHBOARD, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { name: 'Children Attendance', path: ROUTES.CHILDREN_ATTENDANCE, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { name: 'Notifications', path: ROUTES.PARENT_NOTIFICATIONS, icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    ],
    [ROLES.ADMIN]: [
      { name: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { name: 'Manage Schools', path: ROUTES.MANAGE_SCHOOLS, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { name: 'Create Headteacher', path: ROUTES.CREATE_HEADTEACHER, icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
      { name: 'Create Assistant HT', path: ROUTES.CREATE_ASSISTANT_HEADTEACHER, icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
      { name: 'Manage Headteachers', path: ROUTES.MANAGE_HEADTEACHERS, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
      { name: 'Assistant Headteachers', path: ROUTES.MANAGE_ASSISTANT_HEADTEACHERS, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      { name: 'Attendance Audit', path: ROUTES.ATTENDANCE_AUDIT, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
      { name: 'Users', path: ROUTES.ADMIN_USERS, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
      { name: 'Students', path: ROUTES.ADMIN_STUDENTS, icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422A12.083 12.083 0 0112 20.055a12.083 12.083 0 01-6.16-9.477L12 14z' },
      { name: 'Classrooms', path: ROUTES.ADMIN_CLASSROOMS, icon: 'M3 7h18M3 12h18M3 17h18' },
      { name: 'GPS Audit', path: ROUTES.ADMIN_GPS_AUDIT, icon: 'M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3z M12 2v3M12 19v3M2 12h3M19 12h3' },
      { name: 'Audit Logs', path: ROUTES.ADMIN_AUDIT_LOGS, icon: 'M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z' },
      { name: 'Auth Logs', path: ROUTES.ADMIN_AUTH_LOGS, icon: 'M12 11V7m0 8h.01M5 20h14a2 2 0 002-2V8l-7-5-7 5v10a2 2 0 002 2z' },
      { name: 'View-As Mode', path: ROUTES.ADMIN_VIEW_AS, icon: 'M8 12h8M12 8v8M4 6h16v12H4z' },
      { name: 'Alerts', path: ROUTES.ADMIN_ALERTS, icon: 'M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z' },
      { name: 'Analytics', path: ROUTES.ADMIN_ANALYTICS, icon: 'M3 3v18h18M7 16l3-3 2 2 5-5' },
      { name: 'Notification Control', path: ROUTES.ADMIN_NOTIFICATION_CONTROL, icon: 'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2c0 .5-.2 1-.6 1.4L4 17h11z' },
      { name: 'GES Calendar', path: ROUTES.GES_CALENDAR, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { name: 'System Settings', path: ROUTES.SYSTEM_SETTINGS, icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    ],
    [ROLES.SUPER_ADMIN]: [
      { name: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { name: 'Manage Schools', path: ROUTES.MANAGE_SCHOOLS, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { name: 'Create Headteacher', path: ROUTES.CREATE_HEADTEACHER, icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
      { name: 'Create Assistant HT', path: ROUTES.CREATE_ASSISTANT_HEADTEACHER, icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
      { name: 'Manage Headteachers', path: ROUTES.MANAGE_HEADTEACHERS, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
      { name: 'Assistant Headteachers', path: ROUTES.MANAGE_ASSISTANT_HEADTEACHERS, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      { name: 'Attendance Audit', path: ROUTES.ATTENDANCE_AUDIT, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
      { name: 'Users', path: ROUTES.ADMIN_USERS, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
      { name: 'Students', path: ROUTES.ADMIN_STUDENTS, icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422A12.083 12.083 0 0112 20.055a12.083 12.083 0 01-6.16-9.477L12 14z' },
      { name: 'Classrooms', path: ROUTES.ADMIN_CLASSROOMS, icon: 'M3 7h18M3 12h18M3 17h18' },
      { name: 'GPS Audit', path: ROUTES.ADMIN_GPS_AUDIT, icon: 'M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3z M12 2v3M12 19v3M2 12h3M19 12h3' },
      { name: 'Audit Logs', path: ROUTES.ADMIN_AUDIT_LOGS, icon: 'M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z' },
      { name: 'Auth Logs', path: ROUTES.ADMIN_AUTH_LOGS, icon: 'M12 11V7m0 8h.01M5 20h14a2 2 0 002-2V8l-7-5-7 5v10a2 2 0 002 2z' },
      { name: 'View-As Mode', path: ROUTES.ADMIN_VIEW_AS, icon: 'M8 12h8M12 8v8M4 6h16v12H4z' },
      { name: 'Alerts', path: ROUTES.ADMIN_ALERTS, icon: 'M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z' },
      { name: 'Analytics', path: ROUTES.ADMIN_ANALYTICS, icon: 'M3 3v18h18M7 16l3-3 2 2 5-5' },
      { name: 'Notification Control', path: ROUTES.ADMIN_NOTIFICATION_CONTROL, icon: 'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2c0 .5-.2 1-.6 1.4L4 17h11z' },
      { name: 'GES Calendar', path: ROUTES.GES_CALENDAR, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { name: 'System Settings', path: ROUTES.SYSTEM_SETTINGS, icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    ],
  };

  const assistantMenu =
    assistantIsActing || (delegationLoading && delegationStatus?.isActing)
      ? ASSISTANT_ACTIVE_MENU_ITEMS
      : ASSISTANT_STANDBY_MENU_ITEMS;
  const menuItems =
    userRole === ROLES.ASSISTANT_HEADTEACHER
      ? assistantMenu
      : navigationMenus[userRole] || navigationMenus[ROLES.TEACHER];
  const sectionLabel =
    userRole === ROLES.TEACHER
      ? ''
      : userRole === ROLES.ASSISTANT_HEADTEACHER
        ? assistantIsActing
          ? 'Acting · Assistant HT'
          : 'Standby · Assistant HT'
        : formatSchoolLevelLabel(user?.schoolLevel);

  return (
    <div className="dashboard-shell h-screen overflow-hidden">
      <aside
        className={`glass-sidebar fixed md:static inset-y-0 left-0 z-50 w-60 transition-transform duration-200 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-14 flex items-center px-4 border-b border-[color:var(--glass-border)] shrink-0">
          <Link to={menuItems[0].path} className="flex items-center gap-2.5 min-w-0">
            <div className="ui-sidebar-logo w-8 h-8 rounded-lg bg-brand flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="ui-sidebar-title text-sm font-semibold tracking-tight text-[color:var(--text-primary)] whitespace-nowrap">
              Edu<span className="text-brand">Track</span> GH
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`ui-nav-link ${isActive ? 'ui-nav-link-active' : ''}`}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.icon} />
                </svg>
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[color:var(--glass-border)] shrink-0">
          <div className="ui-user-chip">
            {user?.avatarUrl ? (
              <ProfileAvatar key={user.avatarUrl || 'no-avatar'} src={user.avatarUrl} name={displayName} size="sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[color:var(--glass)] border border-[color:var(--glass-border)] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[color:var(--text-secondary)]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="ui-user-name" title={displayName}>
                {displayName}
              </span>
              <span className="ui-user-meta capitalize" title={sectionLabel || userRole}>
                {sectionLabel || userRole.replace(/_/g, ' ')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-md text-[color:var(--text-secondary)] hover:text-[color:var(--danger)] hover:bg-red-500/10 transition shrink-0"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="ui-modal-backdrop fixed inset-0 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <main ref={mainRef} onScroll={handleMainScroll} className="dashboard-main">
          <header className={`glass-topbar ${topbarScrolled ? 'glass-topbar-scrolled' : ''}`}>
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg ui-btn-ghost"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 min-w-0" />
            <div className="flex items-center gap-2">
              {userRole === ROLES.PARENT && <NotificationButton />}
              {(userRole === ROLES.HEADTEACHER || userRole === ROLES.TEACHER || userRole === ROLES.ASSISTANT_HEADTEACHER) && (
                <StaffNotificationBell />
              )}
              <ThemeSwitcher />
            </div>
          </header>

          <div className="dashboard-page-body dashboard-content">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
