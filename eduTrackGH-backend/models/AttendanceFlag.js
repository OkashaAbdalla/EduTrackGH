/**
 * AttendanceFlag Model
 * Phase 8: Stores flagged classrooms for suspicious attendance patterns
 * Rules: 100% present for 15+ consecutive days OR all records marked within 60 seconds
 */

const mongoose = require('mongoose');

const attendanceFlagSchema = new mongoose.Schema(
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
    flagType: {
      type: String,
      enum: ['consecutive_100_present', 'rapid_marking'],
      required: true,
    },
    details: {
      type: String,
      default: null,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

attendanceFlagSchema.index({ classroomId: 1, date: 1 });
attendanceFlagSchema.index({ schoolId: 1, date: 1 });
attendanceFlagSchema.index({ isResolved: 1 });

module.exports = mongoose.model('AttendanceFlag', attendanceFlagSchema);
