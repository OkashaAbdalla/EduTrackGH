/**
 * Protected Route Component
 * Purpose: Wrapper for routes that require authentication
 * Redirects to login if user is not authenticated; to role dashboard if wrong role
 */

import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../context';
import { ROUTES, ROLES } from '../../utils/constants';
import { getRoleRedirectPath } from '../../utils/loginHelpers';

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
    return <Navigate to={requiredRole === ROLES.ADMIN ? ROUTES.ADMIN_LOGIN : ROUTES.LOGIN} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    const dashboardRoute = getRoleRedirectPath(user?.role);
    return <Navigate to={dashboardRoute} replace />;
  }

  return children;
};

export default ProtectedRoute;
