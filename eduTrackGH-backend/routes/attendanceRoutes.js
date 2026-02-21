/**
 * Attendance Routes
 * /api/attendance/*
 */

const express = require("express");
const router = express.Router();
const {
  markAttendance,
  getAttendanceHistory,
  getSessionAttendees,
  exportAttendance,
  enrollFace,
  getClassroomAttendanceHistory,
  markDailyAttendance,
  getClassroomDailyHistory,
} = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// All routes are protected
router.use(protect);

// Student routes
router.post("/mark", authorize("student"), markAttendance);
router.get("/history", authorize("student"), getAttendanceHistory);
router.post("/enroll-face", authorize("student"), enrollFace);

// Teacher routes (EduTrack GH daily attendance)
router.post("/daily", authorize("teacher"), markDailyAttendance);
router.get(
  "/classroom/:classroomId/daily",
  authorize("teacher"),
  getClassroomDailyHistory,
);
router.get(
  "/classroom/:classroomId",
  authorize("teacher"),
  getClassroomAttendanceHistory,
);

// Lecturer routes
router.get("/session/:sessionId", authorize("lecturer"), getSessionAttendees);
router.get("/export/:sessionId", authorize("lecturer"), exportAttendance);

module.exports = router;
