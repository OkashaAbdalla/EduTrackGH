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
    const { token } = req.body;
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

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user: user.getPublicProfile() });
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
  getMe,
  logout,
  resendVerification,
  uploadProfilePhotoHandler,
  deleteProfilePhotoHandler,
};
