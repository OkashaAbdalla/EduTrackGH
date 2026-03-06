/**
 * Admin – classrooms, attendance audit, flags, unlock
 */

const Classroom = require('../models/Classroom');
const DailyAttendance = require('../models/DailyAttendance');
const AttendanceFlag = require('../models/AttendanceFlag');

const getSchoolClassrooms = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const classrooms = await Classroom.find({ schoolId, isActive: true }).select('_id name grade').sort({ name: 1 });
    res.json({ success: true, classrooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get classrooms' });
  }
};

const getAttendanceAudit = async (req, res) => {
  try {
    const { schoolId, classroomId, date } = req.query;
    const query = {};
    if (schoolId) query.schoolId = schoolId;
    if (classroomId) query.classroomId = classroomId;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: d, $lte: dEnd };
    }
    const records = await DailyAttendance.find(query)
      .populate('studentId', 'fullName studentIdNumber')
      .populate('classroomId', 'name grade')
      .populate('schoolId', 'name')
      .sort({ date: -1, markedAt: -1 })
      .limit(500)
      .lean();
    const presentRecords = records.filter((r) => r.status === 'present');
    const photoVerified = presentRecords.filter((r) => r.verificationType === 'photo').length;
    const manualVerified = presentRecords.filter((r) => r.verificationType === 'manual').length;
    const totalPresent = presentRecords.length;
    const byDate = {};
    records.forEach((r) => {
      const d = r.date?.toISOString?.()?.split?.('T')?.[0] || 'unknown';
      if (!byDate[d]) byDate[d] = { present: 0, absent: 0, late: 0, total: 0 };
      byDate[d][r.status]++;
      byDate[d].total++;
    });
    const hundredPercentDays = Object.entries(byDate).filter(([_, v]) => v.total > 0 && v.present === v.total).length;
    res.json({
      success: true,
      records,
      summary: {
        totalRecords: records.length,
        photoVerifiedPct: totalPresent > 0 ? Math.round((photoVerified / totalPresent) * 100) : 0,
        manualVerifiedPct: totalPresent > 0 ? Math.round((manualVerified / totalPresent) * 100) : 0,
        hundredPercentPresentDays: hundredPercentDays,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get attendance audit' });
  }
};

const getAttendanceFlags = async (req, res) => {
  try {
    const { schoolId, resolved } = req.query;
    const query = {};
    if (schoolId) query.schoolId = schoolId;
    if (resolved !== undefined) query.isResolved = resolved === 'true';
    const flags = await AttendanceFlag.find(query)
      .populate('classroomId', 'name grade')
      .populate('schoolId', 'name')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json({ success: true, count: flags.length, flags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get attendance flags' });
  }
};

const unlockAttendance = async (req, res) => {
  try {
    const { classroomId, date } = req.params;
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const result = await DailyAttendance.updateMany({ classroomId, date: dateOnly }, { $set: { isLocked: false } });
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'No attendance records found for this classroom and date' });
    }
    res.json({ success: true, message: `Unlocked ${result.modifiedCount} attendance record(s)`, modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to unlock attendance' });
  }
};

module.exports = { getSchoolClassrooms, getAttendanceAudit, getAttendanceFlags, unlockAttendance };
