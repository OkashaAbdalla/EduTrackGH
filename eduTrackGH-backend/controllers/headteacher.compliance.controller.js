/**
 * Headteacher Compliance Controller
 * GET /api/headteacher/compliance?date=YYYY-MM-DD
 */

const mongoose = require('mongoose');
const Classroom = require('../models/Classroom');
const DailyAttendance = require('../models/DailyAttendance');
const { getClassroomLevelFilter } = require('../services/headteacherService');
const { getEngine } = require('../services/calendarRuntime');

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
    const classroomById = new Map(classrooms.map((c) => [c._id.toString(), c]));

    // One calendar engine load + sync checks (avoids repeated async/DB cache work per teacher).
    const engine = await getEngine();

    const classroomIdStrings = new Set();
    teachers.forEach((t) => {
      t.classroomIds.forEach((cid) => classroomIdStrings.add(cid.toString()));
    });
    const uniqueObjectIds = [...classroomIdStrings].map((id) => new mongoose.Types.ObjectId(id));

    let allRecords = [];
    if (uniqueObjectIds.length > 0) {
      allRecords = await DailyAttendance.find({
        classroomId: { $in: uniqueObjectIds },
        date: dateOnly,
      })
        .sort({ markedAt: 1 })
        .lean();
    }

    const recordsByClassroom = new Map();
    for (const r of allRecords) {
      const k = r.classroomId.toString();
      if (!recordsByClassroom.has(k)) recordsByClassroom.set(k, []);
      recordsByClassroom.get(k).push(r);
    }

    const result = [];
    for (const t of teachers) {
      let schoolDayExpected = false;
      let schoolDayReason = null;
      for (const cid of t.classroomIds) {
        const cls = classroomById.get(cid.toString());
        if (!cls) continue;
        const level = cls.grade || cls.level || '';
        const decision = engine.getSchoolDayDecision(dateStr, level);
        if (decision.isSchoolDay) {
          schoolDayExpected = true;
          schoolDayReason = "school_day";
          break;
        }
        if (!schoolDayReason) schoolDayReason = decision.reason || "not_school_day";
      }

      const merged = [];
      for (const cid of t.classroomIds) {
        merged.push(...(recordsByClassroom.get(cid.toString()) || []));
      }
      merged.sort((a, b) => {
        const ta = a.markedAt ? new Date(a.markedAt).getTime() : new Date(a.date).getTime();
        const tb = b.markedAt ? new Date(b.markedAt).getTime() : new Date(b.date).getTime();
        return ta - tb;
      });

      const marked = merged.length > 0;
      const earliest = merged[0];
      const markedAt = marked && earliest?.markedAt ? new Date(earliest.markedAt).toISOString() : null;

      result.push({
        id: t.id,
        fullName: t.fullName,
        email: t.email,
        assignedClasses: t.assignedClasses,
        marked,
        markedAt,
        schoolDayExpected,
        schoolDayReason,
      });
    }

    res.json({ success: true, teachers: result });
  } catch (error) {
    console.error('getTeachersCompliance error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get compliance' });
  }
};

module.exports = { getTeachersCompliance };
