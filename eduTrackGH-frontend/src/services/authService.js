/**
 * Authentication Service
 * Purpose: API calls for authentication operations
 * Endpoints (mocked for now):
 *   - register(userData): POST /auth/register
 *   - login(credentials): POST /auth/login
 *   - verifyEmail(token): POST /auth/verify-email
 *   - googleAuth(token): POST /auth/google
 *   - logout(): POST /auth/logout
 * Returns: Mock responses matching expected backend structure
 */

import apiClient from './api';

const authService = {
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response.data;
  },

  resendVerification: async (email) => {
    const response = await apiClient.post('/auth/resend-verification', { email });
    return response.data;
  },

  googleAuth: async (googleToken) => {
    const response = await apiClient.post('/auth/google', { token: googleToken });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  adminLogin: async (credentials) => {
    const path = import.meta.env.VITE_ADMIN_LOGIN_PATH || 'secure-admin';
    const response = await apiClient.post(`/auth/${path}`, credentials);
    return response.data;
  },

  uploadProfilePhoto: async (base64Image) => {
    try {
      const response = await apiClient.post('/auth/profile-photo', { image: base64Image });
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  deleteProfilePhoto: async () => {
    try {
      const response = await apiClient.delete('/auth/profile-photo');
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },
};

export default authService;
