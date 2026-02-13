/**
 * Authentication Routes
 * /api/auth/*
 */

const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, getMe, logout, resendVerification } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validationRules, validate } = require('../utils/validators');

// Public routes
router.post('/register', validationRules.register, validate, register);
router.post('/login', validationRules.login, validate, login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
