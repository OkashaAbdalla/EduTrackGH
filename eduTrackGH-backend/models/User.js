/**
 * User Model
 * Supports: Teacher, Headteacher, Parent, Admin roles
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: false,
    default: '',
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false, // Don't return password by default
  },
  role: {
    type: String,
    enum: ['teacher', 'headteacher', 'parent', 'admin'],
    default: 'parent', // Default to parent for public registration
  },
  // Headteacher-specific: Primary or JHS level
  schoolLevel: {
    type: String,
    enum: ['PRIMARY', 'JHS'],
    sparse: true, // Only required for headteachers
  },
  // Teacher-specific fields
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    sparse: true,
  },
  classroomIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
  }],
  // Headteacher-specific fields
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    sparse: true,
  },
  // Verification
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true,
  },
  // Parent-specific: linked children
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  }],
  // Profile photo (headteacher for now)
  avatarUrl: {
    type: String,
    default: '',
  },
  avatarPublicId: {
    type: String,
    default: '',
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    role: this.role,
    schoolLevel: this.schoolLevel, // PRIMARY or JHS for headteachers
    schoolId: this.schoolId,
    school: this.school,
    isVerified: this.isVerified,
    isActive: this.isActive,
    avatarUrl: this.avatarUrl,
  };
};

module.exports = mongoose.model('User', userSchema);
