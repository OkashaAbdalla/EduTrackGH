/**
 * Email Service Configuration (Nodemailer)
 */

const nodemailer = require('nodemailer');

const getEmailConfig = () => {
  const service = String(process.env.EMAIL_SERVICE || '').trim();
  const user = String(
    process.env.EMAIL_USER ||
      process.env.SMTP_USER ||
      process.env.SMTP_USERNAME ||
      ''
  ).trim();
  const pass = String(
    process.env.EMAIL_PASSWORD ||
      process.env.SMTP_PASS ||
      process.env.SMTP_PASSWORD ||
      ''
  ).trim();
  const host = String(process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || 0) || undefined;
  const secure = String(process.env.SMTP_SECURE || '').trim().toLowerCase() === 'true';
  const from = String(process.env.EMAIL_FROM || user || '').trim();
  return { service, user, pass, host, port, secure, from };
};

const isEmailConfigured = () => {
  const cfg = getEmailConfig();
  // service-based transport (gmail, outlook...) or explicit SMTP host.
  return !!cfg.user && !!cfg.pass && (!!cfg.service || !!cfg.host);
};

const createTransporter = () => {
  const cfg = getEmailConfig();
  if (!isEmailConfigured()) return null;

  const baseAuth = { user: cfg.user, pass: cfg.pass };
  if (cfg.host) {
    return nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port || 587,
      secure: cfg.secure || (cfg.port === 465),
      auth: baseAuth,
    });
  }

  return nodemailer.createTransport({
    service: cfg.service || 'gmail',
    auth: baseAuth,
  });
};

const transporter = createTransporter();

if (!transporter) {
  console.warn('⚠️ Email disabled: missing EMAIL/SMTP credentials in environment.');
} else {
  transporter.verify((error) => {
    if (error) {
      console.error('❌ Email configuration error:', error.message);
    } else {
      console.log('✅ Email service ready');
    }
  });
}

module.exports = { transporter, isEmailConfigured, getEmailConfig };
