/**
 * Ensures assistant headteacher has an active delegation before operational routes
 */

const AssistantDelegation = require('../models/AssistantDelegation');

async function requireActiveDelegation(req, res, next) {
  if (req.user?.role !== 'assistant_headteacher') {
    return next();
  }

  try {
    const delegation = await AssistantDelegation.findOne({
      assistantId: req.user._id,
      status: 'active',
    }).lean();

    if (!delegation) {
      return res.status(403).json({
        success: false,
        code: 'DELEGATION_INACTIVE',
        message: 'Your assistant headteacher access is not active. Accept a delegation request from your headteacher first.',
      });
    }

    req.delegation = delegation;
    return next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to verify delegation status' });
  }
}

module.exports = { requireActiveDelegation };
