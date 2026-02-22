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

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, ToastProvider, AuthProvider } from './context';
import { Landing, Login, Register, VerifyEmail } from './pages/public';
import { TeacherDashboard, MarkAttendance, AttendanceHistory, FlaggedStudents } from './pages/teacher';
import { HeadteacherDashboard, SchoolReports, TeacherCompliance, ManageClasses } from './pages/headteacher';
import { ParentDashboard, ChildrenAttendance, Notifications } from './pages/parent';
import { AdminDashboard, AdminLogin, CreateHeadteacher, ManageSchools, ManageTeachers, SystemSettings, AttendanceAudit } from './pages/admin';
import { ProtectedRoute } from './components/common';
import { ROUTES, ROLES } from './utils/constants';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.HOME} element={<Landing />} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
          <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
          <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLogin />} />
          
          {/* Teacher Routes - Protected */}
          <Route path={ROUTES.TEACHER_DASHBOARD} element={<ProtectedRoute requiredRole={ROLES.TEACHER}><TeacherDashboard /></ProtectedRoute>} />
          <Route path={ROUTES.MARK_ATTENDANCE} element={<ProtectedRoute requiredRole={ROLES.TEACHER}><MarkAttendance /></ProtectedRoute>} />
          <Route path={ROUTES.ATTENDANCE_HISTORY} element={<ProtectedRoute requiredRole={ROLES.TEACHER}><AttendanceHistory /></ProtectedRoute>} />
          <Route path={ROUTES.FLAGGED_STUDENTS} element={<ProtectedRoute requiredRole={ROLES.TEACHER}><FlaggedStudents /></ProtectedRoute>} />
          
          {/* Headteacher Routes - Protected */}
          <Route path={ROUTES.HEADTEACHER_DASHBOARD} element={<ProtectedRoute requiredRole={ROLES.HEADTEACHER}><HeadteacherDashboard /></ProtectedRoute>} />
          <Route path={ROUTES.SCHOOL_REPORTS} element={<ProtectedRoute requiredRole={ROLES.HEADTEACHER}><SchoolReports /></ProtectedRoute>} />
          <Route path={ROUTES.TEACHER_COMPLIANCE} element={<ProtectedRoute requiredRole={ROLES.HEADTEACHER}><TeacherCompliance /></ProtectedRoute>} />
          <Route path={ROUTES.MANAGE_CLASSES} element={<ProtectedRoute requiredRole={ROLES.HEADTEACHER}><ManageClasses /></ProtectedRoute>} />
          
          {/* Parent Routes - Protected */}
          <Route path={ROUTES.PARENT_DASHBOARD} element={<ProtectedRoute requiredRole={ROLES.PARENT}><ParentDashboard /></ProtectedRoute>} />
          <Route path={ROUTES.CHILDREN_ATTENDANCE} element={<ProtectedRoute requiredRole={ROLES.PARENT}><ChildrenAttendance /></ProtectedRoute>} />
          <Route path={`${ROUTES.CHILDREN_ATTENDANCE}/:childId`} element={<ProtectedRoute requiredRole={ROLES.PARENT}><ChildrenAttendance /></ProtectedRoute>} />
          <Route path={ROUTES.PARENT_NOTIFICATIONS} element={<ProtectedRoute requiredRole={ROLES.PARENT}><Notifications /></ProtectedRoute>} />
          
          {/* Admin Routes - Protected */}
          <Route path={ROUTES.ADMIN_DASHBOARD} element={<ProtectedRoute requiredRole={ROLES.ADMIN}><AdminDashboard /></ProtectedRoute>} />
          <Route path={ROUTES.MANAGE_SCHOOLS} element={<ProtectedRoute requiredRole={ROLES.ADMIN}><ManageSchools /></ProtectedRoute>} />
          <Route path={ROUTES.CREATE_HEADTEACHER} element={<ProtectedRoute requiredRole={ROLES.ADMIN}><CreateHeadteacher /></ProtectedRoute>} />
          <Route path={ROUTES.MANAGE_TEACHERS} element={<ProtectedRoute requiredRole={ROLES.ADMIN}><ManageTeachers /></ProtectedRoute>} />
          <Route path={ROUTES.SYSTEM_SETTINGS} element={<ProtectedRoute requiredRole={ROLES.ADMIN}><SystemSettings /></ProtectedRoute>} />
          <Route path={ROUTES.ATTENDANCE_AUDIT} element={<ProtectedRoute requiredRole={ROLES.ADMIN}><AttendanceAudit /></ProtectedRoute>} />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
