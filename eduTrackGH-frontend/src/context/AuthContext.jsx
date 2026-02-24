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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userRole = localStorage.getItem('user_role');
    const userEmail = localStorage.getItem('user_email');
    const userName = localStorage.getItem('user_name');
    const userSchoolLevel = localStorage.getItem('user_schoolLevel');

    if (token && userRole) {
      const role = String(userRole).toLowerCase().trim();
      setUser({
        email: userEmail,
        role,
        name: userName,
        schoolLevel: userSchoolLevel,
      });
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login({ email, password });
      console.log('Login response:', response);

      if (response.success) {
        const { token, user: userData } = response;
        console.log('Login successful - User data:', userData);

        if (!token || !userData) {
          console.error('Missing token or userData in response');
          return { success: false, message: 'Invalid response from server' };
        }

        const role = (userData.role && String(userData.role).toLowerCase().trim()) || 'parent';
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
        console.log('Auth state updated, isAuthenticated:', true);

        return { success: true, user: { ...userData, role } };
      }
      console.warn('Login failed:', response.message);
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
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
        if (!token || !userData || userData.role?.toLowerCase() !== 'admin') {
          return { success: false, message: 'Invalid admin credentials' };
        }
        const role = 'admin';
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_role', role);
        localStorage.setItem('user_email', userData.email || '');
        localStorage.setItem('user_name', userData.fullName || '');
        setUser({ email: userData.email, role, name: userData.fullName });
        setIsAuthenticated(true);
        return { success: true, user: { ...userData, role } };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Admin login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_schoolLevel');

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
