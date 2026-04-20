/**
 * Headteacher controller barrel
 * Re-exports from split controllers.
 */

const teachers = require('./headteacher.teachers.controller');
const classrooms = require('./headteacher.classrooms.controller');
const compliance = require('./headteacher.compliance.controller');
const dashboard = require('./headteacher.dashboard.controller');
const location = require('./headteacher.location.controller');

module.exports = {
  getTeachersForSchool: teachers.getTeachersForSchool,
  createTeacherForSchool: teachers.createTeacherForSchool,
  toggleTeacherStatusForSchool: teachers.toggleTeacherStatusForSchool,
  deleteTeacherForSchool: teachers.deleteTeacherForSchool,
  getClassroomsForSchool: classrooms.getClassroomsForSchool,
  seedDefaultClassroomsForSchool: classrooms.seedDefaultClassroomsForSchool,
  assignClassTeacher: classrooms.assignClassTeacher,
  getTeachersCompliance: compliance.getTeachersCompliance,
  getDashboardStats: dashboard.getDashboardStats,
  getSchoolLocation: location.getSchoolLocation,
  setSchoolLocation: location.setSchoolLocation,
};
