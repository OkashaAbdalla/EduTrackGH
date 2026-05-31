/**
 * Attendance – history, flagged students, photo upload
 */

const mongoose = require("mongoose");
const Classroom = require("../models/Classroom");
const Student = require("../models/Student");
const DailyAttendance = require("../models/DailyAttendance");
const { uploadAttendancePhoto } = require("../utils/cloudinary");
const { getTermDateRange } = require("../services/calendarRuntime");
const { approvedInClassroom } = require("../utils/studentQuery");

/** Shared register/history payload for a classroom (no auth). */
async function buildClassroomDailyHistory(classroomId, { month, term } = {}) {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) {
    return { error: { status: 404, message: "Classroom not found" } };
  }

  const students = await Student.find(approvedInClassroom(classroomId))
      .select("_id fullName studentId studentIdNumber")
      .sort({ fullName: 1 });
    const studentIds = students.map((s) => s._id);

    let query = { classroomId, studentId: { $in: studentIds } };
    const termUpper = typeof term === "string" ? term.trim().toUpperCase() : "";
    if (termUpper === "TERM_1" || termUpper === "TERM_2" || termUpper === "TERM_3") {
      const range = await getTermDateRange(termUpper);
      if (range) {
        const start = new Date(`${range.start}T00:00:00.000Z`);
        const end = new Date(`${range.end}T23:59:59.999Z`);
        query.date = { $gte: start, $lte: end };
      }
    } else if (month) {
      const [y, m] = month.split("-");
      const start = new Date(parseInt(y), parseInt(m, 10) - 1, 1);
      const end = new Date(parseInt(y), parseInt(m, 10), 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }

    const records = await DailyAttendance.find(query)
      .populate("studentId", "fullName studentIdNumber")
      .sort({ date: -1, markedAt: -1 });

    // For each date+student, keep only the latest record (handles unlock + re-mark)
    const latestPerStudentPerDate = {};
    records.forEach((r) => {
      const d = r.date.toISOString().split("T")[0];
      const key = `${d}:${String(r.studentId?._id || r.studentId)}`;
      const current = latestPerStudentPerDate[key];
      const currentTime =
        current?.markedAt instanceof Date ? current.markedAt.getTime() : current?.date?.getTime?.() ?? 0;
      const thisTime = r.markedAt instanceof Date ? r.markedAt.getTime() : r.date.getTime();
      if (!current || thisTime >= currentTime) {
        latestPerStudentPerDate[key] = r;
      }
    });

    const byDate = {};
    Object.values(latestPerStudentPerDate).forEach((r) => {
      const d = r.date.toISOString().split("T")[0];
      if (!byDate[d]) byDate[d] = { date: d, present: 0, absent: 0, late: 0, total: studentIds.length };
      byDate[d][r.status]++;
    });
    const grouped = Object.values(byDate).sort((a, b) => new Date(b.date) - new Date(a.date));

    const entries = Object.values(latestPerStudentPerDate).map((r) => ({
      date: r.date.toISOString().split("T")[0],
      studentId: String(r.studentId?._id || r.studentId),
      status: r.status, // present | absent | late
    }));

    const historyRows = students.map((s) => {
      const sid = String(s._id);
      const dailyRecords = entries
        .filter((e) => e.studentId === sid)
        .map((e) => ({ date: e.date, status: e.status }));

      let present = 0;
      let absent = 0;
      let late = 0;
      dailyRecords.forEach((r) => {
        if (r.status === "present") present += 1;
        else if (r.status === "absent") absent += 1;
        else if (r.status === "late") late += 1;
      });

      return {
        studentId: sid,
        name: s.fullName,
        rollNumber: s.studentId || s.studentIdNumber || "",
        dailyRecords,
        weeklyTotals: [], // computed on frontend based on selected month weekdays grouping
        monthlyTotals: { present, absent, late },
      };
    });

  return {
    success: true,
    classroomId,
    classroomName: classroom.name,
    records: grouped,
    students: students.map((s) => ({
      id: String(s._id),
      name: s.fullName,
      rollNumber: s.studentId || s.studentIdNumber || "",
    })),
    entries,
    historyRows,
    totalStudents: studentIds.length,
  };
}

const getClassroomDailyHistory = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const teacherId = req.user._id;
    const { month, term } = req.query;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) return res.status(404).json({ success: false, message: "Classroom not found" });
    if (!classroom.teacherId || classroom.teacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const payload = await buildClassroomDailyHistory(classroomId, { month, term });
    if (payload.error) {
      return res.status(payload.error.status).json({ success: false, message: payload.error.message });
    }
    res.json(payload);
  } catch (error) {
    console.error("getClassroomDailyHistory error:", error);
    res.status(500).json({ success: false, message: "Failed to get attendance history" });
  }
};

