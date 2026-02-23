/**
 * Cloudinary Configuration
 * Attendance photo upload. Credentials from .env.
 * If 'cloudinary' package is not installed, exports cloudinary: null and isConfigured: false.
 */

let cloudinary = null;
try {
  cloudinary = require('cloudinary').v2;
} catch (e) {
  // Package not installed; server still starts, photo upload uses manual verification
}

let CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
let API_KEY = process.env.CLOUDINARY_API_KEY;
let API_SECRET = process.env.CLOUDINARY_API_SECRET;

const CLOUDINARY_URL = process.env.CLOUDINARY_URL;

const tryParseCloudinaryUrl = (value) => {
  if (!value || typeof value !== 'string') return;
  if (!value.startsWith('cloudinary://')) return;
  try {
    const parsed = new URL(value);
    const [key, secret] = parsed.username ? [parsed.username, parsed.password] : ['', ''];
    const name = parsed.hostname || '';
    if (!CLOUD_NAME && name) CLOUD_NAME = name;
    if (!API_KEY && key) API_KEY = key;
    if (!API_SECRET && secret) API_SECRET = secret;
  } catch (err) {
    // Ignore parse errors; fall back to explicit env vars
  }
};

tryParseCloudinaryUrl(CLOUDINARY_URL);
tryParseCloudinaryUrl(CLOUD_NAME);

function isConfigured() {
  return Boolean(cloudinary && CLOUD_NAME && API_KEY && API_SECRET);
}

if (isConfigured()) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
  });
}

module.exports = {
  cloudinary,
  isConfigured,
};
