/**
 * Admin Authentication Routes
 * Isolated endpoint - path is configured via ADMIN_LOGIN_PATH env var.
 * Never expose this path in public documentation or UI.
 */

const express = require('express');
const router = express.Router();
const { adminLogin } = require('../controllers/authController');
const { adminLoginLimiter } = require('../middleware/rateLimitMiddleware');
const { validationRules, validate } = require('../utils/validators');

router.post('/', adminLoginLimiter, validationRules.login, validate, adminLogin);

module.exports = router;