/** Headteacher: view class register for any classroom in their school */
const getClassroomRegisterHistoryForHeadteacher = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const headteacherSchoolId = req.user?.school || req.user?.schoolId;
    const { month, term } = req.query;

    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      return res.status(400).json({ success: false, message: "Invalid classroom id" });
    }

    if (!headteacherSchoolId) {
      return res.status(400).json({ success: false, message: "No school assigned to your account" });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) return res.status(404).json({ success: false, message: "Classroom not found" });

    const classroomSchoolId = classroom.schoolId?._id || classroom.schoolId;
    if (String(classroomSchoolId) !== String(headteacherSchoolId)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const payload = await buildClassroomDailyHistory(classroomId, { month, term });
    if (payload.error) {
      return res.status(payload.error.status).json({ success: false, message: payload.error.message });
    }
    res.json(payload);
  } catch (error) {
    console.error("getClassroomRegisterHistoryForHeadteacher error:", error);
    res.status(500).json({ success: false, message: "Failed to get class register" });
  }
};

const { getAttendanceSettings } = require("../services/adminConfigService");

const getFlaggedStudentsForClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const teacherId = req.user._id;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) return res.status(404).json({ success: false, message: "Classroom not found" });
    if (classroom.teacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const students = await Student.find(approvedInClassroom(classroomId)).select("_id fullName studentId gender");
    const studentIds = students.map((s) => s._id);

    if (studentIds.length === 0) return res.json({ success: true, flagged: [] });

    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);

    const records = await DailyAttendance.find({
      classroomId,
      studentId: { $in: studentIds },
      date: { $gte: start, $lte: today },
    }).lean();

    const byStudent = {};
    records.forEach((r) => {
      const key = String(r.studentId);
      if (!byStudent[key]) byStudent[key] = { total: 0, absences: 0, lastAbsent: null };
      byStudent[key].total++;
      if (r.status === "absent") {
        byStudent[key].absences++;
        const d = r.date instanceof Date ? r.date : new Date(r.date);
        if (!byStudent[key].lastAbsent || d > byStudent[key].lastAbsent) byStudent[key].lastAbsent = d;
      }
    });

    const attendanceSettings = await getAttendanceSettings();
    const consecutiveThreshold = Number(attendanceSettings?.chronicAbsenteeismThreshold) || 3;
    const pctThreshold = Number(attendanceSettings?.absenteeismPercentageThreshold) || 10;

    const flagged = students
      .map((s) => {
        const agg = byStudent[String(s._id)] || { total: 0, absences: 0, lastAbsent: null };
        if (agg.total <= 0) return null;
        const absenceRate = Math.round((agg.absences / agg.total) * 100);
        const attendanceRate = 100 - absenceRate;
        const byConsecutive = agg.absences >= consecutiveThreshold;
        const byPercentage = absenceRate >= pctThreshold;
        if (byConsecutive || byPercentage) {
          return {
            id: s._id,
            name: s.fullName,
            studentId: s.studentId,
            gender: s.gender,
            absences: agg.absences,
            rate: attendanceRate,
            lastAbsent: agg.lastAbsent,
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b.absences - a.absences);

    res.json({ success: true, flagged });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to get flagged students" });
  }
};

const uploadPhoto = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, message: "image (base64) is required" });
    const result = await uploadAttendancePhoto(image);
    if (!result.success) return res.status(400).json({ success: false, message: result.message });
    res.json({ success: true, photoUrl: result.url });
  } catch (error) {
    console.error("uploadPhoto error:", error);
    res.status(500).json({ success: false, message: "Failed to upload photo" });
  }
};

// Teacher: delete a whole week of attendance for their classroom (weekStartDate = YYYY-MM-DD)
const deleteAttendanceWeek = async (req, res) => {
  try {
    const { classroomId, weekStartDate } = req.params;
    const teacherId = req.user._id;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) return res.status(404).json({ success: false, message: "Classroom not found" });
    if (classroom.teacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (!weekStartDate || !/^\d{4}-\d{2}-\d{2}$/.test(weekStartDate)) {
      return res.status(400).json({ success: false, message: "weekStartDate (YYYY-MM-DD) is required" });
    }

    const [y, m, d] = weekStartDate.split("-").map((v) => parseInt(v, 10));
    const start = new Date(Date.UTC(y, m - 1, d));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);

    const result = await DailyAttendance.deleteMany({
      classroomId,
      date: { $gte: start, $lte: end },
    });

    return res.json({
      success: true,
      message: `Deleted ${result.deletedCount} attendance record(s) for the week`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("deleteAttendanceWeek error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete attendance week" });
  }
};

module.exports = {
  buildClassroomDailyHistory,
  getClassroomDailyHistory,
  getClassroomRegisterHistoryForHeadteacher,
  getFlaggedStudentsForClassroom,
  uploadPhoto,
  deleteAttendanceWeek,
};
