/**
 * Single source of truth for teacher & headteacher sidebar menus.
 * Same routes for Primary (P1–P6) and JHS (1–3); backend scopes data by schoolLevel.
 */
import { ROUTES, ROLES } from '../utils/constants';

/** SVG path `d` values (Heroicons outline), matched to DashboardLayout icons */
export const TEACHER_MENU_ITEMS = [
  {
    name: 'Dashboard',
    path: ROUTES.TEACHER_DASHBOARD,
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    name: 'Mark Attendance',
    path: ROUTES.MARK_ATTENDANCE,
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    name: 'Propose Students',
    path: ROUTES.TEACHER_MANAGE_STUDENTS,
    icon: 'M12 4v16m8-8H4',
  },
  {
    name: 'Attendance History',
    path: ROUTES.ATTENDANCE_HISTORY,
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    name: 'Flagged Students',
    path: ROUTES.FLAGGED_STUDENTS,
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  {
    name: 'Messages',
    path: ROUTES.TEACHER_CHAT,
    icon: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 20l1.2-3.6A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
];

export const HEADTEACHER_MENU_ITEMS = [
  {
    name: 'Dashboard',
    path: ROUTES.HEADTEACHER_DASHBOARD,
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    name: 'Manage Students',
    path: ROUTES.HEADTEACHER_MANAGE_STUDENTS,
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    name: 'Manage Teachers',
    path: ROUTES.HEADTEACHER_MANAGE_TEACHERS,
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    name: 'Messages',
    path: ROUTES.HEADTEACHER_CHAT,
    icon: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 20l1.2-3.6A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
  {
    name: 'School Reports',
    path: ROUTES.SCHOOL_REPORTS,
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    name: 'Teacher Compliance',
    path: ROUTES.TEACHER_COMPLIANCE,
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    name: 'Manage Classes',
    path: ROUTES.MANAGE_CLASSES,
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  },
];

export const NAVIGATION_BY_ROLE = {
  [ROLES.TEACHER]: TEACHER_MENU_ITEMS,
  [ROLES.HEADTEACHER]: HEADTEACHER_MENU_ITEMS,
};

/** Short label for sidebar/footer (Primary vs JHS) */
export function formatSchoolLevelLabel(schoolLevel) {
  if (schoolLevel === 'PRIMARY') return 'Primary · P1–P6';
  if (schoolLevel === 'JHS') return 'JHS · 1–3';
  return null;
}
