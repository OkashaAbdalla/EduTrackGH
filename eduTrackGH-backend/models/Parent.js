/**
 * Parent Model
 * Guardian/contact record (not necessarily a User account)
 * Can have multiple students
 */

const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
  },
  { timestamps: true }
);

// If email exists, it must be unique
parentSchema.index({ email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Parent', parentSchema);
