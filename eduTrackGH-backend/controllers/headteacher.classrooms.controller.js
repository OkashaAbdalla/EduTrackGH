/**
 * Headteacher – classrooms (list with bootstrap, seed default, assign teacher)
 */

const User = require('../models/User');
const Classroom = require('../models/Classroom');
const DailyAttendance = require('../models/DailyAttendance');
const TeacherMessage = require('../models/TeacherMessage');
const { getClassroomsWithBootstrap, seedDefaultClassrooms, getDefinitionsForLevel, getClassroomLevelFilter } = require('../services/headteacherService');

function getSchoolId(req) {
  return req.user?.school || null;
}

const getClassroomsForSchool = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }
    const classrooms = await getClassroomsWithBootstrap(schoolId, req.user.schoolLevel);
    res.json({ success: true, classrooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get classrooms' });
  }
};

const seedDefaultClassroomsForSchool = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const schoolLevel = req.user.schoolLevel || 'PRIMARY';
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }
    if (!getDefinitionsForLevel(schoolLevel).length) {
      return res.status(400).json({ success: false, message: 'No default classroom set defined for your school level' });
    }
    const { createdCount, classrooms } = await seedDefaultClassrooms(schoolId, schoolLevel);
    const message = createdCount > 0 ? 'Default classrooms created successfully' : 'All default classrooms already exist';
    res.status(createdCount > 0 ? 201 : 200).json({
      success: true,
      message,
      createdCount,
      classrooms,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create default classrooms' });
  }
};

const assignClassTeacher = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }
    const { id } = req.params;
    const { teacherId } = req.body;
    const unassign = teacherId === null || teacherId === '' || teacherId === undefined;

    // Ensure headteacher cannot assign across PRIMARY/JHS sections.
    const levelFilter = getClassroomLevelFilter(req.user.schoolLevel);
    const classroomForScope = await Classroom.findOne({ _id: id, schoolId, ...levelFilter }).select('_id');
    if (!classroomForScope) {
      return res.status(404).json({ success: false, message: 'Classroom not found for your section' });
    }

    if (!unassign) {
      const teacher = await User.findOne({
        _id: teacherId,
        role: 'teacher',
        schoolId,
        createdByHeadteacher: req.user._id,
        schoolLevel: req.user.schoolLevel,
      });
      if (!teacher) return res.status(400).json({ success: false, message: 'Invalid teacher for this school' });
    }

    const update = unassign ? { $unset: { teacherId: 1 } } : { teacherId };
    const classroom = await Classroom.findOneAndUpdate({ _id: id, schoolId, ...levelFilter }, update, { new: true })
      .populate('teacherId', 'fullName email isActive');
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found for your school' });

    res.json({ success: true, message: 'Teacher assigned to classroom successfully', classroom });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to assign teacher' });
  }
};

// Headteacher: unlock attendance for a classroom and date in their school
const unlockAttendanceForHeadteacher = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }

    const { classroomId, date } = req.params;
    if (!classroomId || !date) {
      return res.status(400).json({ success: false, message: 'Classroom ID and date are required' });
    }

    const classroom = await Classroom.findOne({ _id: classroomId, schoolId });
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found for your school' });
    }

    let dateOnly;
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, d] = date.split('-').map((v) => parseInt(v, 10));
      dateOnly = new Date(Date.UTC(y, m - 1, d));
    } else {
      dateOnly = new Date(date);
      dateOnly.setUTCHours(0, 0, 0, 0);
    }

    const result = await DailyAttendance.updateMany(
      { classroomId, schoolId, date: dateOnly },
      { $set: { isLocked: false } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attendance records found for this classroom and date',
      });
    }

    // Resolve related teacher messages (best effort)
    try {
      await TeacherMessage.updateMany(
        {
          headteacherId: req.user._id,
          schoolId,
          classroomId,
          attendanceDate: dateOnly,
          status: 'pending',
        },
        { $set: { status: 'resolved' } }
      );
    } catch (e) {
      console.warn('Failed to mark teacher messages resolved:', e.message);
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
  getClassroomsForSchool,
  seedDefaultClassroomsForSchool,
  assignClassTeacher,
  unlockAttendanceForHeadteacher,
};
