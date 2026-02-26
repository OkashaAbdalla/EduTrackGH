/**
 * Headteacher Controller
 * School-scoped operations for headteacher role
 * - Teachers in school
 * - Classrooms in school and teacher assignments
 */

const User = require('../models/User');
const Classroom = require('../models/Classroom');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

/**
 * GET /api/headteacher/teachers
 * List teachers in headteacher's school
 */
const getTeachersForSchool = async (req, res) => {
  try {
    const schoolId = req.user.school;
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }

    const teachers = await User.find({ role: 'teacher', schoolId })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: teachers.length, teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get teachers' });
  }
};

/**
 * POST /api/headteacher/teachers
 * Create teacher for headteacher's school (schoolId = req.user.school)
 */
const createTeacherForSchool = async (req, res) => {
  try {
    const schoolId = req.user.school;
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }

    const { fullName, email, tempPassword } = req.body;
    const phone = (req.body.phone && String(req.body.phone).trim()) || '';

    if (!fullName || !email || !tempPassword) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ success: false, message: 'Phone number already registered' });
      }
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
      await sendEmail({
        to: email,
        subject: 'Welcome to EduTrack GH',
        html: emailTemplates.lecturerWelcome(fullName, email, tempPassword),
      });
    } catch (emailError) {
      console.error('⚠️  Failed to send welcome email:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      teacher: teacher.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create teacher' });
  }
};

/**
 * GET /api/headteacher/classrooms
 * List classrooms in headteacher's school
 */
const getClassroomsForSchool = async (req, res) => {
  try {
    const schoolId = req.user.school;
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }

    const classrooms = await Classroom.find({ schoolId, isActive: true })
      .select('_id name grade studentCount teacherId')
      .populate('teacherId', 'fullName');

    res.json({ success: true, classrooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get classrooms' });
  }
};

/**
 * PATCH /api/headteacher/classrooms/:id/assign-teacher
 * Assign or change teacher for a classroom in headteacher's school
 */
const assignClassTeacher = async (req, res) => {
  try {
    const schoolId = req.user.school;
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }

    const { id } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({ success: false, message: 'Teacher ID is required' });
    }

    // Ensure teacher belongs to same school
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher', schoolId });
    if (!teacher) {
      return res.status(400).json({ success: false, message: 'Invalid teacher for this school' });
    }

    const classroom = await Classroom.findOneAndUpdate(
      { _id: id, schoolId },
      { teacherId },
      { new: true }
    ).populate('teacherId', 'fullName');

    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found for your school' });
    }

    res.json({
      success: true,
      message: 'Teacher assigned to classroom successfully',
      classroom,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to assign teacher' });
  }
};

module.exports = {
  getTeachersForSchool,
  createTeacherForSchool,
  getClassroomsForSchool,
  assignClassTeacher,
};
