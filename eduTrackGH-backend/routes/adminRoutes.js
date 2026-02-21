/**
 * Admin Routes
 * /api/admin/*
 */

const express = require('express');
const router = express.Router();
const {
  createHeadteacher,
  createTeacher,
  getHeadteachers,
  getTeachers,
  getStats,
  getSchools,
  createSchool,
  updateSchool,
  toggleSchoolStatus,
  getSystemSettings,
  updateSystemSettings,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validationRules, validate } = require('../utils/validators');

// All routes are protected and admin-only
router.use(protect);
router.use(authorize('admin'));

// Headteacher management
router.post('/headteachers', createHeadteacher);
router.get('/headteachers', getHeadteachers);

// Teacher management
router.post('/teachers', createTeacher);
router.get('/teachers', getTeachers);

// System statistics
router.get('/stats', getStats);

// School management
router.get('/schools', getSchools);
router.post('/schools', createSchool);
router.put('/schools/:id', updateSchool);
router.patch('/schools/:id/toggle-status', toggleSchoolStatus);

// System settings
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

module.exports = router;
