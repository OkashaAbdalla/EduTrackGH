/**
 * Headteacher <-> Assistant delegation lifecycle
 */

const {
  getDelegationStatusForUser,
  requestDelegation,
  activateDelegation,
  endDelegation,
  serializeDelegation,
} = require('../services/delegationService');

const getStatus = async (req, res) => {
  try {
    const status = await getDelegationStatusForUser(req.user);
    return res.json({ success: true, ...status });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get delegation status' });
  }
};

const requestDelegationHandler = async (req, res) => {
  try {
    if (req.user.role !== 'headteacher') {
      return res.status(403).json({ success: false, message: 'Only headteachers can request delegation' });
    }
    const { note } = req.body || {};
    const result = await requestDelegation(req.user, { note });
    return res.status(201).json({
      success: true,
      message: 'Delegation request sent to assistant headteacher',
      delegation: serializeDelegation(result.delegation),
      chatMessage: result.chatMessage,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to request delegation' });
  }
};

const activateDelegationHandler = async (req, res) => {
  try {
    if (req.user.role !== 'assistant_headteacher') {
      return res.status(403).json({ success: false, message: 'Only assistant headteachers can activate delegation' });
    }
    const delegation = await activateDelegation(req.user);
    return res.json({
      success: true,
      message: 'You are now acting as Assistant Headteacher',
      delegation: serializeDelegation(delegation),
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to activate delegation' });
  }
};

const endDelegationHandler = async (req, res) => {
  try {
    if (!['headteacher', 'assistant_headteacher'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }
    const delegation = await endDelegation(req.user);
    return res.json({
      success: true,
      message: 'Delegation ended',
      delegation: serializeDelegation(delegation),
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to end delegation' });
  }
};

module.exports = {
  getStatus,
  requestDelegationHandler,
  activateDelegationHandler,
  endDelegationHandler,
};
