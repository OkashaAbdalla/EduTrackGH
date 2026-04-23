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
  updateTeacher,
  toggleTeacherStatus,
  getStats,
  getSchools,
  createSchool,
  updateSchool,
  toggleSchoolStatus,
  getSystemSettings,
  updateSystemSettings,
  getSchoolClassrooms,
  getAttendanceAudit,
  getAttendanceFlags,
  unlockAttendance,
  getGpsSettings,
  updateGpsSettings,
  getGpsLogs,
  getAdminAlerts,
  getAdminUsers,
  updateAdminUserStatus,
  getAdminStudents,
  getAdminStudentById,
  getAdminClassrooms,
  getAdminClassroomById,
  getSystemOverview,
  getAuditLogs,
  getAnalytics,
  getNotificationSettings,
  updateNotificationSettings,
  getAdminExport,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validationRules, validate } = require('../utils/validators');

// All routes are protected and admin-only
router.use(protect);
router.use(authorize('admin', 'super_admin'));

// Headteacher management
router.post('/headteachers', createHeadteacher);
router.get('/headteachers', getHeadteachers);
router.patch('/headteachers/:id/assign-school', require('../controllers/admin.users.controller').assignHeadteacherToSchool);
router.delete('/headteachers/:id', require('../controllers/admin.users.controller').deleteHeadteacher);

// Teacher management
router.post('/teachers', createTeacher);
router.get('/teachers', getTeachers);
router.put('/teachers/:id', updateTeacher);
router.patch('/teachers/:id/toggle-status', toggleTeacherStatus);

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

// Phase 7: Attendance audit & flags; Phase 3: Unlock
router.get('/schools/:schoolId/classrooms', getSchoolClassrooms);
router.get('/attendance-audit', getAttendanceAudit);
router.get('/attendance-flags', getAttendanceFlags);
router.patch('/unlock-attendance/:classroomId/:date', unlockAttendance);

// Super Admin control layer
router.get('/gps-settings', getGpsSettings);
router.put('/gps-settings', updateGpsSettings);
router.get('/gps-logs', getGpsLogs);
router.get('/alerts', getAdminAlerts);
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', updateAdminUserStatus);
router.get('/students', getAdminStudents);
router.get('/students/:id', getAdminStudentById);
router.get('/classrooms', getAdminClassrooms);
router.get('/classrooms/:id', getAdminClassroomById);
router.get('/system-overview', getSystemOverview);
router.get('/audit-logs', getAuditLogs);
router.get('/analytics', getAnalytics);
router.get('/notification-settings', getNotificationSettings);
router.put('/notification-settings', updateNotificationSettings);
router.get('/export', getAdminExport);

module.exports = router;
