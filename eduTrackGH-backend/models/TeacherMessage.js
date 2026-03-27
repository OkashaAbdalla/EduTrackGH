/**
 * TeacherMessage Model
 * Teacher -> Headteacher communication (attendance unlock / corrections)
 */

const mongoose = require('mongoose');

const teacherMessageSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    headteacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    attendanceDate: { type: Date, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['attendance_unlock'],
      default: 'attendance_unlock',
    },
    status: {
      type: String,
      enum: ['pending', 'resolved'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

teacherMessageSchema.index({ headteacherId: 1, createdAt: -1 });

module.exports = mongoose.model('TeacherMessage', teacherMessageSchema);

