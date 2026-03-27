/**
 * Attendance – history, flagged students, photo upload
 */

const Classroom = require("../models/Classroom");
const Student = require("../models/Student");
const DailyAttendance = require("../models/DailyAttendance");
const { uploadAttendancePhoto } = require("../utils/cloudinary");

const getClassroomDailyHistory = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const teacherId = req.user._id;
    const { month } = req.query;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) return res.status(404).json({ success: false, message: "Classroom not found" });
    if (classroom.teacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const students = await Student.find({ $or: [{ classroomId }, { classroom: classroomId }] }).select("_id");
    const studentIds = students.map((s) => s._id);

    let query = { classroomId, studentId: { $in: studentIds } };
    if (month) {
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

    res.json({
      success: true,
      classroomId,
      classroomName: classroom.name,
      records: grouped,
      totalStudents: studentIds.length,
    });
  } catch (error) {
    console.error("getClassroomDailyHistory error:", error);
    res.status(500).json({ success: false, message: "Failed to get attendance history" });
  }
};

const getFlaggedStudentsForClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const teacherId = req.user._id;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) return res.status(404).json({ success: false, message: "Classroom not found" });
    if (classroom.teacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const students = await Student.find({ $or: [{ classroomId }, { classroom: classroomId }] }).select("_id fullName studentId gender");
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

    const threshold = 3;
    const flagged = students
      .map((s) => {
        const agg = byStudent[String(s._id)] || { total: 0, absences: 0, lastAbsent: null };
        if (agg.absences >= threshold && agg.total > 0) {
          const rate = Math.round(((agg.total - agg.absences) / agg.total) * 100);
          return { id: s._id, name: s.fullName, studentId: s.studentId, gender: s.gender, absences: agg.absences, rate, lastAbsent: agg.lastAbsent };
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
  getClassroomDailyHistory,
  getFlaggedStudentsForClassroom,
  uploadPhoto,
  deleteAttendanceWeek,
};
