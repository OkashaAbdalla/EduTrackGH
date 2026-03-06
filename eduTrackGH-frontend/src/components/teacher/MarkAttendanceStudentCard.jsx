/**
 * Current student card for Mark Attendance – status, verification, confirm
 */

import { Card } from '../common';

const MANUAL_REASONS = ['Camera unavailable', 'Poor lighting', 'Device limitation', 'Other'];

export default function MarkAttendanceStudentCard({
  currentStudent,
  currentIndex,
  studentsLength,
  currentStatus,
  setCurrentStatus,
  currentPhotoUrl,
  setCurrentPhotoUrl,
  setCurrentVerificationType,
  currentManualReason,
  setCurrentManualReason,
  currentManualOther,
  setCurrentManualOther,
  videoRef,
  cameraActive,
  cameraError,
  capturing,
  uploading,
  startCamera,
  stopCamera,
  capturePhoto,
  setManualVerification,
  canCompleteCurrent,
  completeCurrent,
}) {
  if (!currentStudent) return null;

  return (
    <Card className="p-6 border-2 border-green-500 dark:border-green-600">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        Student {currentIndex + 1} of {studentsLength}
      </p>
      <p className="font-semibold text-lg text-gray-900 dark:text-white mb-4">{currentStudent.fullName}</p>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</p>
          <div className="flex gap-2">
            {['present', 'late', 'absent'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setCurrentStatus(s);
                  if (s !== 'present') {
                    setCurrentPhotoUrl(null);
                    setCurrentVerificationType('manual');
                    setCurrentManualReason('');
                    setCurrentManualOther('');
                    stopCamera();
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium capitalize ${
                  currentStatus === s
                    ? s === 'present'
                      ? 'bg-green-600 text-white'
                      : s === 'late'
                      ? 'bg-orange-600 text-white'
                      : 'bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {currentStatus === 'present' && (
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4 space-y-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Verification</p>
            {currentPhotoUrl ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <span>Photo captured</span>
                <button type="button" onClick={() => { setCurrentPhotoUrl(null); setCurrentVerificationType(null); }} className="text-sm text-gray-500 hover:underline">Change</button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {!cameraActive ? (
                    <button type="button" onClick={startCamera} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">Take Photo</button>
                  ) : (
                    <>
                      <button type="button" onClick={capturePhoto} disabled={capturing || uploading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50">
                        {capturing || uploading ? 'Capturing...' : 'Capture'}
                      </button>
                      <button type="button" onClick={stopCamera} className="px-4 py-2 bg-gray-500 text-white rounded-lg">Cancel</button>
                    </>
                  )}
                </div>
                {cameraActive && (
                  <div className="rounded-lg overflow-hidden bg-black max-w-sm">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
                  </div>
                )}
                {cameraError && <p className="text-amber-600 dark:text-amber-400 text-sm">{cameraError}</p>}
                <div className="pt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Or use manual verification:</p>
                  <select
                    value={currentManualReason}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCurrentManualReason(v);
                      if (v) setManualVerification(v, currentManualOther);
                    }}
                    className="w-full max-w-xs px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="">Select reason...</option>
                    {MANUAL_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {currentManualReason === 'Other' && (
                    <input
                      type="text"
                      placeholder="Specify reason"
                      value={currentManualOther}
                      onChange={(e) => setCurrentManualOther(e.target.value)}
                      className="mt-2 w-full max-w-xs px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div className="pt-4">
          <button
            type="button"
            onClick={completeCurrent}
            disabled={!canCompleteCurrent()}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg"
          >
            Confirm & Next
          </button>
        </div>
      </div>
    </Card>
  );
}
