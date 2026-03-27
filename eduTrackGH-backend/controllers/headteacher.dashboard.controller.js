/**
 * Headteacher Dashboard Controller
 * GET /api/headteacher/dashboard-stats
 *
 * Computes lightweight summary stats for the logged-in headteacher's scope
 * (school + section/level).
 */
const Classroom = require('../models/Classroom');
const Student = require('../models/Student');
const DailyAttendance = require('../models/DailyAttendance');
const { getClassroomLevelFilter } = require('../services/headteacherService');

function getSchoolId(req) {
  return req.user?.school || null;
}

function getMonthRangeUtc(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(now);
  return { start, end };
}

function getDateOnlyUtc(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const getDashboardStats = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }

    const levelFilter = getClassroomLevelFilter(req.user.schoolLevel);
    const classrooms = await Classroom.find({ schoolId, isActive: true, ...levelFilter }).select('_id teacherId');
    const classroomIds = classrooms.map((c) => c._id);

    if (classroomIds.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalStudents: 0,
          attendanceRate: 0,
          teachersCompliant: 0,
          teachersAssigned: 0,
          flaggedStudents: 0,
        },
      });
    }

    const [totalStudents, flaggedStudents] = await Promise.all([
      Student.countDocuments({ classroomId: { $in: classroomIds }, isActive: true }),
      Student.countDocuments({ classroomId: { $in: classroomIds }, isActive: true, isFlagged: true }),
    ]);

    const { start, end } = getMonthRangeUtc();
    const [presentCount, distinctDates] = await Promise.all([
      DailyAttendance.countDocuments({
        classroomId: { $in: classroomIds },
        date: { $gte: start, $lte: end },
        status: 'present',
      }),
      DailyAttendance.distinct('date', {
        classroomId: { $in: classroomIds },
        date: { $gte: start, $lte: end },
      }),
    ]);
    const daysMarked = Math.max(distinctDates.length, 1);
    const expected = totalStudents * daysMarked;
    const attendanceRate = expected > 0 ? Math.round((presentCount / expected) * 100) : 0;

    const todayOnly = getDateOnlyUtc();
    const [teachersAssigned, classroomsMarkedToday] = await Promise.all([
      Classroom.distinct('teacherId', { schoolId, teacherId: { $ne: null }, ...levelFilter }),
      DailyAttendance.distinct('classroomId', { classroomId: { $in: classroomIds }, date: todayOnly }),
    ]);
    const teachersCompliant = classroomsMarkedToday.length
      ? (await Classroom.distinct('teacherId', { _id: { $in: classroomsMarkedToday }, teacherId: { $ne: null } })).length
      : 0;

    return res.json({
      success: true,
      stats: {
        totalStudents,
        attendanceRate,
        teachersCompliant,
        teachersAssigned: teachersAssigned.length,
        flaggedStudents,
      },
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to load dashboard stats' });
  }
};

module.exports = { getDashboardStats };
