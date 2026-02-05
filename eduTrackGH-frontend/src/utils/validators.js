/**
 * Form Validation Utilities
 * Purpose: Reusable validation functions for forms
 */

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
export const validatePassword = (password) => {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return {
    isValid: minLength && hasUpperCase && hasLowerCase && hasNumber,
    errors: {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
    },
  };
};

// Basic phone number validation (Ghana-style, e.g. 024xxxxxxx or +23324xxxxxxx)
export const validatePhone = (phone) => {
  if (!phone) return false;
  const normalized = phone.trim();
  // Local format: 0 followed by 9 digits (e.g., 0241234567, 0551242393)
  const localPattern = /^0\d{9}$/;
  // International format: +233 followed by 9 digits (e.g., +233241234567)
  const intlPattern = /^\+233\d{9}$/;
  return localPattern.test(normalized) || intlPattern.test(normalized);
};

// Required field validation
export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

// Time validation (end time must be after start time)
export const validateTimeRange = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return end > start;
};
