/**
 * Admin – users (headteachers, teachers, stats)
 */

const User = require('../models/User');
const School = require('../models/School');
const Student = require('../models/Student');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

const createHeadteacher = async (req, res) => {
  try {
    const { fullName, email, school, schoolId, schoolLevel, tempPassword } = req.body;
    const phone = (req.body.phone && String(req.body.phone).trim()) || '';

    if (!schoolLevel || !['PRIMARY', 'JHS'].includes(schoolLevel)) {
      return res.status(400).json({ success: false, message: 'School level is required (PRIMARY or JHS)' });
    }
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: 'Email already registered' });
    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    const headteacherData = { fullName, email, phone, password: tempPassword, role: 'headteacher', schoolLevel, isVerified: true, isActive: true };
    if (schoolId) {
      const schoolDoc = await School.findById(schoolId);
      if (!schoolDoc) return res.status(400).json({ success: false, message: 'School not found' });
      if (schoolDoc.headteacher) return res.status(400).json({ success: false, message: 'School already has a headteacher assigned' });
      headteacherData.school = schoolId;
    }

    const headteacher = await User.create(headteacherData);
    if (schoolId) await School.findByIdAndUpdate(schoolId, { headteacher: headteacher._id });

    try {
      await sendEmail({ to: email, subject: 'Welcome to EduTrack GH', html: emailTemplates.lecturerWelcome(fullName, email, tempPassword) });
    } catch (emailError) {
      console.error('⚠️  Failed to send email:', emailError.message);
    }
    res.status(201).json({ success: true, message: 'Headteacher created successfully', headteacher: headteacher.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create headteacher' });
  }
};

const createTeacher = async (req, res) => {
  try {
    const { fullName, email, schoolId, tempPassword } = req.body;
    const phone = (req.body.phone && String(req.body.phone).trim()) || '';

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: 'Email already registered' });
    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) return res.status(400).json({ success: false, message: 'Phone number already registered' });
    }

    const teacher = await User.create({
      fullName, email, phone, password: tempPassword, role: 'teacher', schoolId: schoolId || null, isVerified: true, isActive: true,
    });
    try {
      await sendEmail({ to: email, subject: 'Welcome to EduTrack GH', html: emailTemplates.lecturerWelcome(fullName, email, tempPassword) });
    } catch (emailError) {
      console.error('⚠️  Failed to send email:', emailError.message);
    }
    res.status(201).json({ success: true, message: 'Teacher created successfully', teacher: teacher.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create teacher' });
  }
};

const getHeadteachers = async (req, res) => {
  try {
    const headteachers = await User.find({ role: 'headteacher' }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: headteachers.length, headteachers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get headteachers' });
  }
};

const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: teachers.length, teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get teachers' });
  }
};

const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, schoolLevel, assignedClasses } = req.body;
    const teacher = await User.findById(id);
    if (!teacher || teacher.role !== 'teacher') return res.status(404).json({ success: false, message: 'Teacher not found' });

    if (email && email !== teacher.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ success: false, message: 'Email already registered' });
      teacher.email = email;
    }
    if (phone && phone !== teacher.phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) return res.status(400).json({ success: false, message: 'Phone number already registered' });
      teacher.phone = phone;
    }
    if (fullName) teacher.fullName = fullName;
    if (schoolLevel) teacher.schoolLevel = schoolLevel;
    if (Array.isArray(assignedClasses)) teacher.classroomIds = assignedClasses;
    await teacher.save();
    res.json({ success: true, message: 'Teacher updated successfully', teacher: teacher.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update teacher' });
  }
};

const toggleTeacherStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await User.findById(id);
    if (!teacher || teacher.role !== 'teacher') return res.status(404).json({ success: false, message: 'Teacher not found' });
    teacher.isActive = !teacher.isActive;
    await teacher.save();
    res.json({ success: true, message: `Teacher ${teacher.isActive ? 'activated' : 'deactivated'} successfully`, teacher: teacher.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to toggle teacher status' });
  }
};

const getStats = async (req, res) => {
  try {
    const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
    const totalHeadteachers = await User.countDocuments({ role: 'headteacher', isActive: true });
    const totalParents = await User.countDocuments({ role: 'parent', isActive: true });
    const totalSchools = await School.countDocuments({ isActive: true });
    const totalStudents = await Student.countDocuments({ isActive: true });
    res.json({ success: true, stats: { totalTeachers, totalHeadteachers, totalParents, totalSchools, totalStudents } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get stats' });
  }
};

module.exports = {
  createHeadteacher,
  createTeacher,
  getHeadteachers,
  getTeachers,
  updateTeacher,
  toggleTeacherStatus,
  getStats,
};
