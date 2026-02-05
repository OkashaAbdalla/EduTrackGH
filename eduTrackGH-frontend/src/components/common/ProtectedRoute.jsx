/**
 * Protected Route Component
 * Purpose: Wrapper for routes that require authentication
 * Redirects to login if user is not authenticated
 */

import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../context';
import { ROUTES, ROLES } from '../../utils/constants';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    let dashboardRoute = ROUTES.LOGIN;

    if (user?.role === ROLES.TEACHER) {
      dashboardRoute = ROUTES.TEACHER_DASHBOARD;
    } else if (user?.role === ROLES.HEADTEACHER) {
      dashboardRoute = ROUTES.HEADTEACHER_DASHBOARD;
    } else if (user?.role === ROLES.PARENT) {
      dashboardRoute = ROUTES.PARENT_DASHBOARD;
    } else if (user?.role === ROLES.ADMIN) {
      dashboardRoute = ROUTES.ADMIN_DASHBOARD;
    }

    return <Navigate to={dashboardRoute} replace />;
  }

  return children;
};

export default ProtectedRoute;
