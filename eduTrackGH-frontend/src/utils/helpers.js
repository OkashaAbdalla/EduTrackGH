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

// Compress image file to base64 (profile photos, etc.)
export const compressImageFile = (
  file,
  { maxDimension = 512, maxSizeBytes = 300 * 1024, startQuality = 0.82, minQuality = 0.4 } = {}
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
          'image/jpeg',
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
