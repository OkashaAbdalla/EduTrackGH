/**
 * Mark Attendance Page
 * Phases 4–6: Sequential marking, photo capture or manual verification, no bulk/skip.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import classroomService from '../../services/classroomService';
import attendanceService from '../../services/attendanceService';
import { useToast } from '../../context';

const MANUAL_REASONS = [
  'Camera unavailable',
  'Poor lighting',
  'Device limitation',
  'Other',
];

const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB
const CAPTURE_QUALITY = 0.82;

const MarkAttendance = () => {
  const { showToast } = useToast();
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [classLoading, setClassLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [entries, setEntries] = useState([]);

  const [currentStatus, setCurrentStatus] = useState(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(null);
  const [currentVerificationType, setCurrentVerificationType] = useState(null);
  const [currentManualReason, setCurrentManualReason] = useState('');
  const [currentManualOther, setCurrentManualOther] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState(null);

  const fetchClassrooms = useCallback(async () => {
    try {
      setInitialLoading(true);
      const response = await classroomService.getTeacherClassrooms();
      if (response.success && response.classrooms?.length > 0) {
        setClassrooms(response.classrooms);
        if (response.classrooms.length === 1) setSelectedClass(response.classrooms[0]._id);
        setError(null);
      } else {
        setError('No classrooms assigned. Contact your headteacher to be assigned a class.');
        setClassrooms([]);
      }
    } catch (err) {
      setError('Failed to load classrooms.');
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => { fetchClassrooms(); }, [fetchClassrooms]);

  const fetchStudents = useCallback(async () => {
    if (!selectedClass) return;
    try {
      setClassLoading(true);
      setError(null);
      const response = await classroomService.getClassroomStudents(selectedClass);
      if (response.success && response.students) {
        setStudents(response.students);
        setCurrentIndex(0);
        setEntries([]);
        setCurrentStatus(null);
        setCurrentPhotoUrl(null);
        setCurrentVerificationType(null);
        setCurrentManualReason('');
        setCurrentManualOther('');
      } else {
        setError('Failed to load students.');
      }
    } catch (err) {
      setError('Error loading students.');
    } finally {
      setClassLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, [selectedClass, selectedDate]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (err) {
      setCameraError('Camera access denied or unavailable. Use Manual Verification.');
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  const compressImage = (blob) => {
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
  };

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !cameraActive) return;
    setCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', CAPTURE_QUALITY));
      if (!blob) throw new Error('Capture failed');
      const compressed = await compressImage(blob);
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(compressed);
      });
      setUploading(true);
      const res = await attendanceService.uploadPhoto(base64);
      setUploading(false);
      if (res.success && res.photoUrl) {
        setCurrentPhotoUrl(res.photoUrl);
        setCurrentVerificationType('photo');
        setCurrentManualReason('');
        setCurrentManualOther('');
        stopCamera();
      } else {
        showToast(res.message || 'Upload failed', 'error');
      }
    } catch (err) {
      setCapturing(false);
      setUploading(false);
      showToast('Failed to capture or upload photo', 'error');
    } finally {
      setCapturing(false);
    }
  }, [cameraActive, stopCamera, showToast]);

  const setManualVerification = useCallback((reason, other = '') => {
    setCurrentVerificationType('manual');
    setCurrentManualReason(reason);
    setCurrentManualOther(other);
    setCurrentPhotoUrl(null);
    stopCamera();
  }, [stopCamera]);

  const canCompleteCurrent = () => {
    if (!currentStatus) return false;
    if (currentStatus === 'absent' || currentStatus === 'late') return true;
    if (currentStatus === 'present') {
      if (currentVerificationType === 'photo' && currentPhotoUrl) return true;
      if (currentVerificationType === 'manual') {
        const reason = currentManualReason === 'Other' ? currentManualOther.trim() : currentManualReason;
        return !!reason;
      }
    }
    return false;
  };

  const completeCurrent = useCallback(() => {
    if (!canCompleteCurrent() || currentIndex >= students.length) return;
    const student = students[currentIndex];
    let manualReason = null;
    if (currentVerificationType === 'manual') {
      manualReason = currentManualReason === 'Other' ? currentManualOther.trim() || 'Other' : currentManualReason;
    }
    setEntries((prev) => [
      ...prev,
      {
        studentId: student._id,
        status: currentStatus,
        photoUrl: currentPhotoUrl || undefined,
        verificationType: currentStatus === 'present' ? (currentVerificationType || 'manual') : 'manual',
        manualReason: manualReason || undefined,
        markedAt: new Date().toISOString(),
        location: location || undefined,
      },
    ]);
    setCurrentIndex((i) => i + 1);
    setCurrentStatus(null);
    setCurrentPhotoUrl(null);
    setCurrentVerificationType(null);
    setCurrentManualReason('');
    setCurrentManualOther('');
    setCameraError(null);
  }, [canCompleteCurrent, currentIndex, currentStatus, currentPhotoUrl, currentVerificationType, currentManualReason, currentManualOther, students, location]);

  const allDone = currentIndex >= students.length && students.length > 0;

  const handleSubmit = async () => {
    if (!selectedClass || !allDone || entries.length === 0) return;
    setSaving(true);
    try {
      const response = await attendanceService.markDailyAttendance(selectedClass, selectedDate, entries);
      if (response.success) {
        showToast(`Attendance saved for ${response.count ?? entries.length} students.`, 'success');
        setEntries([]);
        setCurrentIndex(0);
      } else {
        showToast(response.message || 'Failed to save attendance', 'error');
      }
    } catch (err) {
      showToast('Failed to save attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your classrooms...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentStudent = students[currentIndex];
  const stats = {
    present: entries.filter((e) => e.status === 'present').length,
    absent: entries.filter((e) => e.status === 'absent').length,
    late: entries.filter((e) => e.status === 'late').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mark Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Mark one student at a time. Present requires photo or manual reason.</p>
        </div>

        {error && (
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </Card>
        )}

        {classrooms.length > 0 && (
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Choose a class...</option>
                  {classrooms.map((cls) => (
                    <option key={cls._id} value={cls._id}>{cls.name} (Grade {cls.grade})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </Card>
        )}

        {classLoading && (
          <Card className="p-12">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
            </div>
          </Card>
        )}

        {!classLoading && students.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Present</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.present}</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Late</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.late}</p>
              </Card>
            </div>

            {!allDone && currentStudent && (
              <Card className="p-6 border-2 border-green-500 dark:border-green-600">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Student {currentIndex + 1} of {students.length}
                </p>
                <p className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
                  {currentStudent.fullName}
                </p>

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
                          <button
                            type="button"
                            onClick={() => { setCurrentPhotoUrl(null); setCurrentVerificationType(null); }}
                            className="text-sm text-gray-500 hover:underline"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {!cameraActive ? (
                              <button
                                type="button"
                                onClick={startCamera}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                              >
                                Take Photo
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={capturePhoto}
                                  disabled={capturing || uploading}
                                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                                >
                                  {capturing || uploading ? 'Capturing...' : 'Capture'}
                                </button>
                                <button type="button" onClick={stopCamera} className="px-4 py-2 bg-gray-500 text-white rounded-lg">
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                          {cameraActive && (
                            <div className="rounded-lg overflow-hidden bg-black max-w-sm">
                              <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
                            </div>
                          )}
                          {cameraError && (
                            <p className="text-amber-600 dark:text-amber-400 text-sm">{cameraError}</p>
                          )}

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
            )}

            {allDone && (
              <Card className="p-6">
                <p className="text-green-600 dark:text-green-400 font-medium mb-4">All students marked.</p>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Submit Attendance'}
                </button>
              </Card>
            )}
          </>
        )}

        {!classLoading && selectedClass && students.length === 0 && (
          <Card className="p-12 text-center text-gray-500 dark:text-gray-400">
            No students found for this class.
          </Card>
        )}

        {!selectedClass && classrooms.length > 0 && !classLoading && (
          <Card className="p-12 text-center text-gray-500 dark:text-gray-400">
            Select your class to mark attendance.
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MarkAttendance;
