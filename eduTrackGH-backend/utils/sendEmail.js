/**
 * Backward compatibility wrapper.
 * All email logic now lives in services/emailService (Brevo SMTP via Nodemailer).
 */

const { sendEmail, emailTemplates } = require('../services/emailService');

module.exports = { sendEmail, emailTemplates };
