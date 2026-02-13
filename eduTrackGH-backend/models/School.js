/**
 * School Model
 * Represents a school in the system
 */

const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
  },
  schoolLevel: {
    type: String,
    enum: ['PRIMARY', 'JHS', 'BOTH'],
    required: [true, 'School level is required'],
  },
  location: {
    region: {
      type: String,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  contact: {
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  // Headteacher reference
  headteacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
  },
  // School status
  isActive: {
    type: Boolean,
    default: true,
  },
  // Statistics (can be calculated, but cached for performance)
  totalTeachers: {
    type: Number,
    default: 0,
  },
  totalStudents: {
    type: Number,
    default: 0,
  },
  totalClassrooms: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index for faster queries
schoolSchema.index({ name: 1 });
schoolSchema.index({ schoolLevel: 1 });
schoolSchema.index({ 'location.region': 1 });

module.exports = mongoose.model('School', schoolSchema);
