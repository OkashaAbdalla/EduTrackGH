/**
 * Headteacher in-app notifications — unmarked attendance alerts
 */

const mongoose = require('mongoose');
const Classroom = require('../models/Classroom');
const DailyAttendance = require('../models/DailyAttendance');
const HeadteacherNotification = require('../models/HeadteacherNotification');
const { getClassroomLevelFilter } = require('./headteacherService');
const { getEngine } = require('./calendarRuntime');
const { emitHeadteacherNotification } = require('../utils/socketServer');
const { getNotificationsForUser: getStaffNotificationsForUser, markAllNotificationsRead: markAllStaffRead } = require('./staffNotificationService');

function getDateOnlyUtc(dateStr) {
  const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
  return new Date(Date.UTC(y, m - 1, d));
}

function getTodayIsoUtc() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

async function buildComplianceRows(headteacher) {
  const schoolId = headteacher.school || headteacher.schoolId;
  if (!schoolId) return [];

  const dateStr = getTodayIsoUtc();
  const dateOnly = getDateOnlyUtc(dateStr);
  const levelFilter = getClassroomLevelFilter(headteacher.schoolLevel);

  const classrooms = await Classroom.find({ schoolId, teacherId: { $ne: null }, ...levelFilter })
    .populate('teacherId', 'fullName email')
    .select('name teacherId grade level');

  const teacherMap = new Map();
  for (const c of classrooms) {
    if (!c.teacherId) continue;
    const tid = c.teacherId._id.toString();
    if (!teacherMap.has(tid)) {
      teacherMap.set(tid, {
        id: c.teacherId._id,
        fullName: c.teacherId.fullName,
        classroomIds: [],
      });
    }
    teacherMap.get(tid).classroomIds.push(c._id);
  }

  const teachers = Array.from(teacherMap.values());
  const classroomById = new Map(classrooms.map((c) => [c._id.toString(), c]));
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
    }).lean();
  }

  const recordsByClassroom = new Map();
  for (const r of allRecords) {
    const k = r.classroomId.toString();
    if (!recordsByClassroom.has(k)) recordsByClassroom.set(k, []);
    recordsByClassroom.get(k).push(r);
  }

  const rows = [];
  for (const t of teachers) {
    let schoolDayExpected = false;
    for (const cid of t.classroomIds) {
      const cls = classroomById.get(cid.toString());
      if (!cls) continue;
      const level = cls.grade || cls.level || '';
      const decision = engine.getSchoolDayDecision(dateStr, level);
      if (decision.isSchoolDay) {
        schoolDayExpected = true;
        break;
      }
    }

    const merged = [];
    for (const cid of t.classroomIds) {
      merged.push(...(recordsByClassroom.get(cid.toString()) || []));
    }

    rows.push({
      teacherId: t.id,
      fullName: t.fullName,
      marked: merged.length > 0,
      schoolDayExpected,
    });
  }

  return { rows, dateStr, dateOnly, schoolId };
}

async function syncUnmarkedNotifications(headteacher) {
  const headteacherId = headteacher._id;
  const { rows, dateStr, dateOnly, schoolId } = await buildComplianceRows(headteacher);
  if (!schoolId) return { created: 0 };

  const applicable = rows.filter((r) => r.schoolDayExpected);
  const unmarked = applicable.filter((r) => !r.marked);
  const markedIds = new Set(applicable.filter((r) => r.marked).map((r) => r.teacherId.toString()));

  let created = 0;

  for (const t of unmarked) {
    const message = `${t.fullName}: Unmarked`;
    const existing = await HeadteacherNotification.findOne({
      headteacherId,
      teacherId: t.teacherId,
      date: dateOnly,
      type: 'unmarked_attendance',
    });

    if (!existing) {
      await HeadteacherNotification.create({
        headteacherId,
        schoolId,
        teacherId: t.teacherId,
        teacherName: t.fullName,
        type: 'unmarked_attendance',
        message,
        date: dateOnly,
        read: false,
      });
      created += 1;
      emitHeadteacherNotification({
        headteacherId: headteacherId.toString(),
        type: 'unmarked_attendance',
        teacherName: t.fullName,
        date: dateStr,
      });
    }
  }

  if (markedIds.size > 0) {
    await HeadteacherNotification.deleteMany({
      headteacherId,
      date: dateOnly,
      type: 'unmarked_attendance',
      teacherId: { $in: [...markedIds] },
    });
  }

  if (applicable.length === 0) {
    await HeadteacherNotification.deleteMany({
      headteacherId,
      date: dateOnly,
      type: 'unmarked_attendance',
    });
  }

  return { created };
}

async function getNotificationsForHeadteacher(headteacher) {
  await syncUnmarkedNotifications(headteacher);
  const headteacherId = headteacher._id;

  const [complianceRows, complianceUnread, staffBundle] = await Promise.all([
    HeadteacherNotification.find({ headteacherId }).sort({ createdAt: -1 }).limit(100).lean(),
    HeadteacherNotification.countDocuments({ headteacherId, read: false }),
    getStaffNotificationsForUser(headteacherId),
  ]);

  const complianceList = complianceRows.map((n) => ({
    id: n._id,
    source: 'compliance',
    type: n.type,
    teacherName: n.teacherName,
    message: n.message,
    date: n.date.toISOString().split('T')[0],
    read: n.read,
    createdAt: n.createdAt,
  }));

  const merged = [...complianceList, ...staffBundle.notifications]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 100);

  const unreadCount = complianceUnread + staffBundle.unreadCount;

  return { notifications: merged, unreadCount };
}

async function markNotificationRead(headteacherId, notificationId) {
  const notif = await HeadteacherNotification.findOne({ _id: notificationId, headteacherId });
  if (!notif) return null;
  notif.read = true;
  await notif.save();
  return notif;
}

async function markAllNotificationsRead(headteacherId) {
  await HeadteacherNotification.updateMany({ headteacherId, read: false }, { $set: { read: true } });
  await markAllStaffRead(headteacherId);
}

async function clearUnmarkedOnTeacherMark({ schoolId, teacherId, dateStr }) {
  if (!schoolId || !teacherId || !dateStr) return;
  const dateOnly = getDateOnlyUtc(dateStr);
  await HeadteacherNotification.deleteMany({
    schoolId,
    teacherId,
    date: dateOnly,
    type: 'unmarked_attendance',
  });
}

module.exports = {
  syncUnmarkedNotifications,
  getNotificationsForHeadteacher,
  markNotificationRead,
  markAllNotificationsRead,
  clearUnmarkedOnTeacherMark,
};
