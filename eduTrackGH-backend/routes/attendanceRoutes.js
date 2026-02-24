/**
 * Attendance Routes
 * /api/attendance/*
 */

const express = require("express");
const router = express.Router();
const {
  markDailyAttendance,
  getClassroomDailyHistory,
  uploadPhoto,
} = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validateDailyAttendancePayload } = require("../utils/validators");

// All routes are protected
router.use(protect);

// Teacher routes (EduTrack GH daily attendance)
router.post("/upload-photo", authorize("teacher"), uploadPhoto);
router.post("/daily", authorize("teacher"), validateDailyAttendancePayload, markDailyAttendance);
router.get(
  "/classroom/:classroomId/daily",
  authorize("teacher"),
  getClassroomDailyHistory,
);

module.exports = router;
