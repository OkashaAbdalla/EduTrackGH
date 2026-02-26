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
} = require('../controllers/headteacherController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('headteacher'));

// Teachers in headteacher's school
router.get('/teachers', getTeachersForSchool);
router.post('/teachers', createTeacherForSchool);

// Classrooms in headteacher's school
router.get('/classrooms', getClassroomsForSchool);
router.patch('/classrooms/:id/assign-teacher', assignClassTeacher);

module.exports = router;
