/**
 * Chat Controller
 * Headteacher <-> Teacher messaging
 */

const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const School = require('../models/School');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const { emitChatMessage } = require('../utils/socketServer');

async function sendMessage(req, res) {
  try {
    const user = req.user;
    const { teacherId, message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    let headteacherId, targetTeacherId, schoolId, senderRole;
    if (user.role === 'headteacher') {
      if (!teacherId) return res.status(400).json({ success: false, message: 'teacherId is required when sending as headteacher' });
      headteacherId = user._id;
      targetTeacherId = teacherId;
      schoolId = user.school;
      senderRole = 'headteacher';
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
        const html = emailTemplates.chatMessageFromHeadteacher(user.fullName, school?.name, message.trim());
        await sendEmail({ to: otherUser.email, subject: `Message from ${user.fullName} (EduTrack GH)`, html });
      } catch (err) {
        console.warn('Chat email failed:', err.message);
      }
    }

    emitChatMessage({ headteacherId: headteacherId.toString(), teacherId: targetTeacherId.toString(), ...saved });

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
    if (user.role === 'headteacher') {
      headteacherId = user._id;
      teacherId = otherId;
    } else if (user.role === 'teacher') {
      teacherId = user._id;
      headteacherId = otherId;
    } else {
      return res.status(403).json({ success: false, message: 'Only headteacher or teacher can view conversations' });
    }

    const messages = await ChatMessage.find({ headteacherId, teacherId }).sort({ createdAt: 1 }).lean();
    const list = messages.map((m) => ({
      id: m._id,
      message: m.message,
      senderRole: m.senderRole,
      createdAt: m.createdAt,
      edited: m.edited,
      isDeleted: m.isDeleted,
    }));
    return res.json({ success: true, messages: list });
  } catch (error) {
    console.error('getConversation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get conversation' });
  }
}

async function getConversations(req, res) {
  try {
    const user = req.user;
    if (user.role !== 'headteacher' && user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only headteacher or teacher can list conversations' });
    }

    const matchFilter = user.role === 'headteacher' ? { headteacherId: user._id } : { teacherId: user._id };

    const agg = await ChatMessage.aggregate([
      { $match: matchFilter },
      { $sort: { createdAt: -1 } },
      { $group: { _id: { ht: '$headteacherId', tt: '$teacherId' }, lastAt: { $first: '$createdAt' }, lastMsg: { $first: '$message' } } },
    ]);

    const ids = new Set();
    for (const g of agg) {
      const other = user.role === 'headteacher' ? g._id.tt : g._id.ht;
      ids.add(other);
    }
    const users = await User.find({ _id: { $in: Array.from(ids) } }).select('fullName email').lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const list = agg.map((g) => {
      const otherId = user.role === 'headteacher' ? g._id.tt : g._id.ht;
      const u = userMap.get(otherId.toString());
      return { otherId, otherName: u?.fullName || 'Unknown', lastMessage: g.lastMsg, lastAt: g.lastAt };
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
      doc.senderRole === 'headteacher' && user.role === 'headteacher' && doc.headteacherId.toString() === user._id.toString();
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

    const isHeadteacherSender =
      doc.senderRole === 'headteacher' && user.role === 'headteacher' && doc.headteacherId.toString() === user._id.toString();
    const isTeacherSender =
      doc.senderRole === 'teacher' && user.role === 'teacher' && doc.teacherId.toString() === user._id.toString();
    if (!isHeadteacherSender && !isTeacherSender) {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
    }

    await ChatMessage.deleteOne({ _id: id });
    return res.json({ success: true });
  } catch (error) {
    console.error('deleteMessage error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
}

module.exports = { sendMessage, getConversation, getConversations, editMessage, deleteMessage };
