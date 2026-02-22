/**
 * Verify Cloudinary config (run from backend folder: node scripts/verifyCloudinary.js)
 * Does not upload anything; only checks that config loads and isConfigured() is true.
 */
require('dotenv').config();

const { isConfigured } = require('../config/cloudinary');

console.log('Cloudinary config check:');
console.log('  CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ set' : '✗ missing');
console.log('  CLOUDINARY_API_KEY:   ', process.env.CLOUDINARY_API_KEY ? '✓ set' : '✗ missing');
console.log('  CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✓ set' : '✗ missing');
console.log('  cloudinary package:   ', require('../config/cloudinary').cloudinary ? '✓ loaded' : '✗ not installed');
console.log('');
if (isConfigured()) {
  console.log('✅ Cloudinary is configured and ready for photo upload.');
} else {
  console.log('❌ Cloudinary is NOT configured. Add credentials to .env and ensure npm install was run.');
  process.exit(1);
}
