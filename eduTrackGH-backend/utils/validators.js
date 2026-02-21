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

/**
 * Phase 2: Validate daily attendance payload.
 * Rules: If status === "present" → verificationType must be "photo" or "manual".
 * If "photo" → photoUrl required. If "manual" → manualReason required.
 * Absent/late: no photo or verification required.
 */
const validateDailyAttendancePayload = (req, res, next) => {
  const { classroomId, date, attendanceData } = req.body;
  if (!classroomId || !date) {
    return res.status(400).json({
      success: false,
      message: 'classroomId and date are required',
    });
  }
  if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'attendanceData must be a non-empty array',
    });
  }
  for (let i = 0; i < attendanceData.length; i++) {
    const row = attendanceData[i];
    const status = row?.status;
    if (!row?.studentId || !['present', 'late', 'absent'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `attendanceData[${i}]: valid studentId and status (present|late|absent) required`,
      });
    }
    // When status is present, enforce verification: photo (photoUrl) or manual (manualReason)
    if (status === 'present') {
      const verificationType = row.verificationType;
      // Legacy payload: no verificationType → controller will set manual + "Legacy entry"
      if (verificationType === undefined || verificationType === null) {
        continue;
      }
      if (!['photo', 'manual'].includes(verificationType)) {
        return res.status(400).json({
          success: false,
          message: `attendanceData[${i}]: when status is present, verificationType must be "photo" or "manual"`,
        });
      }
      if (verificationType === 'photo') {
        if (!row.photoUrl || typeof row.photoUrl !== 'string' || !row.photoUrl.trim()) {
          return res.status(400).json({
            success: false,
            message: `attendanceData[${i}]: photoUrl is required when verificationType is "photo"`,
          });
        }
      }
      if (verificationType === 'manual') {
        if (row.manualReason === undefined || row.manualReason === null || (typeof row.manualReason === 'string' && !row.manualReason.trim())) {
          return res.status(400).json({
            success: false,
            message: `attendanceData[${i}]: manualReason is required when verificationType is "manual"`,
          });
        }
      }
    }
  }
  next();
};

module.exports = { validationRules, validate, validateDailyAttendancePayload };
