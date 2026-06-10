/**
 * Google Sign-In — sign-in only (no account creation).
 * Allowed roles: parent, teacher, headteacher.
 */

const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { getSystemSettings } = require('../services/adminConfigService');

const ALLOWED_ROLES = ['parent', 'teacher', 'headteacher'];

let oauthClient = null;

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  if (!oauthClient) oauthClient = new OAuth2Client(clientId);
  return oauthClient;
}

const writeAuthAudit = (req) => {
  try {
    const AuthAuditLog = require('../models/AuthAuditLog');
    const meta = {
      ipAddress:
        req.headers['x-forwarded-for']?.split(',')?.[0]?.trim() ||
        req.ip ||
        req.socket?.remoteAddress ||
        '',
      userAgent: req.headers['user-agent'] || '',
    };
    return ({ user, email, action }) =>
      AuthAuditLog.create({
        userId: user?._id || null,
        email: String(email || user?.email || '').toLowerCase().trim(),
        role: user?.role || null,
        action,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        timestamp: new Date(),
      }).catch(() => {});
  } catch {
    return () => Promise.resolve();
  }
};

const googleAuth = async (req, res) => {
  const audit = writeAuthAudit(req);

  try {
    const idToken = String(req.body?.token || req.body?.credential || '').trim();
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google token is required' });
    }

    const client = getOAuthClient();
    if (!client) {
      return res.status(503).json({
        success: false,
        code: 'GOOGLE_NOT_CONFIGURED',
        message: 'Google sign-in is not configured on the server.',
      });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = String(payload?.email || '').toLowerCase().trim();
    const googleId = payload?.sub;

    if (!email || !payload?.email_verified) {
      await audit({ email, action: 'FAILED_LOGIN' });
      return res.status(401).json({
        success: false,
        message: 'Google account email is not verified.',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      await audit({ email, action: 'FAILED_LOGIN' });
      return res.status(404).json({
        success: false,
        code: 'ACCOUNT_NOT_FOUND',
        message:
          'No EduTrack GH account exists for this Google email. Parents can use Create Account first; teachers and headteachers must be added by their school.',
      });
    }

    if (['admin', 'super_admin'].includes(user.role)) {
      await audit({ user, action: 'FAILED_LOGIN' });
      return res.status(403).json({
        success: false,
        message: 'Administrators must use the secure admin portal.',
      });
    }

    if (!ALLOWED_ROLES.includes(user.role)) {
      await audit({ user, action: 'FAILED_LOGIN' });
      return res.status(403).json({
        success: false,
        message: 'Google sign-in is not available for this account type.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    const systemSettings = await getSystemSettings();
    if (systemSettings.system?.maintenanceMode) {
      return res.status(503).json({
        success: false,
        code: 'MAINTENANCE',
        message: 'The system is under maintenance. Please try again later.',
      });
    }

    let updated = false;
    if (!user.isVerified) {
      user.isVerified = true;
      updated = true;
    }
    if (googleId && user.googleId !== googleId) {
      user.googleId = googleId;
      updated = true;
    }
    if (updated) await user.save();

    const token = generateToken(user._id);
    await audit({ user, action: 'LOGIN' });

    return res.json({
      success: true,
      message: 'Google sign-in successful',
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('Google auth error:', error.message);
    await audit({ action: 'FAILED_LOGIN' });
    return res.status(401).json({
      success: false,
      message: 'Google sign-in failed. Please try again or use email and password.',
    });
  }
};

module.exports = { googleAuth };
