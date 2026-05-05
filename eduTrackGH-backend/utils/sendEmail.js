/**
 * Backward compatibility wrapper.
 * All email logic now lives in services/emailService (Brevo Transactional API).
 */

const { sendEmail, emailTemplates } = require('../services/emailService');

module.exports = { sendEmail, emailTemplates };
