/**
 * useAuth Hook
 * Purpose: Custom hook for authentication operations
 * Wraps AuthContext for cleaner component usage
 * Returns: { user, isAuthenticated, login, logout, register }
 */

import { useAuthContext } from '../context/AuthContext';

const useAuth = () => {
  // TODO: Return auth context methods
  return useAuthContext();
};

export default useAuth;
