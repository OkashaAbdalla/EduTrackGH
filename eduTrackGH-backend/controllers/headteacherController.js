/**
 * Headteacher controller barrel
 * Re-exports from split controllers.
 */

const teachers = require('./headteacher.teachers.controller');
const classrooms = require('./headteacher.classrooms.controller');

module.exports = {
  getTeachersForSchool: teachers.getTeachersForSchool,
  createTeacherForSchool: teachers.createTeacherForSchool,
  toggleTeacherStatusForSchool: teachers.toggleTeacherStatusForSchool,
  getClassroomsForSchool: classrooms.getClassroomsForSchool,
  seedDefaultClassroomsForSchool: classrooms.seedDefaultClassroomsForSchool,
  assignClassTeacher: classrooms.assignClassTeacher,
};
