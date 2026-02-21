/**
 * SMS Service - Hubtel API (Ghana)
 * Sends SMS to parent phone numbers. No-op if credentials are not configured.
 */

const https = require('https');

const HUBTEL_CLIENT_ID = process.env.HUBTEL_CLIENT_ID;
const HUBTEL_CLIENT_SECRET = process.env.HUBTEL_CLIENT_SECRET;
const HUBTEL_BASE = 'api.hubtel.com';

function isConfigured() {
  return Boolean(HUBTEL_CLIENT_ID && HUBTEL_CLIENT_SECRET);
}

/**
 * Normalize phone to Ghana format (233XXXXXXXXX)
 * @param {string} phone - e.g. 0571234567, 233571234567, +233571234567
 * @returns {string}
 */
function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('233')) return digits;
  if (digits.startsWith('0')) return '233' + digits.slice(1);
  return '233' + digits;
}

/**
 * Send SMS via Hubtel Messaging API (POST)
 * @param {string} to - Recipient phone (will be normalized)
 * @param {string} message - SMS content
 * @param {string} [from] - Sender name (optional, Hubtel may use default)
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
function sendSms(to, message, from = 'EduTrack GH') {
  if (!isConfigured()) {
    return Promise.resolve({
      success: false,
      message: 'SMS not configured (missing HUBTEL_CLIENT_ID or HUBTEL_CLIENT_SECRET)',
    });
  }

  const normalizedTo = normalizePhone(to);
  if (normalizedTo.length < 12) {
    return Promise.resolve({ success: false, message: 'Invalid phone number' });
  }

  return new Promise((resolve) => {
    const payload = JSON.stringify({
      From: from,
      To: normalizedTo,
      Content: message.substring(0, 160),
    });

    const auth = Buffer.from(`${HUBTEL_CLIENT_ID}:${HUBTEL_CLIENT_SECRET}`).toString('base64');
    const options = {
      hostname: HUBTEL_BASE,
      path: '/v1/messages/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Basic ${auth}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true });
        } else {
          try {
            const parsed = JSON.parse(data);
            resolve({ success: false, message: parsed.message || parsed.error || data });
          } catch {
            resolve({ success: false, message: data || `HTTP ${res.statusCode}` });
          }
        }
      });
    });

    req.on('error', (err) => {
      console.error('Hubtel SMS request error:', err.message);
      resolve({ success: false, message: err.message });
    });
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, message: 'Request timeout' });
    });
    req.write(payload);
    req.end();
  });
}

module.exports = {
  sendSms,
  isConfigured,
  normalizePhone,
};
