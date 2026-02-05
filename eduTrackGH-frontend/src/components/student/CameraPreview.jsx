/**
 * Camera Preview Component
 * Purpose: Compact professional camera preview
 */

const CameraPreview = ({ videoRef, cameraActive }) => {
  return (
    <div className="flex items-center justify-center mb-2">
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden shadow-inner" style={{ width: '100%', aspectRatio: '4/3' }}>
        {!cameraActive ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-1.5 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-700">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-400 text-xs font-medium">Camera Inactive</p>
              <p className="text-gray-500 text-[10px] mt-0.5">Click "Activate Camera" to begin</p>
            </div>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative" style={{ width: '45%', aspectRatio: '3/4' }}>
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-400"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-400"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-400"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-400"></div>
                <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-green-500/90 px-2 py-0.5 rounded-full">
                  <p className="text-white text-[10px] font-medium whitespace-nowrap">Position face here</p>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraPreview;
