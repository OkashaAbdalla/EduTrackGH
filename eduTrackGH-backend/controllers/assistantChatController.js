/**
 * Headteacher <-> Assistant Headteacher chat
 */

const AssistantChatMessage = require('../models/AssistantChatMessage');
const User = require('../models/User');
const { emitAssistantChatMessage, emitAssistantChatMessageDeleted } = require('../utils/socketServer');
const { getAssistantForHeadteacher } = require('../services/delegationService');
const { emailAssistantChatMessage } = require('../utils/assistantChatEmail');

function mapMessageForUser(m, user) {
  if (m.isDeleted) return null;
  const hidden =
    (user.role === 'headteacher' && m.hiddenForHeadteacher) ||
    (user.role === 'assistant_headteacher' && m.hiddenForAssistant);
  if (hidden) return null;
  return {
    id: m._id,
    message: m.message,
    senderRole: m.senderRole,
    messageType: m.messageType || 'text',
    delegationId: m.delegationId?.toString?.() || m.delegationId || null,
    createdAt: m.createdAt,
    edited: m.edited,
  };
}

async function resolveParticipants(user) {
  if (user.role === 'headteacher') {
    const assistant = await getAssistantForHeadteacher(user._id);
    if (!assistant) return null;
    return { headteacherId: user._id, assistantId: assistant._id, schoolId: user.school };
  }
  if (user.role === 'assistant_headteacher') {
    if (!user.linkedHeadteacher) return null;
    const headteacher = await User.findById(user.linkedHeadteacher).select('_id school');
    if (!headteacher) return null;
    return { headteacherId: headteacher._id, assistantId: user._id, schoolId: user.school || headteacher.school };
  }
  return null;
}

async function getConversation(req, res) {
  try {
    const participants = await resolveParticipants(req.user);
    if (!participants) {
      return res.status(404).json({ success: false, message: 'No assistant headteacher linked to this account' });
    }
    const messages = await AssistantChatMessage.find({
      headteacherId: participants.headteacherId,
      assistantId: participants.assistantId,
    })
      .sort({ createdAt: 1 })
      .lean();
    const list = messages.map((m) => mapMessageForUser(m, req.user)).filter(Boolean);
    return res.json({ success: true, messages: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load conversation' });
  }
}

async function sendMessage(req, res) {
  try {
    const { message } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }
    const participants = await resolveParticipants(req.user);
    if (!participants) {
      return res.status(404).json({ success: false, message: 'No assistant headteacher linked to this account' });
    }

    const senderRole = req.user.role === 'headteacher' ? 'headteacher' : 'assistant_headteacher';
    const doc = await AssistantChatMessage.create({
      ...participants,
      message: String(message).trim(),
      senderRole,
      messageType: 'text',
    });

    const payload = {
      id: doc._id,
      headteacherId: participants.headteacherId.toString(),
      assistantId: participants.assistantId.toString(),
      schoolId: participants.schoolId?.toString?.(),
      message: doc.message,
      senderRole: doc.senderRole,
      messageType: doc.messageType,
      delegationId: null,
      createdAt: doc.createdAt,
    };
    emitAssistantChatMessage(payload);

    emailAssistantChatMessage({
      participants,
      senderUser: req.user,
      message: doc.message,
    }).catch(() => {});

    return res.status(201).json({ success: true, message: payload });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  }
}

async function editMessage(req, res) {
  try {
    const { message } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }
    const doc = await AssistantChatMessage.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Message not found' });

    const isSender =
      (doc.senderRole === 'headteacher' && req.user.role === 'headteacher' && doc.headteacherId.toString() === req.user._id.toString()) ||
      (doc.senderRole === 'assistant_headteacher' && req.user.role === 'assistant_headteacher' && doc.assistantId.toString() === req.user._id.toString());
    if (!isSender) {
      return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
    }

    doc.message = String(message).trim();
    doc.edited = true;
    await doc.save();

    const payload = mapMessageForUser(doc.toObject(), req.user);
    return res.json({ success: true, message: payload });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to edit message' });
  }
}

async function deleteMessage(req, res) {
  try {
    const doc = await AssistantChatMessage.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Message not found' });

    const isParticipantHt = req.user.role === 'headteacher' && doc.headteacherId.toString() === req.user._id.toString();
    const isParticipantAsst = req.user.role === 'assistant_headteacher' && doc.assistantId.toString() === req.user._id.toString();
    if (!isParticipantHt && !isParticipantAsst) {
      return res.status(403).json({ success: false, message: 'You cannot delete this message' });
    }

    const isSender =
      (doc.senderRole === 'headteacher' && isParticipantHt) ||
      (doc.senderRole === 'assistant_headteacher' && isParticipantAsst);

    if (isSender) {
      doc.isDeleted = true;
      await doc.save();
      emitAssistantChatMessageDeleted({
        id: doc._id,
        headteacherId: doc.headteacherId.toString(),
        assistantId: doc.assistantId.toString(),
        scope: 'everyone',
      });
      return res.json({ success: true, scope: 'everyone' });
    }

    if (req.user.role === 'headteacher') doc.hiddenForHeadteacher = true;
    else doc.hiddenForAssistant = true;
    await doc.save();
    return res.json({ success: true, scope: 'self' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
}

module.exports = { getConversation, sendMessage, editMessage, deleteMessage };
