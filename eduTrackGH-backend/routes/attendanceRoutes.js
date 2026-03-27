/**
 * Attendance Routes
 * /api/attendance/*
 */

const express = require("express");
const router = express.Router();
const {
  markDailyAttendance,
  getLockStatus,
  getClassroomDailyHistory,
  getFlaggedStudentsForClassroom,
  uploadPhoto,
  deleteAttendanceWeek,
} = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validateDailyAttendancePayload } = require("../utils/validators");

// All routes are protected
router.use(protect);

// Teacher routes (EduTrack GH daily attendance)
router.post("/upload-photo", authorize("teacher"), uploadPhoto);
router.get("/daily/status/:classroomId/:date", authorize("teacher"), getLockStatus);
router.post("/daily", authorize("teacher"), validateDailyAttendancePayload, markDailyAttendance);
router.delete("/classroom/:classroomId/week/:weekStartDate", authorize("teacher"), deleteAttendanceWeek);
router.get(
  "/classroom/:classroomId/daily",
  authorize("teacher"),
  getClassroomDailyHistory,
);
router.get(
  "/classroom/:classroomId/flagged",
  authorize("teacher"),
  getFlaggedStudentsForClassroom,
);

module.exports = router;
