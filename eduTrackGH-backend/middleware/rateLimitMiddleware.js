/**
 * Rate Limiting Middleware
 * Different limits for public login vs admin login
 */

const rateLimit = require('express-rate-limit');

// Standard login: 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX, 10) || 5,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin login: 3 attempts per 15 minutes per IP (stricter)
const adminLoginLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_ADMIN_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_ADMIN_MAX, 10) || 3,
  message: {
    success: false,
    message: 'Too many attempts. Access temporarily blocked.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, adminLoginLimiter };
