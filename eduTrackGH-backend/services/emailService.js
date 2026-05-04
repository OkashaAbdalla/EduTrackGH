const nodemailer = require('nodemailer');

const APP_NAME = 'EduTrack GH';

const normalizeBaseUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw || !/^https?:\/\//i.test(raw)) return '';
  return raw.replace(/\/+$/, '');
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getEmailConfig = () => ({
  smtpUser: String(process.env.BREVO_SMTP_USER || '').trim(),
  smtpPass: String(process.env.BREVO_SMTP_PASS || '').trim(),
  from: String(process.env.BREVO_FROM_EMAIL || '').trim(),
  host: String(process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com').trim(),
  port: Number(process.env.BREVO_SMTP_PORT || 587) || 587,
});

const isEmailConfigured = () => {
  const cfg = getEmailConfig();
  return !!cfg.smtpUser && !!cfg.smtpPass && !!cfg.from;
};

const getFrontendBaseUrl = (fallback = '') =>
  normalizeBaseUrl(
    process.env.FRONTEND_URL || process.env.CLIENT_URL || process.env.APP_URL || fallback || 'http://localhost:5173'
  );

const buildFrontendUrl = (pathWithQuery, fallbackBase = '') => {
  const base = getFrontendBaseUrl(fallbackBase);
  const route = String(pathWithQuery || '').startsWith('/') ? pathWithQuery : `/${pathWithQuery || ''}`;
  return `${base}${route}`;
};

/** Nodemailer "from" header: supports plain email or `Display Name <email>`. */
const getMailFrom = () => {
  const raw = getEmailConfig().from;
  if (!raw) return '';
  if (/^[\s\S]*<[^>]+>\s*$/.test(raw)) return raw;
  return `"EduTrackGH" <${raw}>`;
};

let transporter = null;

const getTransporter = () => {
  const cfg = getEmailConfig();
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: false,
      auth: {
        user: cfg.smtpUser,
        pass: cfg.smtpPass,
      },
    });
  }
  return transporter;
};

const renderEmailFrame = ({ title, intro, contentHtml }) => `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <div style="max-width: 600px; margin: 0 auto; padding: 16px;">
        <div style="background:#006838;color:#fff;padding:14px 16px;border-radius:8px 8px 0 0;">
          <h1 style="margin:0;font-size:20px;">${APP_NAME}</h1>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:0;padding:16px;border-radius:0 0 8px 8px;background:#fff;">
          <h2 style="color:#111;margin:0 0 10px 0;">${title}</h2>
          ${intro ? `<p style="margin:0 0 12px 0;">${intro}</p>` : ''}
          ${contentHtml || ''}
          <p style="font-size:12px;color:#666;margin-top:22px;">
            ${APP_NAME} - Intelligent absenteeism monitoring for primary and JHS schools.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
          <small style="color:#888;">Digital presence. Protected learning.</small>
        </div>
      </div>
    </body>
  </html>
`;

const sendEmail = async ({ to, subject, html }) => {
  if (!isEmailConfigured()) {
    const err = new Error(
      'Email service is not configured on the server. Set BREVO_SMTP_USER, BREVO_SMTP_PASS, and BREVO_FROM_EMAIL.'
    );
    err.code = 'EMAIL_NOT_CONFIGURED';
    throw err;
  }

  const transport = getTransporter();
  try {
    const info = await transport.sendMail({
      from: getMailFrom(),
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId || '' };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message, '| code:', error.code || 'N/A');
    const sendErr = new Error(error.message || 'Brevo SMTP failed to deliver email');
    sendErr.code = error.code || 'BREVO_SMTP_FAILED';
    throw sendErr;
  }
};

const sendVerificationEmail = async (email, token, options = {}) => {
  const name = escapeHtml(options.fullName || 'User');
  const verificationLink =
    options.verificationLink || buildFrontendUrl(`/verify-email?token=${encodeURIComponent(token || '')}`);
  const html = renderEmailFrame({
    title: 'Verify Your Email',
    intro: `Welcome ${name}! Please verify your email address to activate your ${APP_NAME} account.`,
    contentHtml: `
      <p>Click the button below to verify your account:</p>
      <p><a href="${verificationLink}" style="display:inline-block;padding:12px 20px;background:#006838;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a></p>
      <p style="word-break: break-all;"><strong>Or use this link:</strong><br/>${verificationLink}</p>
    `,
  });
  return sendEmail({
    to: email,
    subject: 'Verify Your Email',
    html,
  });
};

