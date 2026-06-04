/**
 * useMarkAttendance – data and handlers for teacher Mark Attendance page
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import classroomService from '../services/classroomService';
import attendanceService from '../services/attendanceService';
import { useToast, useCalendar, useSocket } from '../context';
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

/**
 * Fast position for fence checks. `watchPosition` + multi-sample often took 8–18s. We use `getCurrentPosition`
 * (first fix wins) and a 13s cap. Same fence rules in callers (haversine + radius). Wi‑Fi/desktop fixes allowed.
 * Reuses a localStorage fix from the last 20s so “preview + submit” does not wait twice.
 * Use { bypassCache: true } when the user taps “Refresh location” so a new fix is requested.
 */
const ATTENDANCE_GEO_MAX_MS = 13_000;

function coordsFromGeolocationPosition(position) {
  const latitude = Number(position?.coords?.latitude);
  const longitude = Number(position?.coords?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const accuracy = Number(position?.coords?.accuracy);
  return {
    latitude,
    longitude,
    accuracy: Number.isFinite(accuracy) ? accuracy : null,
  };
}

function readStablePosition({ bypassCache = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('no geolocation'));
      return;
    }

    const startedAt = Date.now();
    const remainingMs = () => ATTENDANCE_GEO_MAX_MS - (Date.now() - startedAt);

    const getOnce = (geoOpts, budgetCapMs) => {
      const cap = Math.min(budgetCapMs, Math.max(500, remainingMs() - 100));
      if (cap < 450) return Promise.reject(new Error('timeout'));
      return new Promise((res, rej) => {
        const t = setTimeout(() => rej(new Error('timeout')), cap + 150);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(t);
            res(pos);
          },
          (err) => {
            clearTimeout(t);
            rej(err || new Error('geo'));
          },
          { ...geoOpts, timeout: cap }
        );
      });
    };

    (async () => {
      if (!bypassCache) {
        const recent = getLastGoodGeo(20_000);
        if (recent) {
          resolve(recent);
          return;
        }
      }

      const attempts = [
        { opts: { enableHighAccuracy: true, maximumAge: 0 }, budget: 5000 },
        { opts: { enableHighAccuracy: false, maximumAge: 600000 }, budget: 4000 },
        { opts: { enableHighAccuracy: false, maximumAge: 0 }, budget: 3500 },
      ];

      for (const { opts, budget } of attempts) {
        if (remainingMs() < 400) break;
        try {
          const pos = await getOnce(opts, budget);
          const c = coordsFromGeolocationPosition(pos);
          if (c) {
            resolve(c);
            return;
          }
        } catch {
          /* next */
        }
      }
      reject(new Error('geo timeout'));
    })();
  });
}

