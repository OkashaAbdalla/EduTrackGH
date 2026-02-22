/**
 * Authentication Routes
 * /api/auth/*
 */

const express = require('express');
const router = express.Router();
const { register, login, adminLogin, verifyEmail, getMe, logout, resendVerification } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validationRules, validate } = require('../utils/validators');
const { loginLimiter, adminLoginLimiter } = require('../middleware/rateLimitMiddleware');

// Admin login - isolated path from ADMIN_LOGIN_PATH env (must match frontend VITE_ADMIN_LOGIN_PATH)
const adminPath = process.env.ADMIN_LOGIN_PATH || 'secure-admin-default';
router.post(`/${adminPath}`, adminLoginLimiter, validationRules.login, validate, adminLogin);

// Public routes - login has rate limiting
router.post('/register', validationRules.register, validate, register);
router.post('/login', loginLimiter, validationRules.login, validate, login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
