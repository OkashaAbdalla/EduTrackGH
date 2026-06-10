/**
 * Shared scope helpers for headteacher and acting assistant headteacher
 */

function getSchoolIdFromReq(req) {
  return req.user?.school || null;
}

function getHeadteacherIdForScope(req) {
  if (req.user?.role === 'assistant_headteacher' && req.user?.linkedHeadteacher) {
    return req.user.linkedHeadteacher;
  }
  return req.user?._id || null;
}

function getSchoolLevelFromReq(req) {
  return req.user?.schoolLevel || null;
}

function isAssistantUser(req) {
  return req.user?.role === 'assistant_headteacher';
}

module.exports = {
  getSchoolIdFromReq,
  getHeadteacherIdForScope,
  getSchoolLevelFromReq,
  isAssistantUser,
};
