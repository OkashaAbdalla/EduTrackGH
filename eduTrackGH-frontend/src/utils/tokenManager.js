/**
 * JWT Token Management Utilities
 * Purpose: Handle JWT token storage, retrieval, and validation
 * Note: Frontend token handling only - backend validates tokens
 */

import { STORAGE_KEYS } from './constants';

// Store JWT token in localStorage
export const setToken = (token) => {
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

// Retrieve JWT token from localStorage
export const getToken = () => {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

// Remove JWT token from localStorage
export const removeToken = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
};

// Check if token exists (basic check, backend validates)
export const hasToken = () => {
  return !!getToken();
};

// Store user data in localStorage
export const setUserData = (userData) => {
  localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
};

// Retrieve user data from localStorage
export const getUserData = () => {
  const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  return data ? JSON.parse(data) : null;
};

// Remove user data from localStorage
export const removeUserData = () => {
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
};

// Clear all auth data
export const clearAuthData = () => {
  removeToken();
  removeUserData();
};
