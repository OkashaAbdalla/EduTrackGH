/**
 * Cloudinary upload utility (uses config/cloudinary.js)
 * Phase 5: Upload attendance photo; returns URL. No base64 stored in DB.
 */

const { cloudinary, isConfigured } = require('../config/cloudinary');

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB (project requirement)

const parseBase64Input = (base64Data) => {
  const value = String(base64Data || '').trim();
  if (!value) return { base64: '', mime: 'image/jpeg' };

  if (value.startsWith('data:') && value.includes('base64,')) {
    const [header, data] = value.split(',');
    const mimeMatch = header.match(/^data:(.+);base64$/);
    return {
      base64: data || '',
      mime: mimeMatch ? mimeMatch[1] : 'image/jpeg',
    };
  }

  return { base64: value, mime: 'image/jpeg' };
};

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

  // Strip data URL prefix if present and capture mime
  const { base64, mime } = parseBase64Input(base64Data);
  const sizeEstimate = (base64.length * 3) / 4;
  if (sizeEstimate > MAX_SIZE_BYTES) {
    return { success: false, message: 'Image too large (max 2MB). Compress before upload.' };
  }

  try {
    const result = await cloudinary.uploader.upload(`data:${mime};base64,${base64}`, {
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

/**
 * Upload profile photo (headteacher)
 * @param {string} base64Data
 * @returns {Promise<{ success: boolean, url?: string, publicId?: string, message?: string }>}
 */
async function uploadProfilePhoto(base64Data) {
  if (!isConfigured()) {
    return { success: false, message: 'Cloudinary not configured' };
  }

  if (!base64Data || typeof base64Data !== 'string') {
    return { success: false, message: 'Invalid image data' };
  }

  const { base64, mime } = parseBase64Input(base64Data);
  const sizeEstimate = (base64.length * 3) / 4;
  if (sizeEstimate > MAX_SIZE_BYTES) {
    return { success: false, message: 'Image too large (max 2MB). Compress before upload.' };
  }

  try {
    const result = await cloudinary.uploader.upload(`data:${mime};base64,${base64}`, {
      folder: 'edutrack-profiles',
      resource_type: 'image',
      transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
    });
    return { success: true, url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    console.warn('Cloudinary upload error:', err.message);
    return { success: false, message: err.message || 'Upload failed' };
  }
}

/**
 * Delete image by public ID
 * @param {string} publicId
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
async function deleteImage(publicId) {
  if (!isConfigured()) {
    return { success: false, message: 'Cloudinary not configured' };
  }
  if (!publicId) {
    return { success: true };
  }
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    return { success: true };
  } catch (err) {
    console.warn('Cloudinary delete error:', err.message);
    return { success: false, message: err.message || 'Delete failed' };
  }
}

module.exports = {
  isConfigured,
  uploadAttendancePhoto,
  uploadProfilePhoto,
  deleteImage,
};