export function useMarkAttendance() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { socket } = useSocket();
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
  const [existingRecords, setExistingRecords] = useState(() => new Map());
  const [correctionMode, setCorrectionMode] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [pendingCorrections, setPendingCorrections] = useState([]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const prevLockedRef = useRef(false);

  const fetchClassrooms = useCallback(async () => {
    try {
      setInitialLoading(true);
      const response = await classroomService.getTeacherClassrooms();
      if (response.success && response.classrooms?.length > 0) {
        setClassrooms(response.classrooms);
        const urlClass = searchParams.get('classroomId');
        const urlDate = searchParams.get('date');
        if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
          setSelectedDate(urlDate);
        }
        if (urlClass && response.classrooms.some((c) => String(c._id) === urlClass)) {
          setSelectedClass(urlClass);
        } else if (response.classrooms.length === 1) {
          setSelectedClass(response.classrooms[0]._id);
        }
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
  }, [searchParams]);

  useEffect(() => { fetchClassrooms(); }, [fetchClassrooms]);

  const fetchStudents = useCallback(async () => {
    if (!selectedClass) return;
    try {
      setClassLoading(true);
      setError(null);
      setStudentSearch('');
      setSelectedStudentId(null);
      setPendingCorrections([]);
      const studentsRes = await classroomService.getClassroomStudents(selectedClass);
      if (studentsRes.success && studentsRes.students) {
        setStudents(studentsRes.students);
      } else setError('Failed to load students.');
    } catch (err) {
      setError('Error loading students.');
    } finally {
      setClassLoading(false);
    }
  }, [selectedClass]);

  const refreshLockAndRecords = useCallback(
    async ({ silent = false } = {}) => {
      if (!selectedClass || !selectedDate) {
        setIsDateLocked(false);
        setExistingRecords(new Map());
        setCorrectionMode(false);
        prevLockedRef.current = false;
        return;
      }
      if (!silent) setLockStatusLoading(true);
      try {
        const [lockRes, dailyRes] = await Promise.all([
          attendanceService.getAttendanceLockStatus(selectedClass, selectedDate),
          attendanceService.getDailyAttendanceRecords(selectedClass, selectedDate),
        ]);
        const locked = !!(lockRes.success && lockRes.locked);
        const recordMap = new Map();
        if (dailyRes.success && Array.isArray(dailyRes.records)) {
          dailyRes.records.forEach((r) => {
            if (r.studentId) recordMap.set(r.studentId, r.status);
          });
        }
        const hasSaved = recordMap.size > 0;

        if (prevLockedRef.current && !locked && hasSaved) {
          showToast('Attendance unlocked. Search for a student below to make corrections.', 'success');
        }
        prevLockedRef.current = locked;

        setIsDateLocked(locked);
        setExistingRecords(recordMap);
        setCorrectionMode(hasSaved);
        if (!hasSaved) {
          setCurrentIndex(0);
          setEntries([]);
          setCurrentStatus(null);
          setCurrentPhotoUrl(null);
          setCurrentVerificationType(null);
          setCurrentManualReason('');
          setCurrentManualOther('');
        }
      } catch {
        if (!silent) {
          setIsDateLocked(false);
        }
      } finally {
        if (!silent) setLockStatusLoading(false);
      }
    },
    [selectedClass, selectedDate, showToast]
  );

  useEffect(() => {
    fetchStudents();
    refreshLockAndRecords();
  }, [fetchStudents, refreshLockAndRecords]);

  useEffect(() => {
    if (!correctionMode || !selectedStudentId) return;
    setCurrentPhotoUrl(null);
    setCurrentVerificationType(null);
    setCurrentManualReason('');
    setCurrentManualOther('');
    setCameraError(null);
    const pending = pendingCorrections.find((e) => e.studentId === selectedStudentId);
    const saved = existingRecords.get(selectedStudentId);
    setCurrentStatus(pending?.status || saved || null);
  }, [selectedStudentId, correctionMode, pendingCorrections, existingRecords]);

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

  // Real-time unlock: headteacher unlocks → teacher page updates without refresh
  useEffect(() => {
    if (!socket || !selectedClass || !selectedDate) return;
    const handler = (data) => {
      const cid = data?.classroomId?.toString?.() || data?.classroomId;
      const dateStr = data?.date;
      if (cid === selectedClass && dateStr === selectedDate) {
        refreshLockAndRecords({ silent: true });
      }
    };
    socket.on('attendance_unlocked', handler);
    return () => socket.off('attendance_unlocked', handler);
  }, [socket, selectedClass, selectedDate, refreshLockAndRecords]);

  // Poll while locked so unlock is picked up even if socket misses the event
  useEffect(() => {
    if (!selectedClass || !selectedDate || !isDateLocked) return;
    const id = setInterval(() => refreshLockAndRecords({ silent: true }), 12000);
    return () => clearInterval(id);
  }, [selectedClass, selectedDate, isDateLocked, refreshLockAndRecords]);

  // Refresh when teacher returns to this tab
  useEffect(() => {
    if (!selectedClass || !selectedDate) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshLockAndRecords({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [selectedClass, selectedDate, refreshLockAndRecords]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, [selectedClass, selectedDate]);

  const runGeoPreview = useCallback(({ bypassCache = false } = {}) => {
    const sch = selectedClassroom?.schoolId;
    if (!needsGeoFence || !sch?.location) return;
    setGeoSubmitState('checking');
    setGeoMessage('Verifying your location…');
    setGeoDistanceM(null);
    readStablePosition({ bypassCache })
      .then((pos) => {
        const lat = pos.latitude;
        const lng = pos.longitude;
        const accuracy = pos.accuracy;
        const { latitude: slat, longitude: slng, radius } = sch.location;
        const MAX_BUFFER_M = 10;
        const dist = Math.abs(haversineMeters(lat, lng, slat, slng));
        const d = Math.round(dist);
        const accBuffer = Number.isFinite(accuracy) && accuracy > 0 ? Math.min(accuracy, MAX_BUFFER_M) : 0;
        const effectiveRadius = Number(radius) + accBuffer;
        const accText = Number.isFinite(accuracy) ? ` GPS accuracy: ±${Math.round(accuracy)}m.` : '';
        setLastGoodGeo({ latitude: lat, longitude: lng, accuracy });
        if (import.meta?.env?.DEV) {
          // Debug stability of readings (DEV only)
          console.log({ lat, lng, accuracy, distance: d });
        }
        setGeoDistanceM(d);
        if (dist <= Number(radius)) {
          setGeoSubmitState('ok');
          setGeoMessage(`Within school boundary (≈ ${d}m from center).${accText}`);
        } else if (dist <= effectiveRadius) {
          setGeoSubmitState('ok');
          setGeoMessage(
            `Close to school boundary (≈ ${d}m). GPS accuracy may affect this reading. Allowed up to ≈ ${Math.round(
              effectiveRadius
            )}m.${accText}`
          );
        } else {
          setGeoSubmitState('blocked');
          setGeoMessage(
            `You are outside the allowed school area (≈ ${d}m). You must be within ≈ ${Math.round(effectiveRadius)}m to submit.${accText}`
          );
        }
      })
      .catch(() => {
        setGeoSubmitState('unavailable');
        setGeoMessage(
          'Could not verify location (permission blocked, or PC/Wi‑Fi signal too weak). The system will retry automatically.'
        );
        setGeoDistanceM(null);
      });
  }, [needsGeoFence, selectedClassroom]);

  const refreshGeoPreview = useCallback(() => {
    runGeoPreview({ bypassCache: true });
  }, [runGeoPreview]);

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
    if (currentStatus === 'present' && currentVerificationType === 'manual') {
      const reason = currentManualReason === 'Other' ? currentManualOther.trim() : currentManualReason;
      if (!reason) return false;
    }
    return true;
  }, [currentStatus, currentVerificationType, currentManualReason, currentManualOther]);

  const completeCurrent = useCallback(() => {
    if (!canCompleteCurrent() || currentIndex >= students.length) return;
    const student = students[currentIndex];
    const entry = {
      studentId: student._id,
      status: currentStatus,
      markedAt: new Date().toISOString(),
      location: location || undefined,
    };
    if (currentStatus === 'present') {
      if (currentVerificationType === 'photo' && currentPhotoUrl) {
        entry.verificationType = 'photo';
        entry.photoUrl = currentPhotoUrl;
      } else if (currentVerificationType === 'manual') {
        const manualReason =
          currentManualReason === 'Other' ? currentManualOther.trim() || 'Other' : currentManualReason;
        if (manualReason) {
          entry.verificationType = 'manual';
          entry.manualReason = manualReason;
        }
      }
    }
    setEntries((prev) => [...prev, entry]);
    setCurrentIndex((i) => i + 1);
    setCurrentStatus(null);
    setCurrentPhotoUrl(null);
    setCurrentVerificationType(null);
    setCurrentManualReason('');
    setCurrentManualOther('');
    setCameraError(null);
  }, [canCompleteCurrent, currentIndex, currentStatus, currentPhotoUrl, currentVerificationType, currentManualReason, currentManualOther, students, location]);

  const buildEntryForStudent = useCallback(
    (studentId) => {
      const entry = {
        studentId,
        status: currentStatus,
        markedAt: new Date().toISOString(),
        location: location || undefined,
      };
      if (currentStatus === 'present') {
        if (currentVerificationType === 'photo' && currentPhotoUrl) {
          entry.verificationType = 'photo';
          entry.photoUrl = currentPhotoUrl;
        } else if (currentVerificationType === 'manual') {
          const manualReason =
            currentManualReason === 'Other' ? currentManualOther.trim() || 'Other' : currentManualReason;
          if (manualReason) {
            entry.verificationType = 'manual';
            entry.manualReason = manualReason;
          }
        }
      }
      return entry;
    },
    [
      currentStatus,
      currentPhotoUrl,
      currentVerificationType,
      currentManualReason,
      currentManualOther,
      location,
    ]
  );

  const resetMarkingForm = useCallback(() => {
    setCurrentStatus(null);
    setCurrentPhotoUrl(null);
    setCurrentVerificationType(null);
    setCurrentManualReason('');
    setCurrentManualOther('');
    setCameraError(null);
  }, []);

  const completeCorrection = useCallback(() => {
    if (!canCompleteCurrent() || !selectedStudentId) return;
    const entry = buildEntryForStudent(selectedStudentId);
    setPendingCorrections((prev) => {
      const next = prev.filter((e) => e.studentId !== selectedStudentId);
      return [...next, entry];
    });
    setSelectedStudentId(null);
    resetMarkingForm();
  }, [canCompleteCurrent, selectedStudentId, buildEntryForStudent, resetMarkingForm]);

  const allDone = !correctionMode && currentIndex >= students.length && students.length > 0;
  const readyToSubmit = correctionMode ? pendingCorrections.length > 0 : allDone;

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = (s.fullName || s.name || '').toLowerCase();
      const sid = (s.studentId || s.admissionNumber || '').toLowerCase();
      return name.includes(q) || sid.includes(q);
    });
  }, [students, studentSearch]);

  const selectedStudent = useMemo(
    () => students.find((s) => s._id === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const getEffectiveStatus = useCallback(
    (studentId) => {
      const pending = pendingCorrections.find((e) => e.studentId === studentId);
      if (pending) return pending.status;
      return existingRecords.get(studentId) || null;
    },
    [pendingCorrections, existingRecords]
  );

  const stats = useMemo(() => {
    if (correctionMode) {
      let present = 0;
      let absent = 0;
      let late = 0;
      for (const s of students) {
        const status = getEffectiveStatus(s._id);
        if (status === 'present') present += 1;
        else if (status === 'absent') absent += 1;
        else if (status === 'late') late += 1;
      }
      return { present, absent, late };
    }
    return {
      present: entries.filter((e) => e.status === 'present').length,
      absent: entries.filter((e) => e.status === 'absent').length,
      late: entries.filter((e) => e.status === 'late').length,
    };
  }, [correctionMode, students, getEffectiveStatus, entries]);

  useEffect(() => {
    if (!readyToSubmit || !needsGeoFence) {
      setGeoSubmitState('idle');
      setGeoMessage('');
      setGeoDistanceM(null);
      return;
    }
    runGeoPreview();
  }, [readyToSubmit, needsGeoFence, runGeoPreview]);

  useEffect(() => {
    if (!readyToSubmit || !needsGeoFence) return;
    if (geoSubmitState !== 'blocked' && geoSubmitState !== 'unavailable') return;
    const retryId = setInterval(() => runGeoPreview({ bypassCache: true }), 12000);
    return () => clearInterval(retryId);
  }, [readyToSubmit, needsGeoFence, geoSubmitState, runGeoPreview]);

  const submitBlockedByGeo = needsGeoFence && geoSubmitState !== 'ok';

  const handleSubmit = useCallback(async () => {
    const payload = correctionMode ? pendingCorrections : entries;
    if (!selectedClass || !readyToSubmit || payload.length === 0) return;
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
        const MAX_BUFFER_M = 10;
        const dist = Math.abs(
          haversineMeters(
          coords.latitude,
          coords.longitude,
          sch.location.latitude,
          sch.location.longitude
          )
        );
        if (import.meta?.env?.DEV) {
          // Debug stability of readings (DEV only)
          console.log({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy, distance: Math.round(dist) });
        }
        const accBuffer = Number.isFinite(coords.accuracy) && coords.accuracy > 0 ? Math.min(coords.accuracy, MAX_BUFFER_M) : 0;
        const effectiveRadius = Number(sch.location.radius) + accBuffer;
        if (dist > effectiveRadius) {
          showToast(
            `You are outside the allowed school area (≈ ${Math.round(dist)}m). You must be within ≈ ${Math.round(effectiveRadius)}m to submit.`,
            'error'
          );
          return;
        }
        if (dist > Number(sch.location.radius)) {
          const accText = Number.isFinite(coords.accuracy) ? ` (GPS ±${Math.round(coords.accuracy)}m)` : '';
          showToast(
            `Close to school boundary. GPS accuracy may affect this reading. Submitting anyway.${accText}`,
            'info'
          );
        }
      } catch {
        showToast(
          'Could not read your location. Allow location for this site, wait a few seconds, and try again (PCs may need a moment on Wi‑Fi).',
          'error'
        );
        return;
      }
    }

    setSaving(true);
    try {
      const response = await attendanceService.markDailyAttendance(
        selectedClass,
        selectedDate,
        payload,
        coords
      );
      if (response.success) {
        showToast(`Attendance saved for ${response.count ?? payload.length} student${(response.count ?? payload.length) === 1 ? '' : 's'}.`, 'success');
        if (correctionMode) {
          setPendingCorrections([]);
          setSelectedStudentId(null);
        } else {
          setEntries([]);
          setCurrentIndex(0);
        }
        prevLockedRef.current = true;
        setIsDateLocked(true);
        refreshLockAndRecords({ silent: true });
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
    pendingCorrections,
    correctionMode,
    readyToSubmit,
    showToast,
    selectedClassroom,
    needsGeoFence,
    engine,
    refreshLockAndRecords,
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
    refreshGeoPreview,
    submitBlockedByGeo,
    correctionMode,
    studentSearch,
    setStudentSearch,
    filteredStudents,
    selectedStudentId,
    setSelectedStudentId,
    selectedStudent,
    pendingCorrections,
    completeCorrection,
    readyToSubmit,
    getEffectiveStatus,
    stats,
  };
}
