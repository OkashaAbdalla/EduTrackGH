/**
 * Admin – users (headteachers, teachers, stats)
 */

const User = require('../models/User');
const School = require('../models/School');
const Student = require('../models/Student');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

const schoolAllowsHeadteacherLevel = (school, headteacherLevel) => {
  if (!school || !headteacherLevel) return false;
  if (school.schoolLevel === 'BOTH') return ['PRIMARY', 'JHS'].includes(headteacherLevel);
  return school.schoolLevel === headteacherLevel;
};

const getSchoolSlotKeyForHeadteacher = (headteacherLevel) => {
  return headteacherLevel === 'PRIMARY' ? 'primaryHeadteacher' : 'jhsHeadteacher';
};

// Create headteacher account and optionally link to a school
const createHeadteacher = async (req, res) => {
  try {
    const { fullName, email, schoolId, schoolLevel, tempPassword } = req.body;
    const phone = (req.body.phone && String(req.body.phone).trim()) || '';

    // Hard requirement: this flow must email credentials to the headteacher.
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res.status(500).json({
        success: false,
        message:
          'Email service is not configured on the server (missing EMAIL_USER/EMAIL_PASSWORD). Headteacher was not created.',
      });
    }

    if (!tempPassword || String(tempPassword).trim().length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Temporary password is required (min 8 characters)',
      });
    }

    if (!schoolLevel || !['PRIMARY', 'JHS'].includes(schoolLevel)) {
      return res
        .status(400)
        .json({ success: false, message: 'School level is required (PRIMARY or JHS)' });
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

    const headteacherData = {
      fullName,
      email,
      phone,
      password: tempPassword,
      role: 'headteacher',
      schoolLevel,
      isVerified: true,
      isActive: true,
    };

    if (schoolId) {
      const schoolDoc = await School.findById(schoolId);
      if (!schoolDoc) {
        return res.status(400).json({ success: false, message: 'School not found' });
      }
      if (!schoolAllowsHeadteacherLevel(schoolDoc, schoolLevel)) {
        return res.status(400).json({
          success: false,
          message: `Cannot assign a ${schoolLevel} headteacher to a ${schoolDoc.schoolLevel} school`,
        });
      }

      const slotKey = getSchoolSlotKeyForHeadteacher(schoolLevel);
      if (schoolDoc[slotKey] && schoolDoc[slotKey].toString() !== String(schoolDoc.headteacher)) {
        return res.status(400).json({
          success: false,
          message: `School already has a ${schoolLevel} headteacher assigned`,
        });
      }
      headteacherData.school = schoolId;
    }

    const headteacher = await User.create(headteacherData);

    const rollback = async () => {
      try {
        if (schoolId) {
          const slotKey = getSchoolSlotKeyForHeadteacher(schoolLevel);
          const schoolDoc = await School.findById(schoolId);
          if (schoolDoc) {
            if (String(schoolDoc[slotKey] || '') === String(headteacher._id)) {
              schoolDoc[slotKey] = null;
            }
            if (String(schoolDoc.headteacher || '') === String(headteacher._id)) {
              schoolDoc.headteacher = null;
            }
            await schoolDoc.save();
          }
        }
      } catch {
        // best-effort rollback
      }
      try {
        await User.deleteOne({ _id: headteacher._id });
      } catch {
        // best-effort rollback
      }
    };

    try {
      if (schoolId) {
        const slotKey = getSchoolSlotKeyForHeadteacher(schoolLevel);
        const update = { [slotKey]: headteacher._id };
        // keep legacy headteacher for single-level schools
        const schoolDoc = await School.findById(schoolId).select('schoolLevel');
        if (schoolDoc?.schoolLevel === 'PRIMARY' && schoolLevel === 'PRIMARY') update.headteacher = headteacher._id;
        if (schoolDoc?.schoolLevel === 'JHS' && schoolLevel === 'JHS') update.headteacher = headteacher._id;
        await School.findByIdAndUpdate(schoolId, update);
      }

      const loginUrl = process.env.FRONTEND_URL || '';
      const emailResult = await sendEmail({
        to: email,
        subject: 'Welcome to EduTrack GH',
        html: emailTemplates.lecturerWelcome(fullName, email, tempPassword, loginUrl),
      });

      // keep emailResult for potential debugging (not persisted)
      void emailResult;
    } catch (emailError) {
      console.error('Failed to send headteacher welcome email:', emailError.message);
      await rollback();
      return res.status(502).json({
        success: false,
        message:
          'Failed to send credentials email. Headteacher was not created. Please fix EMAIL settings and try again.',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Headteacher created successfully',
      headteacher: headteacher.getPublicProfile(),
      emailSentTo: email,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: error.message || 'Failed to create headteacher' });
  }
};

