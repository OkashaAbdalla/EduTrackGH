/**
 * Authentication Controller (Under 130 lines)
 */

const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const { uploadProfilePhoto, deleteImage } = require('../utils/cloudinary');

const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const phone = (req.body.phone && String(req.body.phone).trim()) || '';

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ success: false, message: 'Phone number already registered' });
      }
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Default role is 'parent' for public registration. Phone optional (email notifications only).
    const user = await User.create({
      fullName, email, phone, password, role: 'parent', verificationToken,
    });

    // Try to send verification email (don't fail registration if email fails)
    try {
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      await sendEmail({
        to: email,
        subject: 'Verify Your Email - EduTrack GH',
        html: emailTemplates.verification(fullName, verificationLink),
      });
    } catch (emailError) {
      console.error('⚠️  Failed to send verification email:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email.',
      user: user.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // SECURITY: Block admin login on public endpoint - must use admin-only endpoint
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrators must use the secure admin portal.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const rawToken = req.body?.token ?? req.query?.token;
    const token = typeof rawToken === 'string' ? rawToken.trim() : String(rawToken || '').trim();
    if (!token) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

// Check whether a user is already verified (useful when token is reused/expired)
const checkVerificationStatus = async (req, res) => {
  try {
    const { email } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, isVerified: !!user.isVerified });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to check status' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('school', 'name')
      .populate('schoolId', 'name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const profile = user.getPublicProfile();
    // Add schoolName for headteachers (school) or teachers (schoolId)
    const schoolDoc = user.school || user.schoolId;
    profile.schoolName = schoolDoc && schoolDoc.name ? schoolDoc.name : null;

    res.json({ success: true, user: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get user data' });
  }
};

const uploadProfilePhotoHandler = async (req, res) => {
  try {
    if (req.user.role !== 'headteacher') {
      return res.status(403).json({ success: false, message: 'Only headteachers can update profile photo' });
    }
    const { image } = req.body || {};
    const upload = await uploadProfilePhoto(image);
    if (!upload.success) {
      return res.status(400).json({ success: false, message: upload.message || 'Upload failed' });
    }

    if (req.user.avatarPublicId) {
      await deleteImage(req.user.avatarPublicId);
    }

    req.user.avatarUrl = upload.url;
    req.user.avatarPublicId = upload.publicId;
    await req.user.save();

    return res.json({ success: true, avatarUrl: upload.url });
  } catch (error) {
    console.error('uploadProfilePhoto error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload profile photo' });
  }
};

const deleteProfilePhotoHandler = async (req, res) => {
  try {
    if (req.user.role !== 'headteacher') {
      return res.status(403).json({ success: false, message: 'Only headteachers can update profile photo' });
    }

    if (req.user.avatarPublicId) {
      await deleteImage(req.user.avatarPublicId);
    }

    req.user.avatarUrl = '';
    req.user.avatarPublicId = '';
    await req.user.save();

    return res.json({ success: true });
  } catch (error) {
    console.error('deleteProfilePhoto error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete profile photo' });
  }
};

const logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: email,
      subject: 'Verify Your Email - EduTrack GH',
      html: emailTemplates.verification(user.fullName, verificationLink),
    });

    res.json({ success: true, message: 'Verification email sent!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to resend email' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const genericMessage = 'If this email exists, a reset link has been sent.';
    if (!email) return res.json({ success: true, message: genericMessage });

    const user = await User.findOne({ email, role: 'parent' }).select('_id fullName email role');
    if (!user) return res.json({ success: true, message: genericMessage });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt,
        },
      }
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    setImmediate(() => {
      sendEmail({
        to: user.email,
        subject: 'Reset Your Password - EduTrack GH',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 16px;">
              <h2 style="color:#006838;">Password Reset Request</h2>
              <p>Hello ${user.fullName || 'Parent'},</p>
              <p>We received a request to reset your EduTrack GH parent account password.</p>
              <p>
                Click this link to reset your password:
                <br />
                <a href="${resetLink}">${resetLink}</a>
              </p>
              <p>This link expires in 30 minutes and can only be used once.</p>
              <p>If you did not request this, you can ignore this email.</p>
            </div>
          </body>
          </html>
        `,
      }).catch((err) => console.error('forgotPassword email error:', err.message));
    });

    return res.json({ success: true, message: genericMessage });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to process request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const token = String(req.body?.token || '').trim();
    const newPassword = String(req.body?.password || '');
    const confirmPassword = String(req.body?.confirmPassword || '');

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'token, password and confirmPassword are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      role: 'parent',
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select('+password +passwordResetTokenHash +passwordResetExpiresAt');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.passwordResetTokenHash = '';
    user.passwordResetExpiresAt = undefined;
    await user.save();

    return res.json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

/**
 * Admin-only login - MUST be called from isolated admin endpoint only.
 * Rejects non-admin users even with correct credentials.
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for administrators only.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  verifyEmail,
  checkVerificationStatus,
  getMe,
  logout,
  resendVerification,
  forgotPassword,
  resetPassword,
  uploadProfilePhotoHandler,
  deleteProfilePhotoHandler,
};
