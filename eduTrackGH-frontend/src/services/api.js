/**
 * API Client Configuration
 * Purpose: Axios instance with base configuration
 * 
 * Features:
 *   - Base URL configuration (placeholder for now)
 *   - Request interceptor (adds JWT token to headers)
 *   - Response interceptor (handles errors globally)
 *   - Timeout configuration
 * 
 * BACKEND: EduTrack GH API at BASE_URL. JWT in Authorization header.
 * Update BASE_URL for production. Refresh token logic can be added in response interceptor.
 */

import axios from 'axios';
import { ROUTES } from '../utils/constants';

// ========================================
// BASE URL CONFIGURATION
// ========================================
const BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5000, // 5 seconds - faster timeout
  headers: {
    'Content-Type': 'application/json',
  },
});


// ========================================
// REQUEST INTERCEPTOR
// ========================================
// Automatically adds JWT token to all requests
// Implements request deduplication for GET requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Request deduplication for GET requests - handled in service layer
    // This interceptor just adds auth token

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ========================================
// RESPONSE INTERCEPTOR
// ========================================
// Handles errors globally (401, 403, 500, etc.)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      const wasAdmin = localStorage.getItem('user_role') === 'admin';
      const adminLoginPath = import.meta.env.VITE_ADMIN_LOGIN_PATH || 'secure-admin';
      const wasAdminRequest = error.config?.url?.includes(adminLoginPath);
      const isAuthLoginRequest =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes(`/auth/${adminLoginPath}`);
      const isProfilePhotoRequest = error.config?.url?.includes('/auth/profile-photo');

      if (isAuthLoginRequest || isProfilePhotoRequest) {
        return Promise.reject(error);
      }
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_schoolLevel');
      window.location.href = wasAdmin || wasAdminRequest ? ROUTES.ADMIN_LOGIN : ROUTES.LOGIN;
    }

    return Promise.reject(error);
  }
);

export default apiClient;
