/**
 * Admin Controller
 */

const User = require('../models/User');
const School = require('../models/School');
const Student = require('../models/Student');
const Classroom = require('../models/Classroom');
const DailyAttendance = require('../models/DailyAttendance');
const AttendanceFlag = require('../models/AttendanceFlag');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

const createHeadteacher = async (req, res) => {
  try {
    const { fullName, email, school, schoolLevel, tempPassword } = req.body;
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

    const headteacher = await User.create({
      fullName, email, phone,
      password: tempPassword,
      role: 'headteacher',
      schoolLevel, // PRIMARY or JHS
      // school field will be linked to School model later (optional for now)
      isVerified: true,
      isActive: true,
    });

    // Try to send email (don't fail if email fails)
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to EduTrack GH',
        html: emailTemplates.lecturerWelcome(fullName, email, tempPassword),
      });
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
      fullName, email, phone,
      password: tempPassword,
      role: 'teacher',
      schoolId: schoolId || null,
      isVerified: true,
      isActive: true,
    });

    // Try to send email (don't fail if email fails)
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to EduTrack GH',
        html: emailTemplates.lecturerWelcome(fullName, email, tempPassword),
      });
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
        totalStudents 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get stats' });
  }
};

// School Management
const getSchools = async (req, res) => {
  try {
    const schools = await School.find()
      .populate('headteacher', 'fullName email phone')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, count: schools.length, schools });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get schools' });
  }
};

const createSchool = async (req, res) => {
  try {
    const { name, schoolLevel, location, contact, headteacherId } = req.body;

    if (!name || !schoolLevel) {
      return res.status(400).json({ 
        success: false, 
        message: 'School name and level are required' 
      });
    }

    // Check if headteacher exists and is available
    if (headteacherId) {
      const headteacher = await User.findById(headteacherId);
      if (!headteacher || headteacher.role !== 'headteacher') {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid headteacher' 
        });
      }
    }

    const school = await School.create({
      name,
      schoolLevel,
      location: location || {},
      contact: contact || {},
      headteacher: headteacherId || null,
    });

    // If headteacher provided, link school to headteacher
    if (headteacherId) {
      await User.findByIdAndUpdate(headteacherId, { school: school._id });
    }

    res.status(201).json({ 
      success: true, 
      message: 'School created successfully', 
      school 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create school' 
    });
  }
};

const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const school = await School.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!school) {
      return res.status(404).json({ 
        success: false, 
        message: 'School not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'School updated successfully', 
      school 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update school' 
    });
  }
};

const toggleSchoolStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const school = await School.findById(id);
    if (!school) {
      return res.status(404).json({ 
        success: false, 
        message: 'School not found' 
      });
    }

    school.isActive = !school.isActive;
    await school.save();

    res.json({ 
      success: true, 
      message: `School ${school.isActive ? 'activated' : 'deactivated'} successfully`, 
      school 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle school status' 
    });
  }
};

// System Settings
const getSystemSettings = async (req, res) => {
  try {
    // In a real system, these would be stored in a Settings model
    // For now, return default settings
    const settings = {
      attendance: {
        markingDeadlineHour: 9,
        chronicAbsenteeismThreshold: 3,
        absenteeismPercentageThreshold: 10,
        gracePeriodHours: 24,
      },
      faceRecognition: {
        confidenceThreshold: 0.7,
        enabled: true,
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
      },
      system: {
        maintenanceMode: false,
        allowRegistration: true,
      },
    };

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get settings' });
  }
};

const updateSystemSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    // In a real system, save to Settings model
    // For now, just validate and return success
    // TODO: Implement Settings model and persistence

    res.json({ 
      success: true, 
      message: 'Settings updated successfully',
      settings 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update settings' 
    });
  }
};

// Phase 7: Get classrooms for a school (audit filters)
const getSchoolClassrooms = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const classrooms = await Classroom.find({ schoolId, isActive: true })
      .select('_id name grade')
      .sort({ name: 1 });
    res.json({ success: true, classrooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get classrooms' });
  }
};

// Phase 7: Admin attendance audit — filter by school, classroom, date
const getAttendanceAudit = async (req, res) => {
  try {
    const { schoolId, classroomId, date } = req.query;
    const query = {};
    if (schoolId) query.schoolId = schoolId;
    if (classroomId) query.classroomId = classroomId;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: d, $lte: dEnd };
    }
    const records = await DailyAttendance.find(query)
      .populate('studentId', 'fullName studentIdNumber')
      .populate('classroomId', 'name grade')
      .populate('schoolId', 'name')
      .sort({ date: -1, markedAt: -1 })
      .limit(500)
      .lean();
    const presentRecords = records.filter((r) => r.status === 'present');
    const photoVerified = presentRecords.filter((r) => r.verificationType === 'photo').length;
    const manualVerified = presentRecords.filter((r) => r.verificationType === 'manual').length;
    const totalPresent = presentRecords.length;
    const byDate = {};
    records.forEach((r) => {
      const d = r.date?.toISOString?.()?.split?.('T')?.[0] || 'unknown';
      if (!byDate[d]) byDate[d] = { present: 0, absent: 0, late: 0, total: 0 };
      byDate[d][r.status]++;
      byDate[d].total++;
    });
    const hundredPercentDays = Object.entries(byDate).filter(
      ([_, v]) => v.total > 0 && v.present === v.total
    ).length;
    res.json({
      success: true,
      records,
      summary: {
        totalRecords: records.length,
        photoVerifiedPct: totalPresent > 0 ? Math.round((photoVerified / totalPresent) * 100) : 0,
        manualVerifiedPct: totalPresent > 0 ? Math.round((manualVerified / totalPresent) * 100) : 0,
        hundredPercentPresentDays: hundredPercentDays,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get attendance audit',
    });
  }
};

// Phase 7 & 8: Admin attendance flags (suspicious patterns)
const getAttendanceFlags = async (req, res) => {
  try {
    const { schoolId, resolved } = req.query;
    const query = {};
    if (schoolId) query.schoolId = schoolId;
    if (resolved !== undefined) query.isResolved = resolved === 'true';
    const flags = await AttendanceFlag.find(query)
      .populate('classroomId', 'name grade')
      .populate('schoolId', 'name')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ success: true, count: flags.length, flags });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get attendance flags',
    });
  }
};

// Phase 3: Admin unlock attendance for a classroom and date
const unlockAttendance = async (req, res) => {
  try {
    const { classroomId, date } = req.params;
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const result = await DailyAttendance.updateMany(
      { classroomId, date: dateOnly },
      { $set: { isLocked: false } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attendance records found for this classroom and date',
      });
    }
    res.json({
      success: true,
      message: `Unlocked ${result.modifiedCount} attendance record(s)`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to unlock attendance',
    });
  }
};

module.exports = { 
  createHeadteacher, 
  createTeacher, 
  getHeadteachers, 
  getTeachers, 
  getStats,
  getSchools,
  createSchool,
  updateSchool,
  toggleSchoolStatus,
  getSystemSettings,
  updateSystemSettings,
  getSchoolClassrooms,
  getAttendanceAudit,
  getAttendanceFlags,
  unlockAttendance,
};
