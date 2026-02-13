/**
 * Classroom Model
 * Represents a classroom in a school
 */

const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Classroom name is required'],
    trim: true,
  },

  grade: {
    type: String,
    required: [true, 'Grade is required'],
    trim: true,
  },

  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true, // define index directly here
  },

  // Teacher assigned to this classroom
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true, // define index ONLY here (no schema.index below)
  },

  // Student count
  studentCount: {
    type: Number,
    default: 0,
  },

  // Status
  isActive: {
    type: Boolean,
    default: true,
  },

}, {
  timestamps: true,
});

module.exports = mongoose.model('Classroom', classroomSchema);
