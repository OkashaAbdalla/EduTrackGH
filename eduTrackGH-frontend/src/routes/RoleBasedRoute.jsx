/**
 * Role-Based Route Component
 * Purpose: Route guard based on user role (student/lecturer)
 * 
 * SECURITY NOTES:
 * ❌ Frontend role checks are UI-only
 * ✅ Backend validates roles on EVERY API call
 * ✅ This component prevents manual URL access by unauthorized roles
 * 
 * Behavior:
 * - Checks user role from AuthContext
 * - Compares against allowed roles for the route
 * - Redirects to appropriate dashboard if role mismatch
 * - Blocks students from accessing lecturer routes and vice versa
 * 
 * Example Usage:
 * <RoleBasedRoute allowedRoles={[ROLES.STUDENT]}>
 *   <StudentDashboard />
 * </RoleBasedRoute>
 * 
 * IMPORTANT:
 * - Roles come from JWT token claims (decoded by backend)
 * - Users CANNOT select or modify their own roles
 * - This is a UX convenience, NOT a security measure
 */

const RoleBasedRoute = () => {
  // TODO: Implement role-based route protection
  // 1. Get user role from AuthContext
  // 2. Check if user role is in allowedRoles prop
  // 3. If authorized: render children
  // 4. If not authorized: redirect to appropriate dashboard
  // 5. If not authenticated: redirect to login
  return null;
};

export default RoleBasedRoute;
