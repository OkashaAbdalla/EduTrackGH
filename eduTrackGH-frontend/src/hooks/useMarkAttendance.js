/**
 * useMarkAttendance – data and handlers for teacher Mark Attendance page
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import classroomService from '../services/classroomService';
import attendanceService from '../services/attendanceService';
import { useToast, useCalendar } from '../context';
import { compressImageForAttendance } from '../utils/attendancePhoto';
import { isGeoFenceConfigured, haversineMeters } from '../utils/geo';

const CAPTURE_QUALITY = 0.82;

const LAST_GOOD_GEO_KEY = 'edutrack_last_good_geo_v1';

function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getLastGoodGeo(maxAgeMs = 60_000) {
  const raw = localStorage.getItem(LAST_GOOD_GEO_KEY);
  const parsed = raw ? safeParseJson(raw) : null;
  if (!parsed || typeof parsed !== 'object') return null;
  const { latitude, longitude, accuracy, ts } = parsed;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(ts)) return null;
  if (Date.now() - ts > maxAgeMs) return null;
  return { latitude, longitude, accuracy: Number.isFinite(accuracy) ? accuracy : null };
}

function setLastGoodGeo({ latitude, longitude, accuracy }) {
  localStorage.setItem(
    LAST_GOOD_GEO_KEY,
    JSON.stringify({
      latitude,
      longitude,
      accuracy: Number.isFinite(accuracy) ? accuracy : null,
      ts: Date.now(),
    })
  );
}

function readStablePosition({
  samples = 4,
  maxAccuracyM = 25,
  timeoutMs = 12_000,
  perSampleTimeoutMs = 6_000,
} = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('no geolocation'));
      return;
    }

    const good = [];
    const startedAt = Date.now();

    const done = (pos) => {
      try {
        if (watchId != null) navigator.geolocation.clearWatch(watchId);
      } catch {
        // ignore
      }
      clearTimeout(hardTimeout);
      resolve(pos);
    };

    const fail = (err) => {
      try {
        if (watchId != null) navigator.geolocation.clearWatch(watchId);
      } catch {
        // ignore
      }
      clearTimeout(hardTimeout);
      reject(err);
    };

    const finalizeFromGood = () => {
      if (!good.length) return null;
      const avgLat = good.reduce((s, p) => s + p.latitude, 0) / good.length;
      const avgLng = good.reduce((s, p) => s + p.longitude, 0) / good.length;
      const avgAcc = good.reduce((s, p) => s + (p.accuracy || 0), 0) / good.length;
      return { latitude: avgLat, longitude: avgLng, accuracy: avgAcc };
    };

    const accept = (p) => {
      const latitude = Number(p?.coords?.latitude);
      const longitude = Number(p?.coords?.longitude);
      const accuracy = Number(p?.coords?.accuracy);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      if (Number.isFinite(accuracy) && accuracy > maxAccuracyM) return; // noisy reading
      good.push({ latitude, longitude, accuracy: Number.isFinite(accuracy) ? accuracy : null });
      if (good.length >= samples) {
        const averaged = finalizeFromGood();
        if (averaged) done(averaged);
      }
    };

    // Try to use a very recent cached good reading first (reduces refresh jitter).
    const cached = getLastGoodGeo(30_000);
    if (cached && Number.isFinite(cached.latitude) && Number.isFinite(cached.longitude)) {
      // Still continue sampling in background for a better reading, but use cached quickly.
      // If we get at least 1 good fresh sample, we will return the averaged fresh result instead.
      good.push({ latitude: cached.latitude, longitude: cached.longitude, accuracy: cached.accuracy });
    }

    const hardTimeout = setTimeout(() => {
      const averaged = finalizeFromGood();
      if (averaged) done(averaged);
      else fail(new Error('geo timeout'));
    }, timeoutMs);

    let watchId = null;
    try {
      watchId = navigator.geolocation.watchPosition(
        (p) => {
          accept(p);
          if (Date.now() - startedAt > perSampleTimeoutMs && good.length > 0) {
            const averaged = finalizeFromGood();
            if (averaged) done(averaged);
          }
        },
        (err) => {
          const averaged = finalizeFromGood();
          if (averaged) done(averaged);
          else fail(err || new Error('geo error'));
        },
        {
          enableHighAccuracy: true,
          timeout: perSampleTimeoutMs,
          maximumAge: 5_000,
        }
      );
    } catch (err) {
      const averaged = finalizeFromGood();
      if (averaged) done(averaged);
      else fail(err || new Error('geo error'));
    }
  });
}

export function useMarkAttendance() {
  const { showToast } = useToast();
  const { engine } = useCalendar();
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
  const [geoSubmitState, setGeoSubmitState] = useState('idle');
  const [geoMessage, setGeoMessage] = useState('');
  const [geoDistanceM, setGeoDistanceM] = useState(null);
  const [isDateLocked, setIsDateLocked] = useState(false);
  const [lockStatusLoading, setLockStatusLoading] = useState(false);
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

  const selectedClassroom = useMemo(
    () => classrooms.find((c) => c._id === selectedClass) || null,
    [classrooms, selectedClass]
  );

  const needsGeoFence = useMemo(() => {
    const sch = selectedClassroom?.schoolId;
    if (!sch || typeof sch !== 'object') return false;
    return isGeoFenceConfigured(sch);
  }, [selectedClassroom]);

  const setSelectedDateSafe = useCallback(
    (nextDate) => {
      const levelRef = selectedClassroom?.grade || selectedClassroom?.level || '';
      if (nextDate && !engine.isSchoolDay(nextDate, levelRef)) {
        showToast('Selected date is not a valid GES school day.', 'error');
        return;
      }
      setSelectedDate(nextDate);
    },
    [selectedClassroom, showToast, engine]
  );

  // Check if selected date is locked when class + date change
  useEffect(() => {
    if (!selectedClass || !selectedDate) {
      setIsDateLocked(false);
      return;
    }
    let cancelled = false;
    setLockStatusLoading(true);
    attendanceService.getAttendanceLockStatus(selectedClass, selectedDate).then((res) => {
      if (!cancelled) {
        setIsDateLocked(!!(res.success && res.locked));
        setLockStatusLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setIsDateLocked(false);
        setLockStatusLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, [selectedClass, selectedDate]);

  const runGeoPreview = useCallback(() => {
    const sch = selectedClassroom?.schoolId;
    if (!needsGeoFence || !sch?.location) return;
    setGeoSubmitState('checking');
    setGeoMessage('Verifying your location…');
    setGeoDistanceM(null);
    readStablePosition()
      .then((pos) => {
        const lat = pos.latitude;
        const lng = pos.longitude;
        const accuracy = pos.accuracy;
        const { latitude: slat, longitude: slng, radius } = sch.location;
        const dist = haversineMeters(lat, lng, slat, slng);
        const d = Math.round(dist);
        setLastGoodGeo({ latitude: lat, longitude: lng, accuracy });
        if (import.meta?.env?.DEV) {
          // Debug stability of readings (DEV only)
          console.log({ lat, lng, accuracy, distance: d });
        }
        setGeoDistanceM(d);
        if (dist <= radius) {
          setGeoSubmitState('ok');
          setGeoMessage(`You are within the school boundary (~${d}m from center).`);
        } else {
          setGeoSubmitState('blocked');
          setGeoMessage(`You are about ${d}m from the school center. You must be within ${radius}m to submit.`);
        }
      })
      .catch(() => {
        setGeoSubmitState('unavailable');
        setGeoMessage('Location access is required to submit attendance while the school boundary is set. Allow location in your browser and try again.');
        setGeoDistanceM(null);
      });
  }, [needsGeoFence, selectedClassroom]);

  const startCamera = useCallback(async () => {
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Your browser does not support camera access. Use Manual Verification.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      console.error('startCamera error:', err);
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

  // When camera is active and both stream and video element exist,
  // attach the stream and explicitly call play() to avoid black preview.
  useEffect(() => {
    if (!cameraActive || !streamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    try {
      const playPromise = video.play && video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(() => {
          // Autoplay errors are non-fatal; user already clicked a button.
        });
      }
    } catch (err) {
      console.error('video.play error:', err);
    }
  }, [cameraActive]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !cameraActive) return;
    setCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      // Un-mirror capture so it matches real-world orientation (and preview)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
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

  useEffect(() => {
    if (!allDone || !needsGeoFence) {
      setGeoSubmitState('idle');
      setGeoMessage('');
      setGeoDistanceM(null);
      return;
    }
    runGeoPreview();
  }, [allDone, needsGeoFence, runGeoPreview]);

  const submitBlockedByGeo = needsGeoFence && geoSubmitState !== 'ok';

  const handleSubmit = useCallback(async () => {
    if (!selectedClass || !allDone || entries.length === 0) return;
    const levelRef = selectedClassroom?.grade || selectedClassroom?.level || '';
    if (!engine.isSchoolDay(selectedDate, levelRef)) {
      showToast(
        'Attendance cannot be marked on weekends, holidays, BECE days, or during vacation per GES policy.',
        'error'
      );
      return;
    }
    let coords = {};
    if (needsGeoFence) {
      const sch = selectedClassroom?.schoolId;
      if (!sch?.location) {
        showToast('School location is not configured. Contact your headteacher.', 'error');
        return;
      }
      try {
        const pos = await readStablePosition();
        coords = {
          latitude: pos.latitude,
          longitude: pos.longitude,
          accuracy: pos.accuracy,
        };
        setLastGoodGeo(coords);
        const dist = haversineMeters(
          coords.latitude,
          coords.longitude,
          sch.location.latitude,
          sch.location.longitude
        );
        if (import.meta?.env?.DEV) {
          // Debug stability of readings (DEV only)
          console.log({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy, distance: Math.round(dist) });
        }
        if (dist > sch.location.radius) {
          showToast(
            `You must be within school premises to mark attendance. You are about ${Math.round(dist)}m from the school center.`,
            'error'
          );
          return;
        }
      } catch {
        showToast('You must be within school premises to mark attendance. Allow location access and try again.', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const response = await attendanceService.markDailyAttendance(
        selectedClass,
        selectedDate,
        entries,
        coords
      );
      if (response.success) {
        showToast(`Attendance saved for ${response.count ?? entries.length} students.`, 'success');
        setEntries([]);
        setCurrentIndex(0);
        setIsDateLocked(true);
      } else showToast(response.message || 'Failed to save attendance', 'error');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save attendance';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }, [
    selectedClass,
    selectedDate,
    entries,
    allDone,
    showToast,
    selectedClassroom,
    needsGeoFence,
    engine,
  ]);

  return {
    classrooms,
    selectedClass,
    isDateLocked,
    lockStatusLoading,
    setSelectedClass,
    selectedDate,
    setSelectedDate: setSelectedDateSafe,
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
    needsGeoFence,
    geoSubmitState,
    geoMessage,
    geoDistanceM,
    refreshGeoPreview: runGeoPreview,
    submitBlockedByGeo,
  };
}
