/**
 * Student Routes
 * /api/students/*
 * Teacher: propose students
 * Headteacher: review & approve/reject students in their school
 */

const express = require('express');
const router = express.Router();

const {
  proposeStudent,
  getPendingStudentsForHeadteacher,
  approveStudent,
  rejectStudent,
} = require('../controllers/studentController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Teacher proposes a new student for their classroom
router.post('/propose', protect, authorize('teacher'), proposeStudent);

// Headteacher views all pending students for their school
router.get('/pending', protect, authorize('headteacher'), getPendingStudentsForHeadteacher);

// Headteacher approves or rejects a pending student
router.post('/pending/:id/approve', protect, authorize('headteacher'), approveStudent);
router.post('/pending/:id/reject', protect, authorize('headteacher'), rejectStudent);

module.exports = router;

