/**
 * Student validation middleware
 * Body validation only; no business logic.
 */

const validateRegisterBody = (req, res, next) => {
  const { fullName, classroomId } = req.body || {};
  if (!fullName || !classroomId) {
    return res.status(400).json({
      success: false,
      message: 'fullName and classroomId are required',
    });
  }
  next();
};

const validateProposalBody = (req, res, next) => {
  const { fullName, classroomId } = req.body || {};
  if (!fullName || !classroomId) {
    return res.status(400).json({
      success: false,
      message: 'fullName and classroomId are required',
    });
  }
  next();
};

module.exports = {
  validateRegisterBody,
  validateProposalBody,
};
