/**
 * Attendance service – mark daily attendance, notifications, locking, flags
 */

const User = require("../models/User");
const Classroom = require("../models/Classroom");
const Student = require("../models/Student");
const DailyAttendance = require("../models/DailyAttendance");
const AttendanceFlag = require("../models/AttendanceFlag");
const Notification = require("../models/Notification");
const { sendSms } = require("../utils/sendSms");
const { handleAbsenceNotification } = require("../services/emailService");

function studentInClassroom(student, classroomId) {
  const cid = classroomId.toString();
  return student && (student.classroomId?.toString() === cid || student.classroom?.toString() === cid);
}

async function runFlagDetection(classroomId, schoolId, dateOnly, savedRecords) {
  try {
    const studentsInClass = await Student.find({ $or: [{ classroomId }, { classroom: classroomId }] }).select("_id");
    const studentIdsArr = studentsInClass.map((s) => s._id);

    if (savedRecords.length >= 2) {
      const times = savedRecords.map((r) => r.markedAt?.getTime?.() ?? 0).filter(Boolean);
      if (times.length >= 2) {
        const minT = Math.min(...times);
        const maxT = Math.max(...times);
        if (maxT - minT < 60000) {
          await AttendanceFlag.findOneAndUpdate(
            { classroomId, date: dateOnly, flagType: "rapid_marking" },
            {
              $set: {
                classroomId,
                schoolId,
                date: dateOnly,
                flagType: "rapid_marking",
                details: `All ${savedRecords.length} records marked within ${Math.round((maxT - minT) / 1000)}s`,
                isResolved: false,
              },
            },
            { upsert: true, new: true }
          );
        }
      }
    }

    const today = new Date(dateOnly);
    let consecutive100 = 0;
    for (let d = 0; d < 15; d++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - d);
      checkDate.setHours(0, 0, 0, 0);
      const dayRecords = await DailyAttendance.find({
        classroomId,
        date: checkDate,
        studentId: { $in: studentIdsArr },
      });
      const presentCount = dayRecords.filter((r) => r.status === "present").length;
      if (studentIdsArr.length > 0 && presentCount === studentIdsArr.length) consecutive100++;
      else break;
    }
    if (consecutive100 >= 15) {
      await AttendanceFlag.findOneAndUpdate(
        { classroomId, date: dateOnly, flagType: "consecutive_100_present" },
        {
          $set: {
            classroomId,
            schoolId,
            date: dateOnly,
            flagType: "consecutive_100_present",
            details: `100% present for ${consecutive100} consecutive days`,
            isResolved: false,
          },
        },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    console.warn("AttendanceFlag check error:", err.message);
  }
}

/**
 * Mark daily attendance: save records, notify parents, lock, run flag detection.
 * @returns {{ savedRecords, locked: boolean }} or throws { status, message }
 */
async function markDailyAttendance({ classroomId, date, attendanceData, teacherId }) {
  const classroom = await Classroom.findById(classroomId).populate("schoolId");
  if (!classroom) throw { status: 404, message: "Classroom not found" };
  if (classroom.teacherId.toString() !== teacherId.toString()) throw { status: 403, message: "Unauthorized" };

  const schoolId = classroom.schoolId?._id || classroom.schoolId;

  // Normalize the incoming date so that the stored calendar day
  // exactly matches what the teacher selected, regardless of server timezone.
  let dateOnly;
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-").map((v) => parseInt(v, 10));
    dateOnly = new Date(Date.UTC(y, m - 1, d));
  } else {
    dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);
  }

  // Early lock check: if any attendance for this classroom+date is locked, reject immediately.
  // Locked attendance remains locked until headteacher unlocks, regardless of day.
  const anyLocked = await DailyAttendance.findOne({ classroomId, date: dateOnly, isLocked: true });
  if (anyLocked) {
    throw { status: 403, message: "Attendance is locked for this date. Contact your headteacher to request an unlock." };
  }

  const savedRecords = [];
  const smsEnabled = process.env.SMS_ENABLED === "true";

  for (const row of attendanceData) {
    const { studentId, status } = row;
    if (!studentId || !["present", "late", "absent"].includes(status)) continue;

    const student = await Student.findById(studentId);
    if (!studentInClassroom(student, classroomId)) continue;

    let verificationType = row.verificationType;
    let manualReason = row.manualReason;
    let photoUrl = row.photoUrl || null;
    if (status === "present") {
      if (!verificationType) {
        verificationType = "manual";
        manualReason = manualReason != null && String(manualReason).trim() ? manualReason : "Legacy entry";
      }
      if (verificationType === "photo" && photoUrl) manualReason = null;
    } else {
      verificationType = "manual";
      manualReason = null;
      photoUrl = null;
    }
    const markedAt = row.markedAt ? new Date(row.markedAt) : new Date();
    const location =
      row.location && (row.location.latitude != null || row.location.longitude != null)
        ? { latitude: row.location.latitude, longitude: row.location.longitude }
        : undefined;

    const existing = await DailyAttendance.findOne({ classroomId, date: dateOnly, studentId });
    if (existing) {
      if (existing.isLocked) throw { status: 403, message: "Attendance is locked for this classroom and date. Contact admin to unlock." };
      existing.status = status;
      existing.photoUrl = photoUrl;
      existing.verificationType = verificationType;
      existing.manualReason = manualReason;
      existing.markedAt = markedAt;
      if (location) existing.location = location;
      await existing.save();
      savedRecords.push(existing);
    } else {
      const record = await DailyAttendance.create({
        classroomId,
        schoolId,
        date: dateOnly,
        studentId,
        status,
        markedBy: teacherId,
        photoUrl,
        verificationType,
        manualReason,
        markedAt,
        location,
      });
      savedRecords.push(record);
    }

    if (status === "absent" || status === "late") {
      const parent = await User.findOne({ role: "parent", children: studentId });
      const msg =
        status === "absent"
          ? `${student.fullName} was absent from school on ${dateOnly.toLocaleDateString()}. - EduTrack GH`
          : `${student.fullName} arrived late to school on ${dateOnly.toLocaleDateString()}. - EduTrack GH`;
      if (parent) {
        await Notification.create({
          parentId: parent._id,
          studentId,
          type: status === "absent" ? "absence" : "late",
          message: msg,
          channel: "sms",
          date: dateOnly,
        });
        if (smsEnabled && student.parentPhone) {
          sendSms(student.parentPhone, msg).then((r) => !r.success && console.warn("SMS failed", student.parentPhone, r.message)).catch((e) => console.warn("SMS error", student.parentPhone, e.message));
        }
        if (status === "absent") {
          handleAbsenceNotification({ studentId, classroomId, date: dateOnly }).catch((e) => console.warn("handleAbsenceNotification error:", e.message));
        }
      }
    }
  }

  if (savedRecords.length > 0) {
    await DailyAttendance.updateMany({ classroomId, date: dateOnly }, { $set: { isLocked: true } });
  }

  runFlagDetection(classroomId, schoolId, dateOnly, savedRecords).catch(() => {});

  return { savedRecords, schoolId };
}

/**
 * Check if attendance for a classroom+date is locked.
 * Used by frontend to block marking form before teacher starts.
 */
async function getAttendanceLockStatus({ classroomId, date, teacherId }) {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) throw { status: 404, message: "Classroom not found" };
  if (classroom.teacherId.toString() !== teacherId.toString()) throw { status: 403, message: "Unauthorized" };

  let dateOnly;
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-").map((v) => parseInt(v, 10));
    dateOnly = new Date(Date.UTC(y, m - 1, d));
  } else {
    dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);
  }

  const anyLocked = await DailyAttendance.findOne({ classroomId, date: dateOnly, isLocked: true });
  return { locked: !!anyLocked };
}

module.exports = { markDailyAttendance, getAttendanceLockStatus, runFlagDetection, studentInClassroom };
