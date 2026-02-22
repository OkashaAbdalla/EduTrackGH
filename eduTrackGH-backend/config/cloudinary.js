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

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

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
