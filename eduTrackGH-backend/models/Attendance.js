/**
 * Attendance Model
 * Records student attendance for sessions
 */

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  studentIdNumber: {
    type: String,
    required: true,
  },
  timeMarked: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['present', 'late', 'absent'],
    default: 'present',
  },
  // Face recognition confidence (0-1)
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: null,
  },
  // Additional metadata
  markedBy: {
    type: String,
    enum: ['student', 'lecturer', 'system'],
    default: 'student',
  },
}, {
  timestamps: true,
});

// Compound index to prevent duplicate attendance
attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

// Method to determine status based on time
attendanceSchema.methods.calculateStatus = function(sessionStartTime) {
  const timeDiff = (this.timeMarked - sessionStartTime) / 60000; // minutes
  
  if (timeDiff <= 15) {
    return 'present';
  } else if (timeDiff <= 30) {
    return 'late';
  } else {
    return 'absent';
  }
};

module.exports = mongoose.model('Attendance', attendanceSchema);
