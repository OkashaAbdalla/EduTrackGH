/**
 * Chat Controller
 * Headteacher <-> Teacher messaging
 */

const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const School = require('../models/School');
const AssistantDelegation = require('../models/AssistantDelegation');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const { emitChatMessage, emitChatMessageDeleted } = require('../utils/socketServer');
const { notifyChatMessage } = require('../services/staffNotificationService');

function isHeadteacherSide(role) {
  return role === 'headteacher' || role === 'assistant_headteacher';
}

async function resolveHeadteacherActor(user) {
  if (user.role === 'headteacher') {
    return { headteacherId: user._id, schoolId: user.school, senderUser: user, senderRole: 'headteacher' };
  }
  if (user.role === 'assistant_headteacher') {
    const delegation = await AssistantDelegation.findOne({ assistantId: user._id, status: 'active' });
    if (!delegation || !user.linkedHeadteacher) return null;
    const headteacher = await User.findById(user.linkedHeadteacher).select('_id school fullName');
    if (!headteacher) return null;
    return {
      headteacherId: headteacher._id,
      schoolId: user.school || headteacher.school,
      senderUser: user,
      senderRole: 'headteacher',
    };
  }
  return null;
}

function mapMessageForUser(m, user) {
  if (m.isDeleted) return null;
  const hidden =
    (isHeadteacherSide(user.role) && m.hiddenForHeadteacher) ||
    (user.role === 'teacher' && m.hiddenForTeacher);
  if (hidden) return null;
  return {
    id: m._id,
    message: m.message,
    senderRole: m.senderRole,
    createdAt: m.createdAt,
    edited: m.edited,
    isDeleted: m.isDeleted,
  };
}

