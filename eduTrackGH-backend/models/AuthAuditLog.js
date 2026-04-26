const mongoose = require('mongoose');

const authAuditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, trim: true, lowercase: true },
    role: { type: String, trim: true, index: true },
    action: {
      type: String,
      enum: ['LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'PASSWORD_RESET'],
      required: true,
      index: true,
    },
    ipAddress: { type: String, trim: true, default: '' },
    userAgent: { type: String, trim: true, default: '' },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

authAuditLogSchema.index({ email: 1, timestamp: -1 });

module.exports = mongoose.model('AuthAuditLog', authAuditLogSchema);
