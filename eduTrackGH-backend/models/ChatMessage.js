/**
 * ChatMessage Model
 * Headteacher <-> Teacher direct messages
 */

const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    headteacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    message: { type: String, required: true },
    senderRole: { type: String, enum: ['headteacher', 'teacher'], required: true },
    createdAt: { type: Date, default: Date.now },
    edited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatMessageSchema.index({ headteacherId: 1, teacherId: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
