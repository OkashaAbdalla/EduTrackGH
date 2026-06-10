/**
 * In-app notifications for teachers and headteachers (chat, unlock, etc.)
 */

const mongoose = require('mongoose');

const staffNotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    senderName: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['chat_message', 'unlock_request', 'attendance_unlocked', 'delegation_request'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
    },
    classroomName: {
      type: String,
      trim: true,
    },
    attendanceDate: {
      type: Date,
    },
    otherUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    delegationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssistantDelegation',
      sparse: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

staffNotificationSchema.index({ recipientId: 1, createdAt: -1 });
staffNotificationSchema.index({ recipientId: 1, read: 1 });

module.exports = mongoose.model('StaffNotification', staffNotificationSchema);
