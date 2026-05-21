/**
 * General Helper Utilities
 * Purpose: Reusable utility functions
 */

// Format date to readable string
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Format time to readable string
export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Convert image file to base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

import { getApiBaseUrl, useDevApiProxy } from './envApi';

/** Resolve API-relative avatar paths for img src */
export const resolveAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) {
    if (useDevApiProxy()) return url;
    const api = getApiBaseUrl();
    const origin = api.replace(/\/api\/?$/, '');
    return `${origin}${url}`;
  }
  return url;
};

/** Append or replace cache-bust param so replaced photos reload in the browser */
export const withAvatarCacheBust = (url, version = Date.now()) => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  const base = url.split('?')[0];
  return `${base}?v=${version}`;
};

/** Cloudinary delivery URL sized for crisp avatars/thumbnails */
export const getOptimizedImageUrl = (url, { width = 128, height = 128, crop = 'fill' } = {}) => {
  const resolved = resolveAvatarUrl(url);
  if (!resolved || !resolved.includes('res.cloudinary.com') || !resolved.includes('/upload/')) {
    return resolved;
  }
  const qIndex = resolved.indexOf('?');
  const pathPart = qIndex >= 0 ? resolved.slice(0, qIndex) : resolved;
  const queryPart = qIndex >= 0 ? resolved.slice(qIndex) : '';
  const transform = `w_${width},h_${height},c_${crop},q_auto:best,f_auto,dpr_2.0`;
  return pathPart.replace('/upload/', `/upload/${transform}/`) + queryPart;
};

// Compress image file to base64 (profile photos, etc.)
export const compressImageFile = (
  file,
  {
    maxDimension = 384,
    maxSizeBytes = 480 * 1024,
    startQuality = 0.92,
    minQuality = 0.72,
    mimeType = 'image/jpeg',
  } = {}
) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxDimension || h > maxDimension) {
        const r = Math.min(maxDimension / w, maxDimension / h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
      ctx.drawImage(img, 0, 0, w, h);

      let quality = startQuality;
      const tryExport = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(canvas.toDataURL('image/jpeg', minQuality));
              return;
            }
            if (blob.size <= maxSizeBytes || quality <= minQuality) {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => resolve(canvas.toDataURL('image/jpeg', minQuality));
              reader.readAsDataURL(blob);
              return;
            }
            quality -= 0.1;
            tryExport();
          },
          mimeType,
          quality
        );
      };
      tryExport();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
