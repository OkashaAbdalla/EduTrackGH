/**
 * Student Routes
 * /api/students/*
 * Thin: route definitions + middleware only.
 */

const express = require('express');
const router = express.Router();

const { registerStudentByHeadteacher, getStudentsForHeadteacher } = require('../controllers/student.controller');
const { proposeStudent } = require('../controllers/student.proposal.controller');
const { updateStudent } = require('../controllers/student.update.controller');
const {
  getPendingStudentsForHeadteacher,
  approveStudent,
  rejectStudent,
} = require('../controllers/student.approval.controller');
const {
  getPendingStudentEdits,
  approvePendingStudentEdit,
  rejectPendingStudentEdit,
} = require('../controllers/student.pendingEdit.controller');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateRegisterBody, validateProposalBody } = require('../middleware/studentValidation');

// Teacher proposes a new student
router.post('/propose', protect, authorize('teacher'), validateProposalBody, proposeStudent);

// Headteacher: teacher-proposed edits to existing students
router.get('/pending-edits', protect, authorize('headteacher'), getPendingStudentEdits);
router.patch('/:id/pending-edit/approve', protect, authorize('headteacher'), approvePendingStudentEdit);
router.patch('/:id/pending-edit/reject', protect, authorize('headteacher'), rejectPendingStudentEdit);

// Teacher/Headteacher: update student
router.patch('/:id', protect, authorize('teacher', 'headteacher'), updateStudent);

// Headteacher: register student
router.post('/', protect, authorize('headteacher'), validateRegisterBody, registerStudentByHeadteacher);
router.post('/register', protect, authorize('headteacher'), validateRegisterBody, registerStudentByHeadteacher);

// Headteacher: list approved students (optional ?classroom=id)
router.get('/', protect, authorize('headteacher'), getStudentsForHeadteacher);

// Headteacher: list pending proposals
router.get('/pending', protect, authorize('headteacher'), getPendingStudentsForHeadteacher);

// Headteacher: approve / reject
router.patch('/:id/approve', protect, authorize('headteacher'), approveStudent);
router.patch('/:id/reject', protect, authorize('headteacher'), rejectStudent);
router.post('/pending/:id/approve', protect, authorize('headteacher'), approveStudent);
router.post('/pending/:id/reject', protect, authorize('headteacher'), rejectStudent);

module.exports = router;
