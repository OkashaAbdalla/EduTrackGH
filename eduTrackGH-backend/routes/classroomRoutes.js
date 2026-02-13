/**
 * Classroom Routes
 * Purpose: API endpoints for classroom management
 * Authentication: All routes require auth token
 * Authorization: Teachers can only access their own classrooms
 */

const express = require("express");
const {
  getTeacherClassrooms,
  getClassroomDetails,
  getClassroomStudents,
} = require("../controllers/classroomController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * GET /api/classrooms
 * Get all classrooms assigned to the current teacher
 * Required: Auth token
 * Accessible by: Teachers only
 */
router.get("/", protect, getTeacherClassrooms);

/**
 * GET /api/classrooms/:classroomId
 * Get specific classroom details
 * Required: Auth token, valid classroomId
 * Accessible by: Only the assigned teacher
 */
router.get("/:classroomId", protect, getClassroomDetails);

/**
 * GET /api/classrooms/:classroomId/students
 * Get all students in a classroom
 * Required: Auth token, valid classroomId
 * Accessible by: Only the assigned teacher
 */
router.get("/:classroomId/students", protect, getClassroomStudents);

module.exports = router;
