/**
 * TeacherMessage Routes
 * /api/messages/*
 */

const express = require('express');
const router = express.Router();
const {
  createAttendanceUnlockRequest,
  getAttendanceUnlockRequestsForHeadteacher,
} = require('../controllers/teacherMessageController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

// Teacher: create unlock/correction request
router.post('/attendance-unlock', authorize('teacher'), createAttendanceUnlockRequest);

// Headteacher: list unlock requests
router.get('/attendance-unlock', authorize('headteacher'), getAttendanceUnlockRequestsForHeadteacher);

module.exports = router;

