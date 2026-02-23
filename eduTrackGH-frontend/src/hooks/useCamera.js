/**
 * useCamera Hook - Simplified version
 * Purpose: Custom hook for camera/webcam operations
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const useCamera = (options = {}) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const {
    maxImageSize = 1024 * 1024, // 1MB
    maxDimension = 1024,
    startQuality = 0.82,
    minQuality = 0.4,
  } = options;

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by your browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Force state update
        console.log('Camera started, setting isStreaming to true');
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found');
      } else {
        setError('Failed to access camera');
      }
      
      setIsStreaming(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    setError(null);
  }, []);

  const compressCanvasToBase64 = useCallback((sourceCanvas) => {
    return new Promise((resolve) => {
      const targetCanvas = document.createElement('canvas');
      let targetWidth = sourceCanvas.width;
      let targetHeight = sourceCanvas.height;

      if (targetWidth > maxDimension || targetHeight > maxDimension) {
        const ratio = Math.min(maxDimension / targetWidth, maxDimension / targetHeight);
        targetWidth = Math.round(targetWidth * ratio);
        targetHeight = Math.round(targetHeight * ratio);
      }

      targetCanvas.width = targetWidth;
      targetCanvas.height = targetHeight;
      const ctx = targetCanvas.getContext('2d');
      ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

      let quality = startQuality;
      const tryExport = () => {
        targetCanvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(sourceCanvas.toDataURL('image/jpeg', startQuality));
              return;
            }
            if (blob.size <= maxImageSize || quality <= minQuality) {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => resolve(sourceCanvas.toDataURL('image/jpeg', minQuality));
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
    });
  }, []);

  const captureImage = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !isStreaming) {
        reject(new Error('Camera is not active'));
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        const video = videoRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        compressCanvasToBase64(canvas).then(resolve);
      } catch (err) {
        reject(new Error('Failed to capture image'));
      }
    });
  }, [compressCanvasToBase64, isStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    startCamera,
    stopCamera,
    captureImage,
    isStreaming,
    error,
  };
};

export default useCamera;
