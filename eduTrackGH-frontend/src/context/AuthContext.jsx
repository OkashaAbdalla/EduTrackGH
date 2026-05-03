/**
 * Authentication Context
 * Purpose: Global state management for authentication
 * Provides:
 *   - user: Current user object (id, email, role, name)
 *   - isAuthenticated: Boolean authentication status
 *   - login: Function to handle login
 *   - logout: Function to handle logout
 *   - register: Function to handle registration
 * Storage: JWT token in localStorage
 */

import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);
const AUTH_KEYS = ['auth_token', 'user_role', 'user_email', 'user_name', 'user_schoolLevel'];

const getStoredAuth = () => {
  const sessionToken = sessionStorage.getItem('auth_token');
  const sessionRole = sessionStorage.getItem('user_role');
  if (sessionToken && sessionRole) {
    return {
      token: sessionToken,
      userRole: sessionRole,
      userEmail: sessionStorage.getItem('user_email'),
      userName: sessionStorage.getItem('user_name'),
      userSchoolLevel: sessionStorage.getItem('user_schoolLevel'),
    };
  }

  const localRole = localStorage.getItem('user_role');
  // Security hardening: admin/super_admin must never restore from localStorage.
  if (localRole === 'admin' || localRole === 'super_admin') {
    AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
    return { token: null, userRole: null, userEmail: null, userName: null, userSchoolLevel: null };
  }

  return {
    token: localStorage.getItem('auth_token'),
    userRole: localRole,
    userEmail: localStorage.getItem('user_email'),
    userName: localStorage.getItem('user_name'),
    userSchoolLevel: localStorage.getItem('user_schoolLevel'),
  };
};

const clearAuthStorage = () => {
  AUTH_KEYS.forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount; fetch full profile (avatarUrl, schoolName) when token exists
  useEffect(() => {
    const { token, userRole, userEmail, userName, userSchoolLevel } = getStoredAuth();

    if (token && userRole) {
      const role = String(userRole).toLowerCase().trim();
      setUser({
        email: userEmail,
        role,
        name: userName,
        schoolLevel: userSchoolLevel,
      });
      setIsAuthenticated(true);

      authService
        .getMe()
        .then((res) => {
          if (res.success && res.user) {
            setUser((prev) => ({
              ...prev,
              avatarUrl: res.user.avatarUrl || prev?.avatarUrl,
              schoolName: res.user.schoolName || prev?.schoolName,
            }));
          }
        })
        .catch(() => {
          // If token is expired/invalid, clear it to prevent repeated calls + server log spam.
          clearAuthStorage();
          setUser(null);
          setIsAuthenticated(false);
        });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login({ email, password });

      if (response.success) {
        const { token, user: userData } = response;

        if (!token || !userData) {
          return { success: false, message: 'Invalid response from server' };
        }

        const role = (userData.role && String(userData.role).toLowerCase().trim()) || 'parent';
        clearAuthStorage();
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_role', role);
        localStorage.setItem('user_email', userData.email || '');
        localStorage.setItem('user_name', userData.fullName || '');
        if (userData.schoolLevel) {
          localStorage.setItem('user_schoolLevel', userData.schoolLevel);
        }
        setUser({
          email: userData.email,
          role,
          name: userData.fullName,
          schoolLevel: userData.schoolLevel,
        });
        setIsAuthenticated(true);

        return { success: true, user: { ...userData, role } };
      }
      return {
        success: false,
        message: response.message,
        code: response.code,
      };
    } catch (error) {
      const data = error.response?.data;
      return {
        success: false,
        message: data?.message || 'Login failed',
        code: data?.code,
        email: data?.email,
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      return { success: response.success, user: response.user, message: response.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  };

  const adminLogin = async (email, password) => {
    try {
      const response = await authService.adminLogin({ email, password });
      if (response.success) {
        const { token, user: userData } = response;
        const nextRole = userData?.role ? String(userData.role).toLowerCase().trim() : '';
        if (!token || !userData || !['admin', 'super_admin'].includes(nextRole)) {
          return { success: false, message: 'Invalid admin credentials' };
        }
        const role = nextRole;
        // Admin/super-admin sessions are browser-session only for stronger security.
        clearAuthStorage();
        sessionStorage.setItem('auth_token', token);
        sessionStorage.setItem('user_role', role);
        sessionStorage.setItem('user_email', userData.email || '');
        sessionStorage.setItem('user_name', userData.fullName || '');
        setUser({ email: userData.email, role, name: userData.fullName });
        setIsAuthenticated(true);
        return { success: true, user: { ...userData, role } };
      }
      return {
        success: false,
        message: response.message,
        code: response.code,
      };
    } catch (error) {
      const data = error.response?.data;
      return {
        success: false,
        message: data?.message || 'Admin login failed',
        code: data?.code,
      };
    }
  };

  const logout = () => {
    clearAuthStorage();

    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    adminLogin,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
