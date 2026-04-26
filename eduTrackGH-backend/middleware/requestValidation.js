const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isValidEmail = (value) => isNonEmptyString(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const badRequest = (res, message) =>
  res.status(400).json({
    success: false,
    message,
  });

const validateCreateHeadteacher = (req, res, next) => {
  const { fullName, email, password } = req.body || {};
  if (!isNonEmptyString(fullName)) return badRequest(res, 'fullName is required');
  if (!isValidEmail(email)) return badRequest(res, 'Valid email is required');
  if (!isNonEmptyString(password)) return badRequest(res, 'password is required');
  next();
};

const validateCreateTeacher = (req, res, next) => {
  const { fullName, email, password } = req.body || {};
  if (!isNonEmptyString(fullName)) return badRequest(res, 'fullName is required');
  if (!isValidEmail(email)) return badRequest(res, 'Valid email is required');
  if (!isNonEmptyString(password)) return badRequest(res, 'password is required');
  next();
};

const validateUpdateTeacher = (req, res, next) => {
  const body = req.body || {};
  if (!Object.keys(body).length) return badRequest(res, 'Update payload is required');
  if (body.email != null && !isValidEmail(body.email)) return badRequest(res, 'Valid email is required');
  next();
};

const validateCreateSchool = (req, res, next) => {
  const { name } = req.body || {};
  if (!isNonEmptyString(name)) return badRequest(res, 'School name is required');
  next();
};

const validateUpdateSchool = (req, res, next) => {
  const body = req.body || {};
  if (!Object.keys(body).length) return badRequest(res, 'Update payload is required');
  if (body.email != null && !isValidEmail(body.email)) return badRequest(res, 'Valid email is required');
  next();
};

const validateUpdateAdminUserStatus = (req, res, next) => {
  const { isActive, action, tempPassword } = req.body || {};
  if (typeof isActive !== 'boolean' && action !== 'reset_password') {
    return badRequest(res, 'Provide either isActive(boolean) or action=reset_password');
  }
  if (action === 'reset_password' && !isNonEmptyString(tempPassword)) {
    return badRequest(res, 'tempPassword is required for reset_password');
  }
  next();
};

const validateObjectBody = (message) => (req, res, next) => {
  const body = req.body || {};
  if (!Object.keys(body).length) return badRequest(res, message);
  next();
};

module.exports = {
  validateCreateHeadteacher,
  validateCreateTeacher,
  validateUpdateTeacher,
  validateCreateSchool,
  validateUpdateSchool,
  validateUpdateAdminUserStatus,
  validateObjectBody,
};
