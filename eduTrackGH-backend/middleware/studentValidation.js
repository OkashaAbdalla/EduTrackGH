/**
 * Student validation middleware
 * Body validation only; no business logic.
 */

const validateRegisterBody = (req, res, next) => {
  const { fullName, classroomId, studentId, admissionNumber } = req.body || {};
  if (!fullName || !classroomId) {
    return res.status(400).json({
      success: false,
      message: 'fullName and classroomId are required',
    });
  }
  const admission = (admissionNumber || studentId || '').trim();
  if (!admission) {
    return res.status(400).json({
      success: false,
      message: 'admissionNumber (or studentId) is required',
    });
  }
  next();
};

const validateProposalBody = (req, res, next) => {
  const { fullName, classroomId, studentId, admissionNumber } = req.body || {};
  if (!fullName || !classroomId) {
    return res.status(400).json({
      success: false,
      message: 'fullName and classroomId are required',
    });
  }
  const admission = (admissionNumber || studentId || '').trim();
  if (!admission) {
    return res.status(400).json({
      success: false,
      message: 'admissionNumber (or studentId) is required',
    });
  }
  next();
};

module.exports = {
  validateRegisterBody,
  validateProposalBody,
};
