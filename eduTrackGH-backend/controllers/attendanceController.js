/**
 * Attendance controller barrel
 */

const mark = require("./attendance.mark.controller");
const history = require("./attendance.history.controller");

module.exports = {
  markDailyAttendance: mark.markDailyAttendance,
  getClassroomDailyHistory: history.getClassroomDailyHistory,
  getFlaggedStudentsForClassroom: history.getFlaggedStudentsForClassroom,
  uploadPhoto: history.uploadPhoto,
};
