/**
 * DailyAttendance Model
 * EduTrack GH: Daily class attendance (one record per student per day per classroom)
 */

const mongoose = require('mongoose');

const dailyAttendanceSchema = new mongoose.Schema(
  {
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'late', 'absent'],
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // --- Integrity & Verification (Phase 1) ---
    photoUrl: { type: String, default: null },
    verificationType: {
      type: String,
      enum: ['photo', 'manual'],
      default: 'manual',
    },
    manualReason: { type: String, default: null },
    markedAt: { type: Date, default: Date.now },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

dailyAttendanceSchema.index({ classroomId: 1, date: 1, studentId: 1 }, { unique: true });
dailyAttendanceSchema.index({ schoolId: 1, date: 1 });
dailyAttendanceSchema.index({ studentId: 1, date: 1 });

module.exports = mongoose.model('DailyAttendance', dailyAttendanceSchema);
