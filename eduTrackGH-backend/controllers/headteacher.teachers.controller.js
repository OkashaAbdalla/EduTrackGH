/**
 * Headteacher – teachers (list, create, toggle status)
 */

const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

function getSchoolId(req) {
  return req.user?.school || null;
}

const getTeachersForSchool = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }
    const teachers = await User.find({ role: 'teacher', schoolId }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: teachers.length, teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get teachers' });
  }
};

const createTeacherForSchool = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }
    const { fullName, email, tempPassword } = req.body;
    const phone = (req.body.phone && String(req.body.phone).trim()) || '';

    if (!fullName || !email || !tempPassword) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required' });
    }
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: 'Email already registered' });
    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    const teacher = await User.create({
      fullName,
      email,
      phone,
      password: tempPassword,
      role: 'teacher',
      schoolId,
      isVerified: true,
      isActive: true,
    });

    try {
      await sendEmail({ to: email, subject: 'Welcome to EduTrack GH', html: emailTemplates.lecturerWelcome(fullName, email, tempPassword) });
    } catch (emailError) {
      console.error('⚠️  Failed to send welcome email:', emailError.message);
    }

    res.status(201).json({ success: true, message: 'Teacher created successfully', teacher: teacher.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create teacher' });
  }
};

const toggleTeacherStatusForSchool = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }
    const { id } = req.params;
    const teacher = await User.findOne({ _id: id, role: 'teacher', schoolId });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found in your school' });
    teacher.isActive = !teacher.isActive;
    await teacher.save();
    res.json({
      success: true,
      message: `Teacher ${teacher.isActive ? 'activated' : 'deactivated'} successfully`,
      teacher: teacher.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to toggle teacher status' });
  }
};

module.exports = {
  getTeachersForSchool,
  createTeacherForSchool,
  toggleTeacherStatusForSchool,
};
