/**
 * Headteacher: list / approve / reject teacher-proposed edits to existing students.
 */

const User = require('../models/User');
const {
  getPendingStudentEditsForHeadteacher,
  approvePendingStudentEdit: approveEditService,
  rejectPendingStudentEdit: rejectEditService,
} = require('../services/studentService');

const getHeadteacherSchool = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.role !== 'headteacher' || !user.school) return null;
  return user.school;
};

const getPendingStudentEdits = async (req, res) => {
  try {
    const schoolId = await getHeadteacherSchool(req.user._id);
    if (!schoolId) {
      return res.status(403).json({
        success: false,
        message: 'Headteacher with assigned school required',
      });
    }
    const students = await getPendingStudentEditsForHeadteacher(schoolId);
    return res.json({ success: true, count: students.length, students });
  } catch (err) {
    console.error('getPendingStudentEdits error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to load pending edits',
    });
  }
};

const approvePendingStudentEdit = async (req, res) => {
  try {
    const schoolId = await getHeadteacherSchool(req.user._id);
    if (!schoolId) {
      return res.status(403).json({
        success: false,
        message: 'Headteacher with assigned school required',
      });
    }
    const student = await approveEditService({
      studentId: req.params.id,
      schoolId,
    });
    return res.json({
      success: true,
      message: 'Student record updated from teacher proposal',
      student,
    });
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || 'Failed to approve edit';
    if (status === 500) console.error('approvePendingStudentEdit error:', err);
    return res.status(status).json({ success: false, message });
  }
};

const rejectPendingStudentEdit = async (req, res) => {
  try {
    const schoolId = await getHeadteacherSchool(req.user._id);
    if (!schoolId) {
      return res.status(403).json({
        success: false,
        message: 'Headteacher with assigned school required',
      });
    }
    const student = await rejectEditService({
      studentId: req.params.id,
      schoolId,
    });
    return res.json({
      success: true,
      message: 'Teacher edit proposal dismissed',
      student,
    });
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || 'Failed to reject edit';
    if (status === 500) console.error('rejectPendingStudentEdit error:', err);
    return res.status(status).json({ success: false, message });
  }
};

module.exports = {
  getPendingStudentEdits,
  approvePendingStudentEdit,
  rejectPendingStudentEdit,
};
