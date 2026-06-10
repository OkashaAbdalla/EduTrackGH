/**
 * Temporary delegation from headteacher to assistant headteacher
 */

const mongoose = require('mongoose');

const assistantDelegationSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    headteacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assistantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    schoolLevel: { type: String, enum: ['PRIMARY', 'JHS'], required: true },
    status: { type: String, enum: ['pending', 'active', 'ended'], default: 'pending', index: true },
    note: { type: String, default: '' },
    requestedAt: { type: Date, default: Date.now },
    activatedAt: { type: Date },
    endedAt: { type: Date },
    endedBy: { type: String, enum: ['headteacher', 'assistant', 'system'], sparse: true },
  },
  { timestamps: true }
);

assistantDelegationSchema.index({ assistantId: 1, status: 1 });
assistantDelegationSchema.index({ headteacherId: 1, status: 1 });

module.exports = mongoose.model('AssistantDelegation', assistantDelegationSchema);
