/**
 * Student Model
 * Represents a student in the system
 */

const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true, // keeps a unique index automatically
    trim: true,
    uppercase: true,
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE', 'OTHER'],
  },
  // School and classroom references
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
  },
  grade: {
    type: String,
    trim: true,
  },
  // Parent/Guardian references (optional until SMS notification is implemented)
  parentPhone: {
    type: String,
    required: false,
    default: '',
    trim: true,
  },
  parentName: {
    type: String,
    trim: true,
  },
  // Face recognition data (encrypted or stored securely)
  faceEncoding: {
    type: String, // Base64 encoded face encoding
    select: false, // Don't return by default
  },
  // Attendance statistics
  attendanceStats: {
    totalDays: {
      type: Number,
      default: 0,
    },
    presentDays: {
      type: Number,
      default: 0,
    },
    absentDays: {
      type: Number,
      default: 0,
    },
    lateDays: {
      type: Number,
      default: 0,
    },
    lastAttendanceDate: {
      type: Date,
    },
  },
  // Status flags
  isActive: {
    type: Boolean,
    default: true,
  },
  isFlagged: {
    type: Boolean,
    default: false,
  },
  flaggedReason: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes for faster queries (no duplicate index on studentId)
studentSchema.index({ schoolId: 1 });
studentSchema.index({ classroomId: 1 });
studentSchema.index({ parentPhone: 1 });
studentSchema.index({ isFlagged: 1 });

module.exports = mongoose.model('Student', studentSchema);
