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
 * BACKEND INTEGRATION NOTES:
 * ⚠️ Backend is NOT implemented yet
 * ⚠️ BASE_URL is a placeholder
 * ⚠️ All service calls currently return mocked data
 * 
 * When backend is ready:
 * 1. Update BASE_URL to real backend URL
 * 2. Replace mock implementations in service files
 * 3. Handle real JWT tokens
 * 4. Implement refresh token logic in response interceptor
 */

import axios from 'axios';

// ========================================
// BASE URL CONFIGURATION
// ========================================
const BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========================================
// REQUEST INTERCEPTOR
// ========================================
// Automatically adds JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
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
    // TODO: Handle common errors
    // 401 Unauthorized: Token expired, redirect to login
    // 403 Forbidden: Insufficient permissions
    // 500 Server Error: Show error message
    
    // TODO: Implement refresh token logic
    // if (error.response?.status === 401) {
    //   // Try to refresh token
    //   // If refresh fails, logout user
    // }
    
    return Promise.reject(error);
  }
);

export default apiClient;
