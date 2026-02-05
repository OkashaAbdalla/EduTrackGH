/**
 * Register Helper Functions
 * Purpose: Extract validation logic for registration
 */

import { validateEmail, validatePassword, validatePhone } from './validators';

export const validateRegisterForm = (formData) => {
  const errors = {};
  
  if (!formData.fullName || formData.fullName.trim().length < 3) {
    errors.fullName = 'Full name must be at least 3 characters';
  }

  if (!formData.phone) {
    errors.phone = 'Phone number is required';
  } else if (!validatePhone(formData.phone)) {
    errors.phone = 'Enter a valid Ghana phone number (e.g. 024xxxxxxx or +23324xxxxxxx)';
  }
  
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!formData.password) {
    errors.password = 'Password is required';
  } else {
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = 'Password must be 8+ chars with uppercase, lowercase, and number';
    }
  }
  
  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return errors;
};
