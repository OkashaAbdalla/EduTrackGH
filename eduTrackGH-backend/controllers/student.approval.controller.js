/**
 * Student approval controller – headteacher approve/reject and list pending
 */

const User = require('../models/User');
const {
  getPendingStudentsForHeadteacher: getPendingService,
  approveStudent: approveService,
  rejectStudent: rejectService,
} = require('../services/studentService');

const getHeadteacherSchool = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.role !== 'headteacher' || !user.school) return null;
  return user.school;
};

const getPendingStudentsForHeadteacher = async (req, res) => {
  try {
    const schoolId = await getHeadteacherSchool(req.user._id);
    if (!schoolId) {
      return res.status(403).json({
        success: false,
        message: 'Headteacher with assigned school required',
      });
    }
    const students = await getPendingService(schoolId);
    return res.json({ success: true, count: students.length, students });
  } catch (err) {
    console.error('getPendingStudentsForHeadteacher error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to load pending students',
    });
  }
};

const approveStudent = async (req, res) => {
  try {
    const schoolId = await getHeadteacherSchool(req.user._id);
    if (!schoolId) {
      return res.status(403).json({
        success: false,
        message: 'Headteacher with assigned school required',
      });
    }
    const student = await approveService({
      studentId: req.params.id,
      headteacherId: req.user._id,
      schoolId,
    });
    return res.json({
      success: true,
      message: 'Student approved successfully',
      student,
    });
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || 'Failed to approve student';
    if (status === 500) console.error('approveStudent error:', err);
    return res.status(status).json({ success: false, message });
  }
};

const rejectStudent = async (req, res) => {
  try {
    const schoolId = await getHeadteacherSchool(req.user._id);
    if (!schoolId) {
      return res.status(403).json({
        success: false,
        message: 'Headteacher with assigned school required',
      });
    }
    const student = await rejectService({
      studentId: req.params.id,
      headteacherId: req.user._id,
      schoolId,
    });
    return res.json({
      success: true,
      message: 'Student rejected',
      student,
    });
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || 'Failed to reject student';
    if (status === 500) console.error('rejectStudent error:', err);
    return res.status(status).json({ success: false, message });
  }
};

module.exports = {
  getPendingStudentsForHeadteacher,
  approveStudent,
  rejectStudent,
};
