/**
 * Student proposal controller – teacher proposes new student
 */

const { proposeStudent: proposeStudentService } = require('../services/studentService');

const proposeStudent = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const student = await proposeStudentService({ teacherId, body: req.body });
    return res.status(201).json({
      success: true,
      message: 'Student proposed successfully. Awaiting headteacher approval.',
      student,
    });
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || 'Failed to propose student';
    if (status === 500) console.error('proposeStudent error:', err);
    return res.status(status).json({ success: false, message });
  }
};

module.exports = { proposeStudent };
