/**
 * Attendance Controller (Under 130 lines)
 */

const Attendance = require("../models/Attendance");
const Session = require("../models/Session");
const User = require("../models/User");
const Classroom = require("../models/Classroom");
const Student = require("../models/Student");

const markAttendance = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await Session.findById(sessionId);

    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    if (!session.isActive)
      return res
        .status(400)
        .json({ success: false, message: "Session not active" });
    if (session.isExpired())
      return res
        .status(400)
        .json({ success: false, message: "Session expired" });

    const existingAttendance = await Attendance.findOne({
      sessionId,
      studentId: req.user._id,
    });
    if (existingAttendance) {
      return res
        .status(400)
        .json({ success: false, message: "Attendance already marked" });
    }

    const timeDiff = (new Date() - session.startTime) / 60000;
    let status = "present";
    if (timeDiff > 15 && timeDiff <= 30) status = "late";
    else if (timeDiff > 30) status = "absent";

    const attendance = await Attendance.create({
      sessionId,
      studentId: req.user._id,
      studentName: req.user.fullName,
      studentIdNumber: req.user.studentId,
      status,
      markedBy: "student",
    });

    session.totalAttendees += 1;
    await session.save();

    res
      .status(201)
      .json({ success: true, message: "Attendance marked", attendance });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to mark attendance" });
  }
};

const getAttendanceHistory = async (req, res) => {
  try {
    const records = await Attendance.find({ studentId: req.user._id })
      .populate("sessionId", "courseName courseCode startTime")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: records.length, records });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get history" });
  }
};

const getSessionAttendees = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);

    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    if (session.lecturerId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const attendees = await Attendance.find({ sessionId })
      .populate("studentId", "fullName email studentId")
      .sort({ timeMarked: 1 });

    const stats = {
      total: attendees.length,
      present: attendees.filter((a) => a.status === "present").length,
      late: attendees.filter((a) => a.status === "late").length,
      absent: attendees.filter((a) => a.status === "absent").length,
    };

    res.json({ success: true, stats, attendees });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to get attendees" });
  }
};

const exportAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);

    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    if (session.lecturerId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const attendees = await Attendance.find({ sessionId })
      .populate("studentId", "fullName email studentId")
      .sort({ timeMarked: 1 });

    let csv = "Student Name,Student ID,Email,Time Marked,Status,Confidence\n";
    attendees.forEach((record) => {
      const student = record.studentId;
      const conf = record.confidence
        ? (record.confidence * 100).toFixed(0) + "%"
        : "N/A";
      csv += `"${record.studentName}","${record.studentIdNumber}","${student.email}","${record.timeMarked.toLocaleString()}","${record.status}","${conf}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendance_${session.courseCode}_${Date.now()}.csv"`,
    );
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to export" });
  }
};

const enrollFace = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.hasFaceEnrolled = true;
    await user.save();
    res.json({
      success: true,
      message: "Face enrolled (placeholder for Python integration)",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to enroll face" });
  }
};

// Get attendance history for a classroom (teachers only)
const getClassroomAttendanceHistory = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const teacherId = req.user._id;
    const { month } = req.query;

    // Verify teacher owns this classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res
        .status(404)
        .json({ success: false, message: "Classroom not found" });
    }

    if (classroom.teacherId.toString() !== teacherId.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Unauthorized access to this classroom",
        });
    }

    // Get all students in the classroom
    const students = await Student.find({ classroomId }).select("_id");
    const studentIds = students.map((s) => s._id);

    // Build date range if month provided
    let query = { studentId: { $in: studentIds } };
    if (month) {
      const [year, monthNum] = month.split("-");
      const startDate = new Date(year, parseInt(monthNum) - 1, 1);
      const endDate = new Date(year, parseInt(monthNum), 0, 23, 59, 59);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    // Get attendance records
    const records = await Attendance.find(query)
      .populate("studentId", "fullName studentIdNumber")
      .sort({ createdAt: -1 });

    // Group by date and calculate stats
    const recordsByDate = {};
    records.forEach((record) => {
      const dateStr = record.createdAt.toISOString().split("T")[0];
      if (!recordsByDate[dateStr]) {
        recordsByDate[dateStr] = {
          date: dateStr,
          present: 0,
          absent: 0,
          late: 0,
          total: studentIds.length,
        };
      }
      recordsByDate[dateStr][record.status]++;
    });

    const groupedRecords = Object.values(recordsByDate).sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );

    res.json({
      success: true,
      classroomId,
      classroomName: classroom.name,
      records: groupedRecords,
      totalStudents: studentIds.length,
    });
  } catch (error) {
    console.error("Error getting classroom attendance:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get attendance history" });
  }
};

module.exports = {
  markAttendance,
  getAttendanceHistory,
  getSessionAttendees,
  exportAttendance,
  enrollFace,
  getClassroomAttendanceHistory,
};
