/**
 * Student controller barrel
 * Re-exports from split controllers for backward compatibility.
 */

const { registerStudentByHeadteacher, getStudentsForHeadteacher } = require('./student.controller');
const { proposeStudent } = require('./student.proposal.controller');
const {
  getPendingStudentsForHeadteacher,
  approveStudent,
  rejectStudent,
} = require('./student.approval.controller');

module.exports = {
  proposeStudent,
  getPendingStudentsForHeadteacher,
  approveStudent,
  rejectStudent,
  registerStudentByHeadteacher,
  getStudentsForHeadteacher,
};
