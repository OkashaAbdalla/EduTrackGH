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
      enum: ['absence', 'late'],
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
  },
  { timestamps: true }
);

notificationSchema.index({ parentId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
