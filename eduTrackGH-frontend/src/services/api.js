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
import { assertProductionApiConfigured, getApiBaseUrl } from '../utils/envApi';

assertProductionApiConfigured();

const BASE_URL = getApiBaseUrl();
if (!BASE_URL) {
  throw new Error('VITE_API_URL must be configured for production builds.');
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 seconds - allows reports/aggregations and Cloudinary uploads
  headers: {
    'Content-Type': 'application/json',
  },
  // JWT is sent via Authorization header; keep false unless backend sets cookies.
  withCredentials: false,
});

/** True when this request must not send JWT (public auth + password recovery). */
function isPublicAuthRequest(config) {
  const adminLoginSegment = import.meta.env.VITE_ADMIN_LOGIN_PATH || 'secure-admin';
  const blob = [config.baseURL, config.url].filter(Boolean).join('').toLowerCase();
  const markers = [
    'forgot-password',
    'reset-password',
    '/auth/register',
    '/auth/login',
    'verify-email',
    'resend-verification',
    'verification-status',
    `/auth/${adminLoginSegment.toLowerCase()}`,
  ];
  return markers.some((m) => blob.includes(m));
}

/** Routes where a 401 from session refresh must not force navigation (user may be resetting password, etc.). */
function isPublicAuthRecoveryPath(pathname) {
  const p = pathname || '';
  return (
    p === ROUTES.LOGIN ||
    p === ROUTES.REGISTER ||
    p === ROUTES.FORGOT_PASSWORD ||
    p === ROUTES.VERIFY_EMAIL ||
    p === ROUTES.RESET_PASSWORD ||
    p.startsWith(`${ROUTES.RESET_PASSWORD}/`) ||
    p === ROUTES.ADMIN_LOGIN
  );
}

// ========================================
// REQUEST INTERCEPTOR
// ========================================
// Automatically adds JWT token to all requests
// Implements request deduplication for GET requests
apiClient.interceptors.request.use(
  (config) => {
    const skipAuth = isPublicAuthRequest(config);

    const sessionToken = sessionStorage.getItem('auth_token');
    let token = sessionToken;
    if (!token) {
      const localRole = localStorage.getItem('user_role');
      if (localRole === 'admin' || localRole === 'super_admin') {
        ['auth_token', 'user_role', 'user_email', 'user_name', 'user_schoolLevel'].forEach((k) =>
          localStorage.removeItem(k)
        );
        token = null;
      } else {
        token = localStorage.getItem('auth_token');
      }
    }
    if (skipAuth) {
      delete config.headers.Authorization;
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

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
      const role = sessionStorage.getItem('user_role') || localStorage.getItem('user_role');
      const wasAdmin = role === 'admin' || role === 'super_admin';
      const adminLoginPath = import.meta.env.VITE_ADMIN_LOGIN_PATH || 'secure-admin';
      const wasAdminRequest = error.config?.url?.includes(adminLoginPath);
      const isAuthLoginRequest =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes(`/auth/${adminLoginPath}`);
      const isProfilePhotoRequest = error.config?.url?.includes('/auth/profile-photo');

      if (isAuthLoginRequest || isProfilePhotoRequest) {
        return Promise.reject(error);
      }

      const path =
        typeof window !== 'undefined' && window.location && window.location.pathname
          ? window.location.pathname
          : '';
      if (isPublicAuthRecoveryPath(path)) {
        ['auth_token', 'user_role', 'user_email', 'user_name', 'user_schoolLevel'].forEach((k) => {
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        });
        return Promise.reject(error);
      }
      ['auth_token', 'user_role', 'user_email', 'user_name', 'user_schoolLevel'].forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
      window.location.href = wasAdmin || wasAdminRequest ? ROUTES.ADMIN_LOGIN : ROUTES.LOGIN;
    }

    if (error.response?.status === 403 && error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
      const adminLoginPath = import.meta.env.VITE_ADMIN_LOGIN_PATH || 'secure-admin';
      const isAdminLoginRequest = error.config?.url?.includes(`/auth/${adminLoginPath}`);
      if (isAdminLoginRequest) {
        return Promise.reject(error);
      }

      const path =
        typeof window !== 'undefined' && window.location && window.location.pathname
          ? window.location.pathname
          : '';
      if (isPublicAuthRecoveryPath(path)) {
        ['auth_token', 'user_role', 'user_email', 'user_name', 'user_schoolLevel'].forEach((k) => {
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        });
        return Promise.reject(error);
      }

      const email =
        error.response?.data?.email ||
        localStorage.getItem('user_email') ||
        sessionStorage.getItem('user_email');
      if (email) {
        try {
          localStorage.setItem('pendingVerificationEmail', String(email).trim());
        } catch (_) {
          // ignore
        }
      }
      ['auth_token', 'user_role', 'user_email', 'user_name', 'user_schoolLevel'].forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
      window.location.href = ROUTES.VERIFY_EMAIL;
      return Promise.reject(error);
    }

    // Surface network / CORS failures (Brave shields, offline) instead of silent hangs
    if (!error.response && error.request && import.meta.env.DEV) {
      console.warn('[api]', error.message || 'Network error', error.config?.baseURL, error.config?.url);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
