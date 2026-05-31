/**
 * Attendance service – mark daily attendance, notifications, locking, flags
 */

const Classroom = require("../models/Classroom");
const Student = require("../models/Student");
const DailyAttendance = require("../models/DailyAttendance");
const AttendanceFlag = require("../models/AttendanceFlag");
const { sendSms } = require("../utils/sendSms");
const { getSchoolDayDecision } = require("./calendarRuntime");
const {
  queueParentAttendanceAlert,
  dateToIso,
  handleAbsenceNotification,
} = require("./parentNotificationService");
const { approvedInClassroom } = require("../utils/studentQuery");
const School = require("../models/School");
const { haversineMeters, isGeoFenceActive } = require("../utils/geo");
const { validateAttendanceMarkingWindow } = require("../utils/attendanceDatePolicy");
const {
  getAttendanceSettings,
  getConfig,
  DEFAULT_GPS_SETTINGS,
  getNotificationSettingsFromSystem,
} = require("./adminConfigService");

function studentInClassroom(student, classroomId) {
  const cid = classroomId.toString();
  return student && (student.classroomId?.toString() === cid || student.classroom?.toString() === cid);
}

async function runFlagDetection(classroomId, schoolId, dateOnly, savedRecords) {
  try {
    const studentsInClass = await Student.find(approvedInClassroom(classroomId)).select("_id");
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
    const checkDates = [];
    for (let d = 0; d < 15; d++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - d);
      checkDate.setHours(0, 0, 0, 0);
      checkDates.push(checkDate);
    }

    const records = await DailyAttendance.find({
      classroomId,
      date: { $in: checkDates },
      studentId: { $in: studentIdsArr },
    })
      .select("date status")
      .lean();

    const dayPresentCounts = new Map();
    for (const r of records) {
      const d = new Date(r.date);
      d.setHours(0, 0, 0, 0);
      const key = d.getTime();
      if (!dayPresentCounts.has(key)) dayPresentCounts.set(key, 0);
      if (r.status === "present") dayPresentCounts.set(key, dayPresentCounts.get(key) + 1);
    }

    let consecutive100 = 0;
    for (const checkDate of checkDates) {
      const key = checkDate.getTime();
      const presentCount = dayPresentCounts.get(key) || 0;
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
async function markDailyAttendance({
  classroomId,
  date,
  attendanceData,
  teacherId,
  teacherLatitude,
  teacherLongitude,
  teacherAccuracy,
  geoAudit,
}) {
  const classroom = await Classroom.findById(classroomId).populate("schoolId");
  if (!classroom) throw { status: 404, message: "Classroom not found" };
  if (classroom.teacherId.toString() !== teacherId.toString()) throw { status: 403, message: "Unauthorized" };

  const schoolId = classroom.schoolId?._id || classroom.schoolId;

  const schoolDoc = await School.findById(schoolId).select("location").lean();
  const fenceLoc = schoolDoc?.location;
  const gpsPolicy = await getConfig("gps_settings", DEFAULT_GPS_SETTINGS);
  if (gpsPolicy?.gpsEnforced !== false && isGeoFenceActive(fenceLoc)) {
    const MAX_BUFFER_M = 10;
    const tLat = teacherLatitude != null ? Number(teacherLatitude) : NaN;
    const tLng = teacherLongitude != null ? Number(teacherLongitude) : NaN;
    const rawAccuracy = teacherAccuracy != null ? Number(teacherAccuracy) : 0;
    const accuracyBuffer = Number.isFinite(rawAccuracy) && rawAccuracy > 0 ? Math.min(rawAccuracy, MAX_BUFFER_M) : 0;
    const effectiveRadius = Number(fenceLoc.radius) + accuracyBuffer;
    if (!Number.isFinite(tLat) || !Number.isFinite(tLng)) {
      throw {
        status: 400,
        message: "Location is required to mark attendance. Enable location services and try again.",
        code: "GEO_REQUIRED",
      };
    }
    const dist = Math.abs(haversineMeters(tLat, tLng, fenceLoc.latitude, fenceLoc.longitude));
    const auditLine = {
      event: "attendance_geo_check",
      ok: dist <= effectiveRadius,
      ip: geoAudit?.ip || null,
      ts: new Date().toISOString(),
      teacherLat: tLat,
      teacherLng: tLng,
      accuracyM: Math.round(accuracyBuffer),
      distanceM: Math.round(dist),
      radiusM: fenceLoc.radius,
      effectiveRadiusM: Math.round(effectiveRadius),
    };
    if (dist > effectiveRadius) {
      console.warn("[geo-fence] outside allowed radius", JSON.stringify({ ...auditLine }));
      throw {
        status: 403,
        message: "You are outside the allowed school location",
        code: "GEO_OUTSIDE",
      };
    }
  }

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

  const classLevelRef = classroom.grade || classroom.level || "";
  const schoolDayDecision = await getSchoolDayDecision(dateOnly, classLevelRef);
  if (!schoolDayDecision.isSchoolDay) {
    const reasonToMessage = {
      weekend: "Attendance cannot be marked on Saturday or Sunday.",
      before_resumption: "Attendance cannot be marked before school resumption.",
      holiday: "Attendance cannot be marked on a holiday.",
      term_ended: "Attendance cannot be marked outside the active school term.",
      vacation: "Attendance cannot be marked during vacation.",
      bece: "Attendance cannot be marked during BECE days for this class.",
      invalid_date: "Invalid attendance date selected.",
    };
    throw {
      status: 400,
      message:
        reasonToMessage[schoolDayDecision.reason] ||
        "Attendance cannot be marked on this date based on GES calendar rules.",
      code: "INVALID_SCHOOL_DAY",
      reason: schoolDayDecision.reason,
    };
  }

  const attendanceSettings = await getAttendanceSettings();
  const windowCheck = validateAttendanceMarkingWindow(dateOnly, attendanceSettings);
  if (!windowCheck.ok) {
    throw {
      status: 400,
      message: windowCheck.message,
      code: windowCheck.code || "MARKING_WINDOW_CLOSED",
    };
  }

  // Early lock check: if any attendance for this classroom+date is locked, reject immediately.
  // Locked attendance remains locked until headteacher unlocks, regardless of day.
  const anyLocked = await DailyAttendance.findOne({ classroomId, date: dateOnly, isLocked: true });
  if (anyLocked) {
    throw { status: 403, message: "Attendance is locked for this date. Contact your headteacher to request an unlock." };
  }

  const savedRecords = [];
  const notifSettings = await getNotificationSettingsFromSystem();
  const smsEnabled = process.env.SMS_ENABLED === "true" && notifSettings.smsEnabled;
  const validStatuses = new Set(["present", "late", "absent"]);
  const candidateStudentIds = [
    ...new Set(
      (attendanceData || [])
        .map((row) => row?.studentId)
        .filter((id) => typeof id === "string" || id?.toString)
        .map((id) => id.toString())
    ),
  ];

  const [students, existingAttendanceRows] = await Promise.all([
    Student.find({ _id: { $in: candidateStudentIds } }),
    DailyAttendance.find({ classroomId, date: dateOnly, studentId: { $in: candidateStudentIds } }),
  ]);
  const studentsById = new Map(students.map((s) => [s._id.toString(), s]));
  const existingByStudentId = new Map(existingAttendanceRows.map((r) => [r.studentId.toString(), r]));

  for (const row of attendanceData) {
    const { studentId, status } = row;
    if (!studentId || !validStatuses.has(status)) continue;

    const student = studentsById.get(studentId.toString());
    if (!studentInClassroom(student, classroomId)) continue;
    if (student.isApproved === false) continue;

    let verificationType = row.verificationType;
    let manualReason = row.manualReason;
    let photoUrl = row.photoUrl || null;
    if (status === "present") {
      if (verificationType === "photo" && photoUrl) {
        manualReason = null;
      } else if (verificationType === "manual" && manualReason != null && String(manualReason).trim()) {
        photoUrl = null;
      } else {
        verificationType = null;
        manualReason = null;
        photoUrl = null;
      }
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

    const existing = existingByStudentId.get(studentId.toString());
    const previousStatus = existing?.status || null;
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
      existingByStudentId.set(studentId.toString(), existing);
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
      existingByStudentId.set(studentId.toString(), record);
    }

    if (status === "absent" || status === "late" || status === "present") {
      const msg =
        status === "absent"
          ? `${student.fullName} was absent from school on ${dateOnly.toLocaleDateString()}. - EduTrack GH`
          : status === "late"
          ? `${student.fullName} arrived late to school on ${dateOnly.toLocaleDateString()}. - EduTrack GH`
          : `${student.fullName} was present in school on ${dateOnly.toLocaleDateString()}. - EduTrack GH`;
      if (smsEnabled && student.parentPhone && (status === "absent" || status === "late")) {
        sendSms(student.parentPhone, msg)
          .then((r) => !r.success && console.warn("SMS failed", student.parentPhone, r.message))
          .catch((e) => console.warn("SMS error", student.parentPhone, e.message));
      }
      const normalizedIso = dateToIso(dateOnly);
      if (normalizedIso && status !== previousStatus) {
        queueParentAttendanceAlert({
          studentId,
          classroomId,
          schoolId,
          dateIso: normalizedIso,
          status,
        });
      }
      if (status === "absent" && status !== previousStatus) {
        handleAbsenceNotification({ studentId, classroomId, date: dateOnly }).catch((e) =>
          console.warn("handleAbsenceNotification error:", e.message)
        );
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

  const records = await DailyAttendance.find({ classroomId, date: dateOnly })
    .select("studentId status isLocked")
    .lean();
  const anyLocked = records.some((r) => r.isLocked);
  return {
    locked: !!anyLocked,
    hasExistingRecords: records.length > 0,
    recordCount: records.length,
  };
}

/**
 * Fetch saved attendance records for a classroom+date (teacher correction mode).
 */
async function getDailyAttendanceRecords({ classroomId, date, teacherId }) {
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

  const records = await DailyAttendance.find({ classroomId, date: dateOnly })
    .select("studentId status isLocked markedAt verificationType")
    .lean();

  return {
    records: records.map((r) => ({
      studentId: r.studentId.toString(),
      status: r.status,
      isLocked: !!r.isLocked,
      markedAt: r.markedAt,
      verificationType: r.verificationType || null,
    })),
    hasExistingRecords: records.length > 0,
    locked: records.some((r) => r.isLocked),
  };
}

module.exports = {
  markDailyAttendance,
  getAttendanceLockStatus,
  getDailyAttendanceRecords,
  runFlagDetection,
  studentInClassroom,
};
