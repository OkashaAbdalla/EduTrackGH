/**
 * In-app notifications for headteachers (unmarked attendance, etc.)
 */

const mongoose = require('mongoose');

const headteacherNotificationSchema = new mongoose.Schema(
  {
    headteacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teacherName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['unmarked_attendance'],
      default: 'unmarked_attendance',
    },
    message: {
      type: String,
      required: true,
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

headteacherNotificationSchema.index({ headteacherId: 1, createdAt: -1 });
headteacherNotificationSchema.index(
  { headteacherId: 1, teacherId: 1, date: 1, type: 1 },
  { unique: true }
);

module.exports = mongoose.model('HeadteacherNotification', headteacherNotificationSchema);
