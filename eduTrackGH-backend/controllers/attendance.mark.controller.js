/**
 * Attendance – mark daily, lock status (thin controller)
 */

const { markDailyAttendance: markDaily, getAttendanceLockStatus } = require("../services/attendanceService");
const { emitAttendanceSubmitted, emitComplianceUpdated } = require("../utils/socketServer");

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

    // Hard guard: attendance cannot be marked on weekends.
    const dateObj = new Date(`${date}T00:00:00Z`);
    const dayOfWeek = dateObj.getUTCDay(); // 0 = Sun, 6 = Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({
        success: false,
        message: "Attendance cannot be marked on Saturday or Sunday",
      });
    }

    const { savedRecords, schoolId } = await markDaily({
      classroomId,
      date,
      attendanceData,
      teacherId,
    });

    const schoolIdStr = schoolId?.toString?.();
    if (schoolIdStr) {
      emitAttendanceSubmitted({ schoolId: schoolIdStr, date, classroomId, teacherId });
      emitComplianceUpdated({ schoolId: schoolIdStr, date });
    }

    return res.status(201).json({
      success: true,
      message: "Attendance saved",
      count: savedRecords.length,
    });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Failed to save attendance";
    if (status === 500) console.error("markDailyAttendance error:", error);
    const payload = { success: false, message };
    if (error.code) payload.error = error.code;
    return res.status(status).json(payload);
  }
};

const getLockStatus = async (req, res) => {
  try {
    const { classroomId, date } = req.params;
    const teacherId = req.user._id;
    if (!classroomId || !date) {
      return res.status(400).json({ success: false, message: "classroomId and date are required" });
    }
    const { locked } = await getAttendanceLockStatus({ classroomId, date, teacherId });
    return res.json({ success: true, locked });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Failed to check lock status";
    if (status === 500) console.error("getLockStatus error:", error);
    return res.status(status).json({ success: false, message });
  }
};

module.exports = { markDailyAttendance, getLockStatus };
