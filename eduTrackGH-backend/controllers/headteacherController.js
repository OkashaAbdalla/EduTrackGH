/**
 * Headteacher Controller
 * School-scoped operations for headteacher role
 * - Teachers in school (create, list, toggle active)
 * - Classrooms in school and teacher assignments
 */

const User = require('../models/User');
const Classroom = require('../models/Classroom');
const School = require('../models/School');
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

    let classrooms = await Classroom.find({ schoolId, isActive: true })
      .select('_id name grade studentCount teacherId')
      .populate('teacherId', 'fullName');

    // Auto-bootstrap default classrooms (P1–P6 / JHS 1–3) if none exist yet
    if (!classrooms.length) {
      // Determine school level: prefer user, fall back to school document
      let schoolLevel = req.user.schoolLevel;
      if (!schoolLevel) {
        const schoolDoc = await School.findById(schoolId).select('schoolLevel');
        schoolLevel = schoolDoc?.schoolLevel || 'PRIMARY';
      }

      let definitions = [];
      if (schoolLevel === 'PRIMARY' || schoolLevel === 'BOTH') {
        definitions = definitions.concat([
          { grade: 'P1', name: 'P1' },
          { grade: 'P2', name: 'P2' },
          { grade: 'P3', name: 'P3' },
          { grade: 'P4', name: 'P4' },
          { grade: 'P5', name: 'P5' },
          { grade: 'P6', name: 'P6' },
        ]);
      }
      if (schoolLevel === 'JHS' || schoolLevel === 'BOTH') {
        definitions = definitions.concat([
          { grade: 'JHS 1', name: 'JHS 1' },
          { grade: 'JHS 2', name: 'JHS 2' },
          { grade: 'JHS 3', name: 'JHS 3' },
        ]);
      }

      if (definitions.length) {
        const payload = definitions.map((d) => ({
          name: d.name,
          grade: d.grade,
          schoolId,
        }));

        const created = await Classroom.insertMany(payload);

        // Best-effort update of cached totalClassrooms
        try {
          await School.findByIdAndUpdate(
            schoolId,
            { $inc: { totalClassrooms: created.length } },
            { new: false }
          );
        } catch (_) {
          // Non-critical; ignore cache update failures
        }

        classrooms = await Classroom.find({ schoolId, isActive: true })
          .select('_id name grade studentCount teacherId')
          .populate('teacherId', 'fullName');
      }
    }

    res.json({ success: true, classrooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get classrooms' });
  }
};

/**
 * POST /api/headteacher/classrooms/seed-default
 * Create default classrooms for the headteacher's school
 * - PRIMARY: P1–P6
 * - JHS: JHS 1–3
 */
const seedDefaultClassroomsForSchool = async (req, res) => {
  try {
    const schoolId = req.user.school;
    const schoolLevel = req.user.schoolLevel || 'PRIMARY';

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }

    let definitions = [];
    if (schoolLevel === 'PRIMARY' || schoolLevel === 'BOTH') {
      definitions = definitions.concat([
        { grade: 'P1', name: 'P1' },
        { grade: 'P2', name: 'P2' },
        { grade: 'P3', name: 'P3' },
        { grade: 'P4', name: 'P4' },
        { grade: 'P5', name: 'P5' },
        { grade: 'P6', name: 'P6' },
      ]);
    }
    if (schoolLevel === 'JHS' || schoolLevel === 'BOTH') {
      definitions = definitions.concat([
        { grade: 'JHS 1', name: 'JHS 1' },
        { grade: 'JHS 2', name: 'JHS 2' },
        { grade: 'JHS 3', name: 'JHS 3' },
      ]);
    }

    if (!definitions.length) {
      return res.status(400).json({
        success: false,
        message: 'No default classroom set defined for your school level',
      });
    }

    const existing = await Classroom.find({
      schoolId,
      grade: { $in: definitions.map((d) => d.grade) },
    }).select('grade');
    const existingGrades = new Set(existing.map((c) => c.grade));

    const toCreate = definitions
      .filter((d) => !existingGrades.has(d.grade))
      .map((d) => ({
        name: d.name,
        grade: d.grade,
        schoolId,
      }));

    if (!toCreate.length) {
      const classrooms = await Classroom.find({ schoolId, isActive: true })
        .select('_id name grade studentCount teacherId')
        .populate('teacherId', 'fullName');
      return res.json({
        success: true,
        message: 'All default classrooms already exist',
        createdCount: 0,
        classrooms,
      });
    }

    const created = await Classroom.insertMany(toCreate);

    // Best-effort update of cached totalClassrooms
    try {
      await School.findByIdAndUpdate(
        schoolId,
        { $inc: { totalClassrooms: created.length } },
        { new: false }
      );
    } catch (_) {
      // Non-critical; ignore cache update failures
    }

    const classrooms = await Classroom.find({ schoolId, isActive: true })
      .select('_id name grade studentCount teacherId')
      .populate('teacherId', 'fullName');

    res.status(201).json({
      success: true,
      message: 'Default classrooms created successfully',
      createdCount: created.length,
      classrooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create default classrooms',
    });
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

/**
 * PATCH /api/headteacher/teachers/:id/toggle-status
 * Activate/deactivate a teacher within the headteacher's school
 */
const toggleTeacherStatusForSchool = async (req, res) => {
  try {
    const schoolId = req.user.school;
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }

    const { id } = req.params;
    const teacher = await User.findOne({ _id: id, role: 'teacher', schoolId });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found in your school' });
    }

    teacher.isActive = !teacher.isActive;
    await teacher.save();

    res.json({
      success: true,
      message: `Teacher ${teacher.isActive ? 'activated' : 'deactivated'} successfully`,
      teacher: teacher.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle teacher status',
    });
  }
};

module.exports = {
  getTeachersForSchool,
  createTeacherForSchool,
  getClassroomsForSchool,
  assignClassTeacher,
  toggleTeacherStatusForSchool,
  seedDefaultClassroomsForSchool,
};
