/**
 * Headteacher Routes
 * /api/headteacher/*
 * All routes require headteacher role; scope is headteacher's school
 */

const express = require('express');
const router = express.Router();
const {
  getTeachersForSchool,
  createTeacherForSchool,
  getClassroomsForSchool,
  assignClassTeacher,
  toggleTeacherStatusForSchool,
  deleteTeacherForSchool,
  seedDefaultClassroomsForSchool,
  getTeachersCompliance,
} = require('../controllers/headteacherController');
const { unlockAttendanceForHeadteacher } = require('../controllers/headteacher.classrooms.controller');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('headteacher'));

// Teachers in headteacher's school
router.get('/teachers', getTeachersForSchool);
router.post('/teachers', createTeacherForSchool);
router.patch('/teachers/:id/toggle-status', toggleTeacherStatusForSchool);
router.delete('/teachers/:id', deleteTeacherForSchool);

// Classrooms in headteacher's school
router.get('/classrooms', getClassroomsForSchool);
router.patch('/classrooms/:id/assign-teacher', assignClassTeacher);
router.post('/classrooms/seed-default', seedDefaultClassroomsForSchool);

// Attendance unlocking (headteacher scope)
router.patch('/attendance/unlock/:classroomId/:date', unlockAttendanceForHeadteacher);

// Teacher compliance (marked attendance for date)
router.get('/compliance', getTeachersCompliance);

module.exports = router;
