/**
 * Notification Model
 * EduTrack GH: Parent notifications (absence/late) - SMS/email log
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    type: {
      type: String,
      enum: ['present', 'absence', 'late', 'warning'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      enum: ['sms', 'email', 'both'],
      default: 'sms',
    },
    date: {
      type: Date,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    emailMessageId: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ parentId: 1, createdAt: -1 });
notificationSchema.index({ parentId: 1, studentId: 1, date: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Notification', notificationSchema);
