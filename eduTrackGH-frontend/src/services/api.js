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
      // Token expired - could implement refresh logic here
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
