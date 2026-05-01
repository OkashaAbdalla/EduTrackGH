/**
 * Student Model
 * Represents a student in the system
 */

const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  // Legacy/global student identifier (kept for compatibility)
  studentId: {
    type: String,
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
    enum: ['Male', 'Female', 'MALE', 'FEMALE', 'OTHER'],
  },
  // Parent (guardian) reference
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
  },
  // Unique per school (e.g. admission number)
  admissionNumber: {
    type: String,
    trim: true,
  },
  // Registration workflow
  isApproved: {
    type: Boolean,
    default: true,
  },
  proposedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // School and classroom references
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  // New canonical classroom field
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
  },
  // Legacy field (kept for compatibility)
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
  parentEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  // Registration workflow (teacher proposes, headteacher approves)
  status: {
    type: String,
    enum: ['active', 'graduated', 'transferred', 'pending', 'rejected', 'PENDING', 'ACTIVE', 'REJECTED'],
    default: 'active',
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // teacher who proposed
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // headteacher who approved
  },
  approvedAt: {
    type: Date,
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
  // Teacher-proposed changes to an existing (approved) student — applied only after headteacher approval
  pendingEdit: {
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    proposedAt: {
      type: Date,
    },
    fullName: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String },
    parentName: { type: String, trim: true },
    parentEmail: { type: String, trim: true, lowercase: true },
    parentPhone: { type: String, trim: true },
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
    },
  },
}, {
  timestamps: true,
});

// Keep classroom and classroomId in sync for old/new code
studentSchema.pre('validate', function syncClassroom(next) {
  if (this.classroom && !this.classroomId) this.classroomId = this.classroom;
  if (this.classroomId && !this.classroom) this.classroom = this.classroomId;
  next();
});

// Indexes for faster queries
studentSchema.index({ schoolId: 1 });
studentSchema.index({ classroomId: 1 });
studentSchema.index({ classroom: 1 });
studentSchema.index({ parent: 1 });
studentSchema.index({ parentPhone: 1 });
studentSchema.index({ isFlagged: 1 });
// admissionNumber unique per school
studentSchema.index({ schoolId: 1, admissionNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Student', studentSchema);
