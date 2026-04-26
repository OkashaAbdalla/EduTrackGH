/**
 * App Component
 * Purpose: Root component with routing configuration
 * 
 * Features:
 *   - React Router setup
 *   - Route definitions
 *   - Global providers (ThemeProvider, AuthContext, etc.)
 * 
 * Note: Following architecture rules - this component only handles routing
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, ToastProvider, ConfirmProvider, AuthProvider, SocketProvider, CalendarProvider } from './context';
import { Landing, Login, Register, VerifyEmail, ForgotPassword, ResetPassword } from './pages/public';
import { AdminLogin } from './pages/admin';
import { ProtectedRoute } from './components/common';
import { ROUTES, ROLES } from './utils/constants';

const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const MarkAttendance = lazy(() => import('./pages/teacher/MarkAttendance'));
const AttendanceHistory = lazy(() => import('./pages/teacher/AttendanceHistory'));
const FlaggedStudents = lazy(() => import('./pages/teacher/FlaggedStudents'));
const TeacherManageStudents = lazy(() => import('./pages/teacher/ManageStudents'));
const TeacherChat = lazy(() => import('./pages/teacher/Chat'));

const HeadteacherDashboard = lazy(() => import('./pages/headteacher/HeadteacherDashboard'));
const SchoolReports = lazy(() => import('./pages/headteacher/SchoolReports'));
const TeacherCompliance = lazy(() => import('./pages/headteacher/TeacherCompliance'));
const ManageClasses = lazy(() => import('./pages/headteacher/ManageClasses'));
const ManageStudents = lazy(() => import('./pages/headteacher/ManageStudents'));
const HeadteacherManageTeachers = lazy(() => import('./pages/headteacher/ManageTeachers'));
const HeadteacherChat = lazy(() => import('./pages/headteacher/Chat'));

const ParentDashboard = lazy(() => import('./pages/parent/ParentDashboard'));
const ChildrenAttendance = lazy(() => import('./pages/parent/ChildrenAttendance'));
const Notifications = lazy(() => import('./pages/parent/Notifications'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const CreateHeadteacher = lazy(() => import('./pages/admin/CreateHeadteacher'));
const ManageSchools = lazy(() => import('./pages/admin/ManageSchools'));
const ManageHeadteachers = lazy(() => import('./pages/admin/ManageHeadteachers'));
const AttendanceAudit = lazy(() => import('./pages/admin/AttendanceAudit'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));
const GesCalendarManagement = lazy(() => import('./pages/admin/GesCalendarManagement'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminStudents = lazy(() => import('./pages/admin/AdminStudents'));
const AdminClassrooms = lazy(() => import('./pages/admin/AdminClassrooms'));
const AdminGpsAudit = lazy(() => import('./pages/admin/AdminGpsAudit'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs'));
const AdminAlerts = lazy(() => import('./pages/admin/AdminAlerts'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminNotificationControl = lazy(() => import('./pages/admin/AdminNotificationControl'));
const AdminAuthLogs = lazy(() => import('./pages/admin/AdminAuthLogs'));
const AdminViewAs = lazy(() => import('./pages/admin/AdminViewAs'));

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
        <AuthProvider>
          <CalendarProvider>
          <SocketProvider>
          <Router>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>}>
        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.HOME} element={<Landing />} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
          <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
          
          {/* Admin Login - Secure Path */}
          <Route path={`/${import.meta.env.VITE_ADMIN_LOGIN_PATH || 'secure-admin'}`} element={<AdminLogin />} />
          
          {/* Teacher Routes - Protected */}
          <Route path={ROUTES.TEACHER_DASHBOARD} element={<ProtectedRoute requiredRole={ROLES.TEACHER}><TeacherDashboard /></ProtectedRoute>} />
          <Route path={ROUTES.MARK_ATTENDANCE} element={<ProtectedRoute requiredRole={ROLES.TEACHER}><MarkAttendance /></ProtectedRoute>} />
          <Route path={ROUTES.ATTENDANCE_HISTORY} element={<ProtectedRoute requiredRole={ROLES.TEACHER}><AttendanceHistory /></ProtectedRoute>} />
          <Route path={ROUTES.FLAGGED_STUDENTS} element={<ProtectedRoute requiredRole={ROLES.TEACHER}><FlaggedStudents /></ProtectedRoute>} />
          <Route path={ROUTES.TEACHER_MANAGE_STUDENTS} element={<ProtectedRoute requiredRole={ROLES.TEACHER}><TeacherManageStudents /></ProtectedRoute>} />
          <Route path={ROUTES.TEACHER_CHAT} element={<ProtectedRoute requiredRole={ROLES.TEACHER}><TeacherChat /></ProtectedRoute>} />
          
          {/* Headteacher Routes - Protected */}
          <Route path={ROUTES.HEADTEACHER_DASHBOARD} element={<ProtectedRoute requiredRole={ROLES.HEADTEACHER}><HeadteacherDashboard /></ProtectedRoute>} />
          <Route path={ROUTES.SCHOOL_REPORTS} element={<ProtectedRoute requiredRole={ROLES.HEADTEACHER}><SchoolReports /></ProtectedRoute>} />
          <Route path={ROUTES.TEACHER_COMPLIANCE} element={<ProtectedRoute requiredRole={ROLES.HEADTEACHER}><TeacherCompliance /></ProtectedRoute>} />
          <Route path={ROUTES.MANAGE_CLASSES} element={<ProtectedRoute requiredRole={ROLES.HEADTEACHER}><ManageClasses /></ProtectedRoute>} />
          <Route path={ROUTES.HEADTEACHER_MANAGE_STUDENTS} element={<ProtectedRoute requiredRole={ROLES.HEADTEACHER}><ManageStudents /></ProtectedRoute>} />
          <Route path={ROUTES.HEADTEACHER_MANAGE_TEACHERS} element={<ProtectedRoute requiredRole={ROLES.HEADTEACHER}><HeadteacherManageTeachers /></ProtectedRoute>} />
          <Route path={ROUTES.HEADTEACHER_CHAT} element={<ProtectedRoute requiredRole={ROLES.HEADTEACHER}><HeadteacherChat /></ProtectedRoute>} />
          
          {/* Parent Routes - Protected */}
          <Route path={ROUTES.PARENT_DASHBOARD} element={<ProtectedRoute requiredRole={ROLES.PARENT}><ParentDashboard /></ProtectedRoute>} />
          <Route path={ROUTES.CHILDREN_ATTENDANCE} element={<ProtectedRoute requiredRole={ROLES.PARENT}><ChildrenAttendance /></ProtectedRoute>} />
          <Route path={`${ROUTES.CHILDREN_ATTENDANCE}/:childId`} element={<ProtectedRoute requiredRole={ROLES.PARENT}><ChildrenAttendance /></ProtectedRoute>} />
          <Route path={ROUTES.PARENT_NOTIFICATIONS} element={<ProtectedRoute requiredRole={ROLES.PARENT}><Notifications /></ProtectedRoute>} />
          
          {/* Admin Routes - Protected */}
          <Route path={ROUTES.ADMIN_DASHBOARD} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><AdminDashboard /></ProtectedRoute>} />
          <Route path={ROUTES.MANAGE_SCHOOLS} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><ManageSchools /></ProtectedRoute>} />
          <Route path={ROUTES.CREATE_HEADTEACHER} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><CreateHeadteacher /></ProtectedRoute>} />
          <Route path={ROUTES.MANAGE_HEADTEACHERS} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><ManageHeadteachers /></ProtectedRoute>} />
          <Route path={ROUTES.ATTENDANCE_AUDIT} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><AttendanceAudit /></ProtectedRoute>} />
          <Route path={ROUTES.GES_CALENDAR} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><GesCalendarManagement /></ProtectedRoute>} />
          <Route path={ROUTES.SYSTEM_SETTINGS} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><SystemSettings /></ProtectedRoute>} />
          <Route path={ROUTES.ADMIN_USERS} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><AdminUsers /></ProtectedRoute>} />
          <Route path={ROUTES.ADMIN_STUDENTS} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><AdminStudents /></ProtectedRoute>} />
          <Route path={ROUTES.ADMIN_CLASSROOMS} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><AdminClassrooms /></ProtectedRoute>} />
          <Route path={ROUTES.ADMIN_GPS_AUDIT} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><AdminGpsAudit /></ProtectedRoute>} />
          <Route path={ROUTES.ADMIN_AUDIT_LOGS} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><AdminAuditLogs /></ProtectedRoute>} />
          <Route path={ROUTES.ADMIN_ALERTS} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><AdminAlerts /></ProtectedRoute>} />
          <Route path={ROUTES.ADMIN_ANALYTICS} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><AdminAnalytics /></ProtectedRoute>} />
          <Route path={ROUTES.ADMIN_NOTIFICATION_CONTROL} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><AdminNotificationControl /></ProtectedRoute>} />
          <Route path={ROUTES.ADMIN_AUTH_LOGS} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><AdminAuthLogs /></ProtectedRoute>} />
          <Route path={ROUTES.ADMIN_VIEW_AS} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><AdminViewAs /></ProtectedRoute>} />
          <Route path={`${ROUTES.ADMIN_VIEW_AS}/:role/:id`} element={<ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}><AdminViewAs /></ProtectedRoute>} />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
        </Suspense>
      </Router>
      </SocketProvider>
          </CalendarProvider>
        </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
