/**
 * Cloudinary upload utility (uses config/cloudinary.js)
 * Phase 5: Upload attendance photo; returns URL. No base64 stored in DB.
 */

const { cloudinary, isConfigured } = require('../config/cloudinary');

const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

/**
 * Upload base64 image (e.g. from canvas/data URL)
 * @param {string} base64Data - data URL or raw base64
 * @returns {Promise<{ success: boolean, url?: string, message?: string }>}
 */
async function uploadAttendancePhoto(base64Data) {
  if (!isConfigured()) {
    return { success: false, message: 'Cloudinary not configured' };
  }

  if (!base64Data || typeof base64Data !== 'string') {
    return { success: false, message: 'Invalid image data' };
  }

  // Strip data URL prefix if present
  const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const sizeEstimate = (base64.length * 3) / 4;
  if (sizeEstimate > MAX_SIZE_BYTES) {
    return { success: false, message: 'Image too large (max 1MB). Compress before upload.' };
  }

  try {
    const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64}`, {
      folder: 'edutrack-attendance',
      resource_type: 'image',
      transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
    });
    return { success: true, url: result.secure_url };
  } catch (err) {
    console.warn('Cloudinary upload error:', err.message);
    return { success: false, message: err.message || 'Upload failed' };
  }
}

module.exports = {
  isConfigured,
  uploadAttendancePhoto,
};
