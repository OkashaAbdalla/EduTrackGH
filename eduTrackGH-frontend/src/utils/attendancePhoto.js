/**
 * Compress image blob for attendance photo upload (max 1MB, max dimension 1024).
 */

const MAX_IMAGE_SIZE = 1024 * 1024;
const CAPTURE_QUALITY = 0.82;

export function compressImageForAttendance(blob) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > 1024 || h > 1024) {
        const r = Math.min(1024 / w, 1024 / h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      let quality = CAPTURE_QUALITY;
      const tryExport = () => {
        canvas.toBlob(
          (b) => {
            if (b && b.size <= MAX_IMAGE_SIZE) {
              resolve(b);
              return;
            }
            if (quality <= 0.3) {
              resolve(b || blob);
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
    img.src = url;
  });
}
