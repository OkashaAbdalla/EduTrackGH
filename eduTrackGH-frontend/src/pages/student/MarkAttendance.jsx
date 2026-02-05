/**
 * Mark Attendance Page - Face capture (Clean version under 100 lines)
 */

import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { ROUTES } from '../../utils/constants';

const MarkAttendance = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(err => console.error('Play error:', err));
          };
        }
      }, 0);
      
      setCameraActive(true);
    } catch (err) {
      alert('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const captureImage = async () => {
    setCapturing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate(ROUTES.ACTIVE_SESSIONS);
    } catch (err) { alert('Failed to capture'); } finally { setCapturing(false); }
  };

  useEffect(() => () => { if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop()); }, []);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-full">
        <div className="text-center mb-2">
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Face Recognition Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400 text-xs">Secure biometric verification</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg mb-2 w-full max-w-md">
          <div className="flex items-center justify-center mb-2">
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden shadow-inner" style={{ width: '100%', aspectRatio: '4/3' }}>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ display: cameraActive ? 'block' : 'none', transform: 'scaleX(-1)' }} />
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-1.5 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-700">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-xs font-medium">Camera Inactive</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {!cameraActive ? (
              <button onClick={startCamera} className="flex-1 bg-green-600 text-white py-1.5 rounded-lg font-medium hover:bg-green-700 transition text-xs">
                Activate Camera
              </button>
            ) : (
              <>
                <button onClick={captureImage} disabled={capturing} className="flex-1 bg-green-600 text-white py-1.5 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 text-xs">
                  {capturing ? 'Processing...' : 'Capture & Submit'}
                </button>
                <button onClick={stopCamera} className="px-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-1.5 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition text-xs">
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5 w-full max-w-md">
          {[{ icon: '💡', text: 'Good Light' }, { icon: '🎯', text: 'Center Face' }, { icon: '�', text: 'No Glasses' }, { icon: '👀', text: 'Look Direct' }, { icon: '😐', text: 'Neutral' }].map((item, idx) => (
            <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-1.5 text-center transition hover:scale-105 cursor-pointer">
              <div className="text-base mb-0.5">{item.icon}</div>
              <p className="text-[10px] text-blue-900 dark:text-blue-300 font-medium">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MarkAttendance;
