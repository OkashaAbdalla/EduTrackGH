/**
 * Login Helper Functions
 * Purpose: Extract validation and role detection logic
 */

import { validateEmail } from './validators';
import { ROUTES, ROLES } from './constants';

export const validateLoginForm = (formData) => {
  const errors = {};
  
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  return errors;
};

export const getRoleRedirectPath = (role) => {
  if (role === ROLES.ADMIN) return ROUTES.ADMIN_DASHBOARD;
  if (role === ROLES.HEADTEACHER) return ROUTES.HEADTEACHER_DASHBOARD;
  if (role === ROLES.TEACHER) return ROUTES.TEACHER_DASHBOARD;
  if (role === ROLES.PARENT) return ROUTES.PARENT_DASHBOARD;
  // Fallback: send unknown roles to login
  return ROUTES.LOGIN;
};
