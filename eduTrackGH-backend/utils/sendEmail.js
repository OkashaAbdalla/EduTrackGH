/**
 * Email Sending Utility
 */

const { transporter, isEmailConfigured, getEmailConfig } = require('../config/email');

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!isEmailConfigured() || !transporter) {
      const configError = new Error(
        'Email service is not configured on the server. Set EMAIL_USER/EMAIL_PASSWORD or SMTP_* variables.'
      );
      configError.code = 'EMAIL_NOT_CONFIGURED';
      throw configError;
    }

    const emailCfg = getEmailConfig();
    const mailOptions = {
      from: `"EduTrack GH" <${emailCfg.from}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to: ${to}`);
    console.log(`   Message ID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted || [],
      rejected: info.rejected || [],
      envelope: info.envelope,
    };
  } catch (error) {
    console.error(
      '❌ Email sending failed:',
      error.message,
      '| code:',
      error.code || 'N/A',
      '| responseCode:',
      error.responseCode || 'N/A'
    );
    throw error;
  }
};

// Email templates
const emailTemplates = {
  verification: (name, verificationLink) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #006838; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 30px; background: #006838; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>EduTrack GH</h1>
        </div>
        <div class="content">
          <h2>Welcome, ${name}!</h2>
          <p>Thank you for registering with EduTrack GH - Absenteeism Tracker for Basic Schools.</p>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationLink}" class="button">Verify Email</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #006838;">${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
        <div class="footer">
          <p>EduTrack GH - Digital absenteeism tracking for Primary and JHS schools</p>
          <p>If you didn't create this account, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  accountWelcome: ({ name, email, tempPassword, loginUrl, accountType, createdByText, introParagraph }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #006838; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .credentials { background: white; padding: 15px; border-left: 4px solid #006838; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>EduTrack GH</h1>
        </div>
        <div class="content">
          <h2>Welcome, ${name}!</h2>
          ${introParagraph || `<p>Your ${accountType} account has been created by ${createdByText}.</p>`}
          <div class="credentials">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          ${loginUrl ? `<p><strong>Login:</strong> <a href="${loginUrl}">${loginUrl}</a></p>` : ''}
          <p><strong>Important:</strong> Please change your password after your first login.</p>
          <p>You can now log in and start managing your school's attendance tracking.</p>
        </div>
        <div class="footer">
          <p>EduTrack GH - Digital absenteeism tracking for Primary and JHS schools</p>
          <p>For support, contact the system administrator.</p>
        </div>
      </div>
    </body>
    </html>
  `,

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
      introParagraph: `<p>Your teacher account has been created by your headteacher.${headteacherName ? ` ${headteacherName}` : ''}</p>`,
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

  chatMessageFromHeadteacher: (headteacherName, schoolName, message) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #006838; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .message-box { background: white; padding: 15px; border-left: 4px solid #006838; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>EduTrack GH</h1></div>
        <div class="content">
          <h2>New message from ${headteacherName}</h2>
          <p><strong>School:</strong> ${schoolName || 'Your school'}</p>
          <div class="message-box"><p>${(message || '').replace(/</g, '&lt;')}</p></div>
          <p>Log in to EduTrack GH to reply.</p>
        </div>
        <div class="footer">
          <p>EduTrack GH - Digital absenteeism tracking for Primary and JHS schools</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

module.exports = { sendEmail, emailTemplates };
