/**
 * useMarkAttendance – data and handlers for teacher Mark Attendance page
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import classroomService from '../services/classroomService';
import attendanceService from '../services/attendanceService';
import { useToast } from '../context';
import { compressImageForAttendance } from '../utils/attendancePhoto';

const CAPTURE_QUALITY = 0.82;

export function useMarkAttendance() {
  const { showToast } = useToast();
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
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
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

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
      } else setError('Failed to load students.');
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
      const compressed = await compressImageForAttendance(blob);
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
      } else showToast(res.message || 'Upload failed', 'error');
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

  const canCompleteCurrent = useCallback(() => {
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
  }, [currentStatus, currentVerificationType, currentPhotoUrl, currentManualReason, currentManualOther]);

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

  const handleSubmit = useCallback(async () => {
    if (!selectedClass || !allDone || entries.length === 0) return;
    setSaving(true);
    try {
      const response = await attendanceService.markDailyAttendance(selectedClass, selectedDate, entries);
      if (response.success) {
        showToast(`Attendance saved for ${response.count ?? entries.length} students.`, 'success');
        setEntries([]);
        setCurrentIndex(0);
      } else showToast(response.message || 'Failed to save attendance', 'error');
    } catch (err) {
      showToast('Failed to save attendance', 'error');
    } finally {
      setSaving(false);
    }
  }, [selectedClass, selectedDate, entries, allDone, showToast]);

  return {
    classrooms,
    selectedClass,
    setSelectedClass,
    selectedDate,
    setSelectedDate,
    students,
    initialLoading,
    classLoading,
    saving,
    error,
    currentIndex,
    entries,
    currentStatus,
    setCurrentStatus,
    currentPhotoUrl,
    setCurrentPhotoUrl,
    currentVerificationType,
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
    allDone,
    handleSubmit,
  };
}
