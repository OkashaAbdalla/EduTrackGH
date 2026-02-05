/**
 * useCamera Hook - Simplified version
 * Purpose: Custom hook for camera/webcam operations
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const useCamera = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

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
        
        const base64Image = canvas.toDataURL('image/jpeg', 0.9);
        resolve(base64Image);
      } catch (err) {
        reject(new Error('Failed to capture image'));
      }
    });
  }, [isStreaming]);

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
