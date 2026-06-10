/**
 * Headteacher -> Assistant Headteacher delegation
 */

const AssistantDelegation = require('../models/AssistantDelegation');
const User = require('../models/User');
const AssistantChatMessage = require('../models/AssistantChatMessage');
const { emitDelegationUpdate, emitAssistantChatMessage } = require('../utils/socketServer');
const { notifyDelegationRequest } = require('../services/staffNotificationService');
const { emailAssistantChatMessage } = require('../utils/assistantChatEmail');

async function getAssistantForHeadteacher(headteacherId) {
  return User.findOne({
    role: 'assistant_headteacher',
    linkedHeadteacher: headteacherId,
    isActive: true,
  }).select('fullName email avatarUrl school schoolLevel linkedHeadteacher');
}

async function getDelegationStatusForUser(user) {
  if (user.role === 'headteacher') {
    const [active, pending, assistant] = await Promise.all([
      AssistantDelegation.findOne({ headteacherId: user._id, status: 'active' }).lean(),
      AssistantDelegation.findOne({ headteacherId: user._id, status: 'pending' }).sort({ createdAt: -1 }).lean(),
      getAssistantForHeadteacher(user._id),
    ]);
    return {
      role: 'headteacher',
      hasAssistant: Boolean(assistant),
      assistant,
      activeDelegation: active,
      pendingDelegation: pending,
      isActing: Boolean(active),
    };
  }

  if (user.role === 'assistant_headteacher') {
    const [active, pending] = await Promise.all([
      AssistantDelegation.findOne({ assistantId: user._id, status: 'active' }).lean(),
      AssistantDelegation.findOne({ assistantId: user._id, status: 'pending' }).sort({ createdAt: -1 }).lean(),
    ]);
    const headteacher = user.linkedHeadteacher
      ? await User.findById(user.linkedHeadteacher).select('fullName email avatarUrl schoolLevel').lean()
      : null;
    return {
      role: 'assistant_headteacher',
      headteacher,
      activeDelegation: active,
      pendingDelegation: pending,
      isActing: Boolean(active),
    };
  }

  return { role: user.role, isActing: false };
}

async function requestDelegation(headteacher, { note = '' } = {}) {
  const assistant = await getAssistantForHeadteacher(headteacher._id);
  if (!assistant) {
    const err = new Error('No assistant headteacher is linked to your account');
    err.status = 400;
    throw err;
  }

  const existingActive = await AssistantDelegation.findOne({
    headteacherId: headteacher._id,
    status: 'active',
  });
  if (existingActive) {
    const err = new Error('An active delegation is already in progress');
    err.status = 400;
    throw err;
  }

  await AssistantDelegation.updateMany(
    { headteacherId: headteacher._id, status: 'pending' },
    { $set: { status: 'ended', endedAt: new Date(), endedBy: 'headteacher' } }
  );

  const delegation = await AssistantDelegation.create({
    schoolId: headteacher.school,
    headteacherId: headteacher._id,
    assistantId: assistant._id,
    schoolLevel: headteacher.schoolLevel,
    status: 'pending',
    note: String(note || '').trim(),
    requestedAt: new Date(),
  });

  const chatText = note?.trim()
    ? `Delegation request: ${note.trim()}`
    : 'Please take over headteacher duties while I am away.';

  const chatDoc = await AssistantChatMessage.create({
    headteacherId: headteacher._id,
    assistantId: assistant._id,
    schoolId: headteacher.school,
    message: chatText,
    senderRole: 'headteacher',
    messageType: 'delegation_request',
    delegationId: delegation._id,
  });

  const chatPayload = {
    id: chatDoc._id,
    headteacherId: headteacher._id.toString(),
    assistantId: assistant._id.toString(),
    schoolId: headteacher.school.toString(),
    message: chatDoc.message,
    senderRole: chatDoc.senderRole,
    messageType: chatDoc.messageType,
    delegationId: delegation._id.toString(),
    createdAt: chatDoc.createdAt,
  };

  emitAssistantChatMessage(chatPayload);
  emitDelegationUpdate({
    headteacherId: headteacher._id.toString(),
    assistantId: assistant._id.toString(),
    delegation: serializeDelegation(delegation),
    event: 'requested',
  });

  emailAssistantChatMessage({
    participants: {
      headteacherId: headteacher._id,
      assistantId: assistant._id,
      schoolId: headteacher.school,
    },
    senderUser: headteacher,
    message: chatDoc.message,
  }).catch(() => {});

  try {
    await notifyDelegationRequest({
      assistantId: assistant._id,
      headteacherId: headteacher._id,
      headteacherName: headteacher.fullName || headteacher.email,
      note: note?.trim() || '',
      delegationId: delegation._id,
      schoolId: headteacher.school,
    });
  } catch (err) {
    console.warn('Delegation notification failed:', err.message);
  }

  return { delegation, chatMessage: chatPayload };
}

async function activateDelegation(assistant) {
  const delegation = await AssistantDelegation.findOne({
    assistantId: assistant._id,
    status: 'pending',
  }).sort({ createdAt: -1 });

  if (!delegation) {
    const err = new Error('No pending delegation request found');
    err.status = 404;
    throw err;
  }

  delegation.status = 'active';
  delegation.activatedAt = new Date();
  await delegation.save();

  emitDelegationUpdate({
    headteacherId: delegation.headteacherId.toString(),
    assistantId: delegation.assistantId.toString(),
    delegation: serializeDelegation(delegation),
    event: 'activated',
  });

  return delegation;
}

async function endDelegation(user, { endedBy } = {}) {
  const filter =
    user.role === 'headteacher'
      ? { headteacherId: user._id, status: { $in: ['pending', 'active'] } }
      : { assistantId: user._id, status: { $in: ['pending', 'active'] } };

  const delegation = await AssistantDelegation.findOne(filter).sort({ createdAt: -1 });
  if (!delegation) {
    const err = new Error('No active or pending delegation found');
    err.status = 404;
    throw err;
  }

  delegation.status = 'ended';
  delegation.endedAt = new Date();
  delegation.endedBy = endedBy || (user.role === 'headteacher' ? 'headteacher' : 'assistant');
  await delegation.save();

  emitDelegationUpdate({
    headteacherId: delegation.headteacherId.toString(),
    assistantId: delegation.assistantId.toString(),
    delegation: serializeDelegation(delegation),
    event: 'ended',
  });

  return delegation;
}

function serializeDelegation(doc) {
  if (!doc) return null;
  return {
    id: doc._id?.toString?.() || String(doc._id),
    schoolId: doc.schoolId?.toString?.() || doc.schoolId,
    headteacherId: doc.headteacherId?.toString?.() || doc.headteacherId,
    assistantId: doc.assistantId?.toString?.() || doc.assistantId,
    schoolLevel: doc.schoolLevel,
    status: doc.status,
    note: doc.note || '',
    requestedAt: doc.requestedAt,
    activatedAt: doc.activatedAt,
    endedAt: doc.endedAt,
    endedBy: doc.endedBy,
  };
}

module.exports = {
  getAssistantForHeadteacher,
  getDelegationStatusForUser,
  requestDelegation,
  activateDelegation,
  endDelegation,
  serializeDelegation,
};
