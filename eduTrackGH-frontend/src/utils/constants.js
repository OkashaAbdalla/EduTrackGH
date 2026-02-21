/**
 * Application Constants
 * Purpose: Centralized constants for the application
 * 
 * IMPORTANT NOTES:
 * - Roles are NEVER selected by users on frontend
 * - Roles are assigned by backend and come from JWT token claims
 * - Frontend role checks are UI-only; backend enforces real security
 */

// ========================================
// USER ROLES
// ========================================
export const ROLES = {
  // School-level roles for EduTrack GH
  TEACHER: 'teacher',           // Class teacher subject teacher
  HEADTEACHER: 'headteacher',   // School-level admin (one school)
  PARENT: 'parent',             // Linked primarily by phone number
  ADMIN: 'admin',               // System-level super admin (all schools)
};

// ========================================
// ROUTE PATHS
// ========================================
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  
  // Teacher routes
  TEACHER_DASHBOARD: '/teacher/dashboard',
  MARK_ATTENDANCE: '/teacher/mark-attendance',
  ATTENDANCE_HISTORY: '/teacher/history',
  FLAGGED_STUDENTS: '/teacher/flagged',

  // Headteacher (school admin) routes
  HEADTEACHER_DASHBOARD: '/headteacher/dashboard',
  SCHOOL_REPORTS: '/headteacher/reports',
  TEACHER_COMPLIANCE: '/headteacher/compliance',
  MANAGE_CLASSES: '/headteacher/classes',

  // Parent routes
  PARENT_DASHBOARD: '/parent/dashboard',
  CHILDREN_ATTENDANCE: '/parent/children',
  PARENT_NOTIFICATIONS: '/parent/notifications',

  // System admin routes (super admin)
  ADMIN_DASHBOARD: '/admin/dashboard',
  MANAGE_SCHOOLS: '/admin/schools',
  CREATE_HEADTEACHER: '/admin/create-headteacher',
  MANAGE_TEACHERS: '/admin/teachers',
  SYSTEM_SETTINGS: '/admin/settings',
};

// ========================================
// API ENDPOINTS
// ========================================
// Backend API endpoint structure (for reference)
// Used in service layer for API calls
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    VERIFY_EMAIL: '/auth/verify-email',
    GOOGLE_AUTH: '/auth/google',
    LOGOUT: '/auth/logout',
  },
  ATTENDANCE: {
    MARK: '/attendance/mark',
    HISTORY: '/attendance/history',
    SESSIONS: '/attendance/sessions',
  },
  SESSIONS: {
    CREATE: '/sessions/create',
    ACTIVATE: '/sessions/:id/activate',
    DEACTIVATE: '/sessions/:id/deactivate',
    LIST: '/sessions',
    ATTENDEES: '/sessions/:id/attendees',
  },
};

// ========================================
// EDUTRACK GH DESIGN SYSTEM
// ========================================
// EduTrack GH Branding
// Basic School Absenteeism Tracker

// Color Palette
export const COLORS = {
  // Primary: EduTrack GH Green
  PRIMARY: '#006838',           // EduTrack GH Green - main brand color
  PRIMARY_LIGHT: '#4CAF50',     // Light green for hover states
  PRIMARY_DARK: '#004d29',      // Dark green for active states
  
  // Accent: Blue
  ACCENT: '#1E40AF',            // Accent blue
  ACCENT_LIGHT: '#3B82F6',      // Light blue for highlights
  
  // Neutrals
  WHITE: '#FFFFFF',             // Background, cards
  GRAY_LIGHT: '#F5F5F5',        // Subtle backgrounds
  GRAY: '#9CA3AF',              // Borders, disabled states
  GRAY_DARK: '#4B5563',         // Secondary text
  DARK: '#1A1A1A',              // Primary text
  
  // Semantic Colors
  SUCCESS: '#10B981',           // Success messages
  ERROR: '#EF4444',             // Error messages
  WARNING: '#F59E0B',           // Warning messages
  INFO: '#3B82F6',              // Info messages
};

// Design System Principles
export const DESIGN_SYSTEM = {
  // Typography
  FONT_FAMILY: "'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  
  // Style Goals
  STYLE: {
    CLEAN: 'Minimal clutter, clear hierarchy',
    MODERN: 'Contemporary UI patterns',
    ACCESSIBLE: 'WCAG 2.1 AA compliant',
    PROFESSIONAL: 'Academic system credibility',
    MOBILE_FIRST: 'Optimized for mobile devices',
  },
  
  // Spacing Scale (Tailwind-compatible)
  SPACING: {
    XS: '0.25rem',   // 4px
    SM: '0.5rem',    // 8px
    MD: '1rem',      // 16px
    LG: '1.5rem',    // 24px
    XL: '2rem',      // 32px
    '2XL': '3rem',   // 48px
  },
  
  // Border Radius
  RADIUS: {
    SM: '0.25rem',   // 4px - buttons, inputs
    MD: '0.5rem',    // 8px - cards
    LG: '0.75rem',   // 12px - modals
    FULL: '9999px',  // Circular
  },
};

// ========================================
// ATTENDANCE CONFIGURATION
// ========================================
// Configuration for daily attendance marking
export const ATTENDANCE_CONFIG = {
  MARKING_DEADLINE_HOUR: 9,          // Teachers must mark by 9 AM
  CHRONIC_ABSENTEEISM_THRESHOLD: 3, // Flag after 3 consecutive absences
  ABSENTEEISM_PERCENTAGE_THRESHOLD: 10, // Flag if >10% of term days absent
  GRACE_PERIOD_HOURS: 24,            // Can mark previous day within 24 hours
};

// ========================================
// SCHOOL LEVELS
// ========================================
// Educational levels supported by EduTrack GH
export const SCHOOL_LEVELS = {
  PRIMARY: 'PRIMARY',
  JHS: 'JHS',
};

export const PRIMARY_GRADES = ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'];
export const JHS_GRADES = ['JHS 1', 'JHS 2', 'JHS 3'];

// ========================================
// LOCAL STORAGE KEYS
// ========================================
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',         // JWT access token
  REFRESH_TOKEN: 'refresh_token',   // JWT refresh token (future)
  USER_DATA: 'user_data',           // User profile data
};

// ========================================
// GOOGLE AUTHENTICATION
// ========================================
// Google Sign-In is for SIGN IN only, NOT sign up
// Flow:
// 1. User clicks "Sign in with Google"
// 2. Google OAuth popup
// 3. Backend receives Google token
// 4. Backend checks if user exists:
//    - If exists: Return JWT token
//    - If new: Create account, assign role, return JWT
// 5. Frontend only consumes the JWT token
export const GOOGLE_AUTH = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
  SCOPES: 'profile email',
};
