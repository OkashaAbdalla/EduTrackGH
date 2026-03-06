/**
 * Attendance – mark daily (thin controller)
 */

const { markDailyAttendance: markDaily } = require("../services/attendanceService");

const markDailyAttendance = async (req, res) => {
  try {
    const { classroomId, date, attendanceData } = req.body;
    const teacherId = req.user._id;

    if (!classroomId || !date || !Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "classroomId, date, and attendanceData (array) are required",
      });
    }

    const { savedRecords } = await markDaily({
      classroomId,
      date,
      attendanceData,
      teacherId,
    });

    return res.status(201).json({
      success: true,
      message: "Attendance saved",
      count: savedRecords.length,
    });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Failed to save attendance";
    if (status === 500) console.error("markDailyAttendance error:", error);
    return res.status(status).json({ success: false, message });
  }
};

module.exports = { markDailyAttendance };
