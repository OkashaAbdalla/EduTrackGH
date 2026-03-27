/**
 * Headteacher Compliance Controller
 * GET /api/headteacher/compliance?date=YYYY-MM-DD
 */

const Classroom = require('../models/Classroom');
const DailyAttendance = require('../models/DailyAttendance');
const { getClassroomLevelFilter } = require('../services/headteacherService');

function getSchoolId(req) {
  return req.user?.school || null;
}

const getTeachersCompliance = async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'No school assigned to your account' });
    }

    const dateStr = req.query.date;
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({ success: false, message: 'Valid date (YYYY-MM-DD) is required' });
    }

    const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
    const dateOnly = new Date(Date.UTC(y, m - 1, d));

    const levelFilter = getClassroomLevelFilter(req.user.schoolLevel);
    const classrooms = await Classroom.find({ schoolId, teacherId: { $ne: null }, ...levelFilter })
      .populate('teacherId', 'fullName email')
      .select('name teacherId');

    const teacherMap = new Map();
    for (const c of classrooms) {
      if (!c.teacherId) continue;
      const tid = c.teacherId._id.toString();
      if (!teacherMap.has(tid)) {
        teacherMap.set(tid, {
          id: c.teacherId._id,
          fullName: c.teacherId.fullName,
          email: c.teacherId.email,
          assignedClasses: [],
          classroomIds: [],
        });
      }
      const t = teacherMap.get(tid);
      if (!t.assignedClasses.includes(c.name)) t.assignedClasses.push(c.name);
      t.classroomIds.push(c._id);
    }

    const teachers = Array.from(teacherMap.values());
    const result = [];

    for (const t of teachers) {
      const attendanceForDate = await DailyAttendance.find({
        classroomId: { $in: t.classroomIds },
        date: dateOnly,
      }).sort({ markedAt: 1 });

      const marked = attendanceForDate.length > 0;
      const earliest = attendanceForDate[0];
      const markedAt = marked && earliest?.markedAt ? earliest.markedAt.toISOString() : null;

      result.push({
        id: t.id,
        fullName: t.fullName,
        email: t.email,
        assignedClasses: t.assignedClasses,
        marked,
        markedAt,
      });
    }

    res.json({ success: true, teachers: result });
  } catch (error) {
    console.error('getTeachersCompliance error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get compliance' });
  }
};

module.exports = { getTeachersCompliance };