const sendPasswordResetEmail = async (email, token, options = {}) => {
  const name = escapeHtml(options.fullName || 'User');
  const resetLink =
    options.resetLink || buildFrontendUrl(`/reset-password?token=${encodeURIComponent(token || '')}`);
  const html = renderEmailFrame({
    title: 'Reset Your Password',
    intro: `Hello ${name}, we received a request to reset your ${APP_NAME} password.`,
    contentHtml: `
      <p>Use the button below to reset your password:</p>
      <p><a href="${resetLink}" style="display:inline-block;padding:12px 20px;background:#006838;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
      <p style="word-break: break-all;"><strong>Or use this link:</strong><br/>${resetLink}</p>
      <p>This link expires in 30 minutes and can only be used once.</p>
    `,
  });
  return sendEmail({
    to: email,
    subject: 'Reset Your Password',
    html,
  });
};

const sendParentNotificationEmail = async (email, data = {}) => {
  const studentName = escapeHtml(data.studentName || 'Student');
  const statusLabel = escapeHtml(data.statusLabel || 'Update');
  const dateIso = escapeHtml(data.dateIso || '');
  const schoolName = escapeHtml(data.schoolName || 'School');
  const message = escapeHtml(data.message || 'There is a new attendance update for your child.');
  const html = renderEmailFrame({
    title: 'Student Attendance Update',
    intro: message,
    contentHtml: `
      <p>
        <strong>Student:</strong> ${studentName}<br/>
        <strong>Date:</strong> ${dateIso}<br/>
        <strong>Status:</strong> ${statusLabel}<br/>
        <strong>School:</strong> ${schoolName}
      </p>
    `,
  });
  return sendEmail({
    to: email,
    subject: 'Student Attendance Update',
    html,
  });
};

const emailTemplates = {
  accountWelcome: ({ name, email, tempPassword, loginUrl, accountType, createdByText, introParagraph }) =>
    renderEmailFrame({
      title: `Welcome to ${APP_NAME}`,
      intro: `Hello ${escapeHtml(name)}!`,
      contentHtml: `
        ${introParagraph || `<p>Your ${escapeHtml(accountType)} account has been created by ${escapeHtml(createdByText)}.</p>`}
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Temporary Password:</strong> ${escapeHtml(tempPassword)}</p>
        ${loginUrl ? `<p><strong>Login:</strong> <a href="${loginUrl}">${loginUrl}</a></p>` : ''}
        <p>Please change your password after first login.</p>
      `,
    }),
  headteacherWelcome: (name, email, tempPassword, loginUrl) =>
    emailTemplates.accountWelcome({
      name,
      email,
      tempPassword,
      loginUrl,
      accountType: 'headteacher',
      createdByText: 'the system administrator',
    }),
  teacherWelcome: (name, email, tempPassword, loginUrl, headteacherName) =>
    emailTemplates.accountWelcome({
      name,
      email,
      tempPassword,
      loginUrl,
      accountType: 'teacher',
      createdByText: '',
      introParagraph: `<p>Your teacher account has been created by your headteacher.${headteacherName ? ` ${escapeHtml(headteacherName)}` : ''}</p>`,
    }),
  adminTeacherWelcome: (name, email, tempPassword, loginUrl) =>
    emailTemplates.accountWelcome({
      name,
      email,
      tempPassword,
      loginUrl,
      accountType: 'teacher',
      createdByText: 'the system administrator',
    }),
  chatMessageFromHeadteacher: (headteacherName, schoolName, message) =>
    renderEmailFrame({
      title: `Message from ${escapeHtml(headteacherName)}`,
      intro: `You have a new message from your headteacher.`,
      contentHtml: `
        <p><strong>School:</strong> ${escapeHtml(schoolName || 'Your school')}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message || '')}</p>
      `,
    }),
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendParentNotificationEmail,
  isEmailConfigured,
  getEmailConfig,
  getFrontendBaseUrl,
  buildFrontendUrl,
  emailTemplates,
};
