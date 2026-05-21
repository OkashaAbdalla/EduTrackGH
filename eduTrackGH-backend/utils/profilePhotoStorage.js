/**
 * Profile photo storage — Cloudinary when configured, else local uploads folder.
 */

const fs = require('fs');
const path = require('path');
const {
  isConfigured: isCloudinaryConfigured,
  uploadProfilePhoto: cloudinaryUpload,
  deleteImage,
} = require('./cloudinary');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'profiles');
const MAX_BYTES = 2 * 1024 * 1024;

const parseBase64Input = (base64Data) => {
  const value = String(base64Data || '').trim();
  if (!value) return { buffer: null, ext: 'jpg' };

  if (value.startsWith('data:') && value.includes('base64,')) {
    const [header, data] = value.split(',');
    const mimeMatch = header.match(/^data:image\/(\w+);base64$/);
    const ext = mimeMatch ? (mimeMatch[1] === 'jpeg' ? 'jpg' : mimeMatch[1]) : 'jpg';
    return { buffer: Buffer.from(data || '', 'base64'), ext };
  }

  return { buffer: Buffer.from(value, 'base64'), ext: 'jpg' };
};

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function localFilePath(userId, ext = 'jpg') {
  return path.join(UPLOAD_DIR, `${userId}.${ext}`);
}

function localPublicUrl(userId, ext = 'jpg') {
  return `/api/uploads/profiles/${userId}.${ext}?v=${Date.now()}`;
}

function isLocalAvatarUrl(url) {
  return typeof url === 'string' && url.includes('/api/uploads/profiles/');
}

function deleteAllLocalAvatarsForUser(userId) {
  if (!userId) return;
  ensureUploadDir();
  const id = String(userId);
  const prefix = `${id}.`;
  try {
    for (const name of fs.readdirSync(UPLOAD_DIR)) {
      if (name.startsWith(prefix)) {
        try {
          fs.unlinkSync(path.join(UPLOAD_DIR, name));
        } catch (err) {
          console.warn('deleteAllLocalAvatarsForUser:', err.message);
        }
      }
    }
  } catch (err) {
    console.warn('deleteAllLocalAvatarsForUser:', err.message);
  }
}

function deleteLocalAvatar(url) {
  if (!isLocalAvatarUrl(url)) return;
  const name = path.basename(url.split('?')[0]);
  const file = path.join(UPLOAD_DIR, name);
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
    } catch (err) {
      console.warn('deleteLocalAvatar:', err.message);
    }
  }
}

/**
 * @param {string} base64Data
 * @param {string} userId
 */
async function saveProfilePhoto(base64Data, userId) {
  if (!base64Data || typeof base64Data !== 'string') {
    return { success: false, message: 'Invalid image data' };
  }

  if (isCloudinaryConfigured()) {
    return cloudinaryUpload(base64Data);
  }

  const { buffer, ext } = parseBase64Input(base64Data);
  if (!buffer || !buffer.length) {
    return { success: false, message: 'Invalid image data' };
  }
  if (buffer.length > MAX_BYTES) {
    return { success: false, message: 'Image too large (max 2MB). Compress before upload.' };
  }

  try {
    ensureUploadDir();
    deleteAllLocalAvatarsForUser(userId);
    const filePath = localFilePath(userId, ext);
    fs.writeFileSync(filePath, buffer);
    return {
      success: true,
      url: localPublicUrl(userId, ext),
      publicId: '',
      storage: 'local',
    };
  } catch (err) {
    console.warn('saveProfilePhoto local error:', err.message);
    return { success: false, message: err.message || 'Failed to save profile photo' };
  }
}

async function removeProfilePhoto(user) {
  if (!user) return { success: true };
  if (user.avatarPublicId && isCloudinaryConfigured()) {
    return deleteImage(user.avatarPublicId);
  }
  if (user.avatarUrl) {
    deleteLocalAvatar(user.avatarUrl);
  }
  deleteAllLocalAvatarsForUser(user._id || user.id);
  return { success: true };
}

module.exports = {
  saveProfilePhoto,
  removeProfilePhoto,
  isCloudinaryConfigured,
  UPLOAD_DIR,
};