async function sendMessage(req, res) {
  try {
    const user = req.user;
    const { teacherId, message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    let headteacherId, targetTeacherId, schoolId, senderRole;
    if (isHeadteacherSide(user.role)) {
      const actor = await resolveHeadteacherActor(user);
      if (!actor) {
        return res.status(403).json({
          success: false,
          message: 'Assistant headteacher access is not active. Accept a delegation request first.',
        });
      }
      if (!teacherId) {
        return res.status(400).json({ success: false, message: 'teacherId is required when sending as headteacher' });
      }
      headteacherId = actor.headteacherId;
      targetTeacherId = teacherId;
      schoolId = actor.schoolId;
      senderRole = actor.senderRole;
    } else if (user.role === 'teacher') {
      const teacher = await User.findById(user._id).select('schoolId');
      if (!teacher?.schoolId) return res.status(400).json({ success: false, message: 'Teacher not linked to school' });
      const headteacher = await User.findOne({ role: 'headteacher', school: teacher.schoolId, isActive: true });
      if (!headteacher) return res.status(400).json({ success: false, message: 'No headteacher for your school' });
      headteacherId = headteacher._id;
      targetTeacherId = user._id;
      schoolId = teacher.schoolId;
      senderRole = 'teacher';
    } else {
      return res.status(403).json({ success: false, message: 'Only headteacher or teacher can send messages' });
    }

    const otherUser = await User.findById(targetTeacherId).select('fullName email');
    if (!otherUser) return res.status(404).json({ success: false, message: 'Teacher not found' });

    const doc = await ChatMessage.create({ headteacherId, teacherId: targetTeacherId, schoolId, message: message.trim(), senderRole });
    const saved = { id: doc._id, headteacherId, teacherId: targetTeacherId, schoolId, message: doc.message, senderRole, createdAt: doc.createdAt };

    if (senderRole === 'headteacher') {
      try {
        const school = await School.findById(schoolId).select('name');
        const senderLabel =
          user.role === 'assistant_headteacher'
            ? `${user.fullName || 'Assistant Headteacher'} (Assistant HT)`
            : user.fullName;
        const html = emailTemplates.chatMessageFromHeadteacher(senderLabel, school?.name, message.trim());
        await sendEmail({ to: otherUser.email, subject: `Message from ${senderLabel} (EduTrack GH)`, html });
      } catch (err) {
        console.warn('Chat email failed:', err.message);
      }
    }

    emitChatMessage({ headteacherId: headteacherId.toString(), teacherId: targetTeacherId.toString(), ...saved });

    const recipientId = senderRole === 'headteacher' ? targetTeacherId : headteacherId;
    const otherUserId = senderRole === 'headteacher' ? headteacherId : targetTeacherId;
    try {
      await notifyChatMessage({
        recipientId,
        senderId: user._id,
        senderName: user.fullName || user.email,
        schoolId,
        message: message.trim(),
        otherUserId,
      });
    } catch (err) {
      console.warn('Staff chat notification failed:', err.message);
    }

    return res.status(201).json({ success: true, message: saved });
  } catch (error) {
    console.error('sendMessage error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  }
}

async function getConversation(req, res) {
  try {
    const user = req.user;
    const { otherId } = req.params;
    if (!otherId) return res.status(400).json({ success: false, message: 'otherId (headteacher or teacher id) required' });

    let headteacherId, teacherId;
    if (isHeadteacherSide(user.role)) {
      const actor = await resolveHeadteacherActor(user);
      if (!actor) {
        return res.status(403).json({ success: false, message: 'Assistant headteacher access is not active.' });
      }
      headteacherId = actor.headteacherId;
      teacherId = otherId;
    } else if (user.role === 'teacher') {
      teacherId = user._id;
      headteacherId = otherId;
    } else {
      return res.status(403).json({ success: false, message: 'Only headteacher or teacher can view conversations' });
    }

    const messages = await ChatMessage.find({ headteacherId, teacherId }).sort({ createdAt: 1 }).lean();
    const list = messages.map((m) => mapMessageForUser(m, user)).filter(Boolean);
    return res.json({ success: true, messages: list });
  } catch (error) {
    console.error('getConversation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get conversation' });
  }
}

async function getConversations(req, res) {
  try {
    const user = req.user;
    if (!isHeadteacherSide(user.role) && user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only headteacher or teacher can list conversations' });
    }

    let matchFilter;
    if (isHeadteacherSide(user.role)) {
      const actor = await resolveHeadteacherActor(user);
      if (!actor) {
        return res.status(403).json({ success: false, message: 'Assistant headteacher access is not active.' });
      }
      matchFilter = { headteacherId: actor.headteacherId };
    } else {
      matchFilter = { teacherId: user._id };
    }

    const agg = await ChatMessage.aggregate([
      { $match: matchFilter },
      { $sort: { createdAt: -1 } },
      { $group: { _id: { ht: '$headteacherId', tt: '$teacherId' }, lastAt: { $first: '$createdAt' }, lastMsg: { $first: '$message' } } },
    ]);

    const ids = new Set();
    for (const g of agg) {
      const other = isHeadteacherSide(user.role) ? g._id.tt : g._id.ht;
      ids.add(other);
    }
    const users = await User.find({ _id: { $in: Array.from(ids) } }).select('fullName email avatarUrl').lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const list = agg.map((g) => {
      const otherId = isHeadteacherSide(user.role) ? g._id.tt : g._id.ht;
      const u = userMap.get(otherId.toString());
      return {
        otherId,
        otherName: u?.fullName || 'Unknown',
        otherAvatarUrl: u?.avatarUrl || '',
        lastMessage: g.lastMsg,
        lastAt: g.lastAt,
      };
    });

    return res.json({ success: true, conversations: list });
  } catch (error) {
    console.error('getConversations error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get conversations' });
  }
}

async function editMessage(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }
    const doc = await ChatMessage.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Message not found' });

    const isHeadteacherSender =
      doc.senderRole === 'headteacher' &&
      isHeadteacherSide(user.role) &&
      (await resolveHeadteacherActor(user))?.headteacherId?.toString() === doc.headteacherId.toString();
    const isTeacherSender =
      doc.senderRole === 'teacher' && user.role === 'teacher' && doc.teacherId.toString() === user._id.toString();
    if (!isHeadteacherSender && !isTeacherSender) {
      return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
    }

    doc.message = message.trim();
    doc.edited = true;
    await doc.save();

    const payload = {
      id: doc._id,
      headteacherId: doc.headteacherId,
      teacherId: doc.teacherId,
      schoolId: doc.schoolId,
      message: doc.message,
      senderRole: doc.senderRole,
      createdAt: doc.createdAt,
      edited: doc.edited,
      isDeleted: doc.isDeleted,
    };

    return res.json({ success: true, message: payload });
  } catch (error) {
    console.error('editMessage error:', error);
    return res.status(500).json({ success: false, message: 'Failed to edit message' });
  }
}

async function deleteMessage(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const doc = await ChatMessage.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Message not found' });

    const actor = isHeadteacherSide(user.role) ? await resolveHeadteacherActor(user) : null;
    const isParticipantHeadteacher =
      isHeadteacherSide(user.role) && actor && doc.headteacherId.toString() === actor.headteacherId.toString();
    const isParticipantTeacher =
      user.role === 'teacher' && doc.teacherId.toString() === user._id.toString();
    if (!isParticipantHeadteacher && !isParticipantTeacher) {
      return res.status(403).json({ success: false, message: 'You cannot delete this message' });
    }

    const isSender =
      (doc.senderRole === 'headteacher' && isParticipantHeadteacher) ||
      (doc.senderRole === 'teacher' && isParticipantTeacher);

    if (isSender) {
      doc.isDeleted = true;
      await doc.save();

      const payload = {
        id: doc._id,
        headteacherId: doc.headteacherId.toString(),
        teacherId: doc.teacherId.toString(),
        isDeleted: true,
        scope: 'everyone',
      };
      emitChatMessageDeleted(payload);

      return res.json({
        success: true,
        scope: 'everyone',
        message: mapMessageForUser(doc.toObject(), user),
      });
    }

    if (isHeadteacherSide(user.role)) doc.hiddenForHeadteacher = true;
    else doc.hiddenForTeacher = true;
    await doc.save();

    return res.json({ success: true, scope: 'self' });
  } catch (error) {
    console.error('deleteMessage error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
}

module.exports = { sendMessage, getConversation, getConversations, editMessage, deleteMessage };
