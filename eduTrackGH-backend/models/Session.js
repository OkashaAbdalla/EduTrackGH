/**
 * Session Model
 * Represents an attendance session created by a lecturer
 */

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
  },
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    trim: true,
    uppercase: true,
  },
  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lecturerName: {
    type: String,
    required: true,
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: 15,
    max: 240,
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Statistics
  totalAttendees: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Calculate endTime before saving
sessionSchema.pre('save', function(next) {
  if (this.isNew && !this.endTime) {
    this.endTime = new Date(this.startTime.getTime() + this.duration * 60000);
  }
  next();
});

// Method to check if session is expired
sessionSchema.methods.isExpired = function() {
  return new Date() > this.endTime;
};

// Method to get time remaining
sessionSchema.methods.getTimeRemaining = function() {
  const now = new Date();
  const diff = this.endTime - now;
  return Math.max(0, Math.floor(diff / 60000)); // minutes
};

module.exports = mongoose.model('Session', sessionSchema);
