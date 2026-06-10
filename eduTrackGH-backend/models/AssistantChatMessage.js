/**
 * Headteacher <-> Assistant Headteacher messages
 */

const mongoose = require('mongoose');

const assistantChatMessageSchema = new mongoose.Schema(
  {
    headteacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assistantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    message: { type: String, required: true },
    senderRole: { type: String, enum: ['headteacher', 'assistant_headteacher'], required: true },
    messageType: { type: String, enum: ['text', 'delegation_request'], default: 'text' },
    delegationId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssistantDelegation', sparse: true },
    edited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    hiddenForHeadteacher: { type: Boolean, default: false },
    hiddenForAssistant: { type: Boolean, default: false },
  },
  { timestamps: true }
);

assistantChatMessageSchema.index({ headteacherId: 1, assistantId: 1, createdAt: -1 });

module.exports = mongoose.model('AssistantChatMessage', assistantChatMessageSchema);
