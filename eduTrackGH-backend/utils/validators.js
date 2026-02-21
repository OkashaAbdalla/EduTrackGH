/**
 * Input Validation Utilities
 */

const { body, validationResult } = require('express-validator');

// Validation rules
const validationRules = {
  register: [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').matches(/^(0\d{9}|\+233\d{9})$/).withMessage('Invalid phone number format (e.g., 0241234567 or +233241234567)'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],

  login: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],

  createSession: [
    body('courseName').trim().notEmpty().withMessage('Course name is required'),
    body('courseCode').trim().notEmpty().withMessage('Course code is required'),
    body('duration').isInt({ min: 15, max: 240 }).withMessage('Duration must be between 15 and 240 minutes'),
    body('location').trim().notEmpty().withMessage('Location is required'),
  ],

  createLecturer: [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('staffId').trim().notEmpty().withMessage('Staff ID is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('tempPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
};

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

module.exports = { validationRules, validate };
