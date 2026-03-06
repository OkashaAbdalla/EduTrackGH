/**
 * Student controller – headteacher registration and list
 * Thin layer: auth already applied by routes.
 */

const User = require('../models/User');
const {
  registerStudentByHeadteacher: registerStudent,
  getStudentsForHeadteacher: getStudents,
} = require('../services/studentService');

const getHeadteacherContext = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.role !== 'headteacher' || !user.school) {
    return null;
  }
  return { headteacherId: user._id, schoolId: user.school };
};

const registerStudentByHeadteacher = async (req, res) => {
  try {
    const ctx = await getHeadteacherContext(req.user._id);
    if (!ctx) {
      return res.status(403).json({
        success: false,
        message: 'Headteacher with assigned school required',
      });
    }
    const student = await registerStudent({
      headteacherId: ctx.headteacherId,
      schoolId: ctx.schoolId,
      body: req.body,
    });
    return res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      student,
    });
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || 'Failed to register student';
    if (status === 500) console.error('registerStudentByHeadteacher error:', err);
    return res.status(status).json({ success: false, message });
  }
};

const getStudentsForHeadteacher = async (req, res) => {
  try {
    const ctx = await getHeadteacherContext(req.user._id);
    if (!ctx) {
      return res.status(403).json({
        success: false,
        message: 'Headteacher with assigned school required',
      });
    }
    const { classroom } = req.query || {};
    const students = await getStudents(ctx.schoolId, classroom || null);
    return res.json({ success: true, count: students.length, students });
  } catch (err) {
    console.error('getStudentsForHeadteacher error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to load students',
    });
  }
};

module.exports = {
  registerStudentByHeadteacher,
  getStudentsForHeadteacher,
};
