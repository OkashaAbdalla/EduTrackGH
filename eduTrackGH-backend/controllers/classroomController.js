/**
 * Classroom Controller
 * Purpose: Handle classroom-related operations
 */

const Classroom = require("../models/Classroom");
const User = require("../models/User");

// Get classrooms assigned to current teacher
const getTeacherClassrooms = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Find all classrooms where this teacher is assigned
    const classrooms = await Classroom.find({ teacherId })
      .populate("schoolId", "name")
      .select("_id name grade schoolId studentCount");

    res.json({
      success: true,
      classrooms,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch classrooms" });
  }
};

// Get classroom details with students
const getClassroomDetails = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const teacherId = req.user._id;

    const classroom = await Classroom.findById(classroomId)
      .populate("schoolId", "name")
      .populate("studentIds", "fullName studentIdNumber gender");

    if (!classroom) {
      return res
        .status(404)
        .json({ success: false, message: "Classroom not found" });
    }

    // Verify teacher owns this classroom
    if (classroom.teacherId.toString() !== teacherId.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Unauthorized access to this classroom",
        });
    }

    res.json({
      success: true,
      classroom,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch classroom details" });
  }
};

// Get students in classroom
const getClassroomStudents = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const teacherId = req.user._id;

    const classroom = await Classroom.findById(classroomId);

    if (!classroom) {
      return res
        .status(404)
        .json({ success: false, message: "Classroom not found" });
    }

    // Verify teacher owns this classroom
    if (classroom.teacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Get students linked to this classroom
    const students = await require("../models/Student")
      .find({ classroomId })
      .select("_id fullName studentIdNumber studentId gender isFlagged");

    res.json({
      success: true,
      students,
      totalCount: students.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch students" });
  }
};

module.exports = {
  getTeacherClassrooms,
  getClassroomDetails,
  getClassroomStudents,
};