// Delete a headteacher completely (and unlink from any school slots)
const deleteHeadteacher = async (req, res) => {
  try {
    const { id } = req.params;
    const headteacher = await User.findById(id);
    if (!headteacher || headteacher.role !== 'headteacher') {
      return res.status(404).json({ success: false, message: 'Headteacher not found' });
    }

    // Unlink from school if linked
    if (headteacher.school) {
      const school = await School.findById(headteacher.school);
      if (school) {
        const slotKey = getSchoolSlotKeyForHeadteacher(headteacher.schoolLevel);
        if (String(school[slotKey] || '') === String(headteacher._id)) school[slotKey] = null;
        if (String(school.headteacher || '') === String(headteacher._id)) school.headteacher = null;
        await school.save();
      }
    }

    await User.deleteOne({ _id: headteacher._id });

    return res.json({ success: true, message: 'Headteacher deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete headteacher' });
  }
};

// Create teacher account (system-wide, for later assignment to schools)
const createTeacher = async (req, res) => {
  try {
    const { fullName, email, schoolId, tempPassword } = req.body;
    const phone = (req.body.phone && String(req.body.phone).trim()) || '';

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
      schoolId: schoolId || null,
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
      console.error('Failed to send teacher welcome email:', emailError.message);
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

// List all headteachers (system-wide)
const getHeadteachers = async (req, res) => {
  try {
    const headteachers = await User.find({ role: 'headteacher' })
      .select('-password')
      .populate('school', 'name schoolLevel')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: headteachers.length, headteachers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get headteachers' });
  }
};

// List all teachers (system-wide)
const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: teachers.length, teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get teachers' });
  }
};

// Update teacher details
const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, schoolLevel, assignedClasses } = req.body;

    const teacher = await User.findById(id);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    if (email && email !== teacher.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
      teacher.email = email;
    }

    if (phone && phone !== teacher.phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ success: false, message: 'Phone number already registered' });
      }
      teacher.phone = phone;
    }

    if (fullName) teacher.fullName = fullName;
    if (schoolLevel) teacher.schoolLevel = schoolLevel;
    if (Array.isArray(assignedClasses)) {
      teacher.classroomIds = assignedClasses;
    }

    await teacher.save();

    res.json({
      success: true,
      message: 'Teacher updated successfully',
      teacher: teacher.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update teacher' });
  }
};

// Toggle teacher active/inactive
const toggleTeacherStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await User.findById(id);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

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

// System-wide stats
const getStats = async (req, res) => {
  try {
    const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
    const totalHeadteachers = await User.countDocuments({ role: 'headteacher', isActive: true });
    const totalParents = await User.countDocuments({ role: 'parent', isActive: true });
    const totalSchools = await School.countDocuments({ isActive: true });
    const totalStudents = await Student.countDocuments({ isActive: true });

    res.json({
      success: true,
      stats: {
        totalTeachers,
        totalHeadteachers,
        totalParents,
        totalSchools,
        totalStudents,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get stats' });
  }
};

// Assign or unassign a headteacher to a school
const assignHeadteacherToSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { schoolId } = req.body;

    const headteacher = await User.findById(id);
    if (!headteacher || headteacher.role !== 'headteacher') {
      return res.status(404).json({ success: false, message: 'Headteacher not found' });
    }

    const slotKey = getSchoolSlotKeyForHeadteacher(headteacher.schoolLevel);

    // Unassign from current school (slot-aware)
    if (!schoolId) {
      if (headteacher.school) {
        const currentSchool = await School.findById(headteacher.school);
        if (currentSchool) {
          if (String(currentSchool[slotKey] || '') === String(headteacher._id)) {
            currentSchool[slotKey] = null;
          }
          if (String(currentSchool.headteacher || '') === String(headteacher._id)) {
            currentSchool.headteacher = null;
          }
          await currentSchool.save();
        }
      }
      headteacher.school = undefined;
      await headteacher.save();
      return res.json({
        success: true,
        message: 'Headteacher unassigned from school',
        headteacher: headteacher.getPublicProfile(),
        school: null,
      });
    }

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    if (!schoolAllowsHeadteacherLevel(school, headteacher.schoolLevel)) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign a ${headteacher.schoolLevel} headteacher to a ${school.schoolLevel} school`,
      });
    }

    // If the relevant slot already has another headteacher, block
    if (school[slotKey] && school[slotKey].toString() !== headteacher._id.toString()) {
      return res.status(400).json({
        success: false,
        message: `School already has a ${headteacher.schoolLevel} headteacher assigned`,
      });
    }

    // Clear previous school link if different
    if (headteacher.school && headteacher.school.toString() !== schoolId) {
      const prevSchool = await School.findById(headteacher.school);
      if (prevSchool) {
        if (String(prevSchool[slotKey] || '') === String(headteacher._id)) prevSchool[slotKey] = null;
        if (String(prevSchool.headteacher || '') === String(headteacher._id)) prevSchool.headteacher = null;
        await prevSchool.save();
      }
    }

    headteacher.school = schoolId;
    await headteacher.save();
    const update = { [slotKey]: headteacher._id };
    // legacy field for single-level schools
    if (school.schoolLevel === headteacher.schoolLevel) update.headteacher = headteacher._id;
    await School.findByIdAndUpdate(schoolId, update);

    return res.json({
      success: true,
      message: 'Headteacher assigned to school successfully',
      headteacher: headteacher.getPublicProfile(),
      school: { _id: school._id, name: school.name },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to assign headteacher' });
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
  assignHeadteacherToSchool,
  deleteHeadteacher,
};

