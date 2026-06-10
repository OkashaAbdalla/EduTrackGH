/**
 * Email helpers for headteacher ↔ assistant chat
 */

const User = require('../models/User');
const School = require('../models/School');
const { sendEmail, emailTemplates, isEmailConfigured } = require('../services/emailService');

async function emailAssistantChatMessage({ participants, senderUser, message }) {
  if (!isEmailConfigured() || !participants || !message?.trim()) return;

  const isFromHeadteacher = senderUser.role === 'headteacher';
  const recipientId = isFromHeadteacher ? participants.assistantId : participants.headteacherId;
  const recipient = await User.findById(recipientId).select('email fullName');
  if (!recipient?.email) return;

  const school = participants.schoolId
    ? await School.findById(participants.schoolId).select('name')
    : null;

  const senderLabel =
    senderUser.role === 'assistant_headteacher'
      ? `${senderUser.fullName || 'Assistant Headteacher'} (Assistant HT)`
      : senderUser.fullName || 'Headteacher';

  try {
    await sendEmail({
      to: recipient.email,
      subject: `EduTrack GH — Message from ${senderLabel}`,
      html: emailTemplates.assistantChatMessage(
        senderLabel,
        school?.name,
        message.trim(),
        recipient.fullName
      ),
    });
  } catch (err) {
    console.warn('Assistant chat email failed:', err.message);
  }
}

module.exports = { emailAssistantChatMessage };
