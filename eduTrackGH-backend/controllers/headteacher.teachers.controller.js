/**
 * Headteacher – teachers (list, create, toggle status)
 */

const User = require('../models/User');
const Classroom = require('../models/Classroom');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const { getClassroomLevelFilter } = require('../services/headteacherService');

function getSchoolId(req) {
  return req.user?.school || null;
}

function buildTeacherScopeQuery({ schoolId, userSchoolLevel, headteacherId }) {
  // Primary/JHS headteachers are independent: teachers are scoped to the headteacher
  // who created them (strict ownership).
  const base = { role: 'teacher', schoolId, createdByHeadteacher: headteacherId };
  if (!userSchoolLevel) return base;
  return { ...base, schoolLevel: userSchoolLevel };
}

const getTeachersForSchool = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }
    const scopeQuery = buildTeacherScopeQuery({
      schoolId,
      userSchoolLevel: req.user.schoolLevel,
      headteacherId: req.user._id,
    });
    const teachers = await User.find(scopeQuery).select('-password').sort({ createdAt: -1 });
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
      schoolLevel: req.user.schoolLevel || undefined,
      createdByHeadteacher: req.user._id,
      isVerified: true,
      isActive: true,
    });

    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to EduTrack GH',
        html: emailTemplates.teacherWelcome(
          fullName,
          email,
          tempPassword,
          process.env.FRONTEND_URL || '',
          req.user.fullName
        ),
      });
    } catch (emailError) {
      console.error('⚠️  Failed to send welcome email:', emailError.message);
    }

    res.status(201).json({ success: true, message: 'Teacher created successfully', teacher: teacher.getPublicProfile(), emailSentTo: email });
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
    const scopeQuery = buildTeacherScopeQuery({
      schoolId,
      userSchoolLevel: req.user.schoolLevel,
      headteacherId: req.user._id,
    });
    const teacher = await User.findOne({ ...scopeQuery, _id: id });
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

const deleteTeacherForSchool = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }

    const { id } = req.params;
    const scopeQuery = buildTeacherScopeQuery({
      schoolId,
      userSchoolLevel: req.user.schoolLevel,
      headteacherId: req.user._id,
    });
    const teacher = await User.findOne({ ...scopeQuery, _id: id });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found in your school' });
    }

    // Unassign from any classrooms in this school
    await Classroom.updateMany(
      { schoolId, teacherId: teacher._id },
      { $unset: { teacherId: 1 } }
    );

    await User.deleteOne({ _id: teacher._id });

    return res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete teacher' });
  }
};

module.exports = {
  getTeachersForSchool,
  createTeacherForSchool,
  toggleTeacherStatusForSchool,
  deleteTeacherForSchool,
};
