/**
 * Central AdminConfig read/write for GPS, system settings, etc.
 */

const AdminConfig = require("../models/AdminConfig");

const DEFAULT_GPS_SETTINGS = { defaultRadius: 100, maxRadius: 300, gpsEnforced: true };

const DEFAULT_SYSTEM_SETTINGS = {
  attendance: {
    markingWindowStart: "07:30",
    markingWindowEnd: "09:00",
    markingDeadlineHour: 9,
    chronicAbsenteeismThreshold: 3,
    absenteeismPercentageThreshold: 10,
    gracePeriodHours: 24,
  },
  faceRecognition: { confidenceThreshold: 0.7, enabled: true },
  notifications: { emailEnabled: true, smsEnabled: false },
  system: { maintenanceMode: false, allowRegistration: true },
};

let systemSettingsCache = { value: null, expiresAt: 0 };
const CACHE_MS = 30 * 1000;

function deepMerge(base, patch) {
  if (!patch || typeof patch !== "object") return base;
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    if (patch[key] && typeof patch[key] === "object" && !Array.isArray(patch[key])) {
      out[key] = deepMerge(base[key] || {}, patch[key]);
    } else if (patch[key] !== undefined) {
      out[key] = patch[key];
    }
  }
  return out;
}

async function getConfig(key, fallback) {
  const row = await AdminConfig.findOne({ key }).lean();
  return row?.value ?? fallback;
}

async function setConfig(key, value) {
  await AdminConfig.findOneAndUpdate({ key }, { $set: { value } }, { upsert: true, new: true });
  if (key === "system_settings") {
    systemSettingsCache = { value: null, expiresAt: 0 };
  }
  return value;
}

function normalizeTimeHHMM(val, fallback) {
  if (!val || typeof val !== "string") return fallback;
  const m = val.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return fallback;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function timeToMinutes(timeStr) {
  const m = String(timeStr || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function toInt(val, fallback, { min = -Infinity, max = Infinity } = {}) {
  if (val === '' || val === null || val === undefined) return fallback;
  const n = parseInt(String(val), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeSystemSettings(raw) {
  const merged = deepMerge(DEFAULT_SYSTEM_SETTINGS, raw || {});
  const a = merged.attendance;
  const deadlineHour = Math.min(23, Math.max(0, Number(a.markingDeadlineHour) || 9));
  let markingWindowStart = normalizeTimeHHMM(a.markingWindowStart, null);
  let markingWindowEnd = normalizeTimeHHMM(a.markingWindowEnd, null);
  if (!markingWindowStart) markingWindowStart = "07:30";
  if (!markingWindowEnd) markingWindowEnd = `${String(deadlineHour).padStart(2, "0")}:00`;
  if (timeToMinutes(markingWindowStart) >= timeToMinutes(markingWindowEnd)) {
    markingWindowStart = "07:30";
    markingWindowEnd = "09:00";
  }
  merged.attendance = {
    markingWindowStart,
    markingWindowEnd,
    markingDeadlineHour: parseInt(markingWindowEnd.split(":")[0], 10) || deadlineHour,
    chronicAbsenteeismThreshold: toInt(a.chronicAbsenteeismThreshold, 3, { min: 1 }),
    absenteeismPercentageThreshold: toInt(a.absenteeismPercentageThreshold, 10, { min: 0, max: 100 }),
    gracePeriodHours: toInt(a.gracePeriodHours, 24, { min: 0 }),
  };
  merged.faceRecognition = {
    enabled: merged.faceRecognition?.enabled !== false,
    confidenceThreshold: Math.min(
      1,
      Math.max(0, Number(merged.faceRecognition?.confidenceThreshold) || 0.7)
    ),
  };
  merged.notifications = {
    emailEnabled: merged.notifications?.emailEnabled !== false,
    smsEnabled: !!merged.notifications?.smsEnabled,
  };
  merged.system = {
    maintenanceMode: !!merged.system?.maintenanceMode,
    allowRegistration: merged.system?.allowRegistration !== false,
  };
  return merged;
}

async function getSystemSettings() {
  if (systemSettingsCache.value && Date.now() < systemSettingsCache.expiresAt) {
    return systemSettingsCache.value;
  }
  const stored = await getConfig("system_settings", null);
  const normalized = normalizeSystemSettings(stored || DEFAULT_SYSTEM_SETTINGS);
  systemSettingsCache = { value: normalized, expiresAt: Date.now() + CACHE_MS };
  return normalized;
}

async function saveSystemSettings(patch) {
  const current = await getSystemSettings();
  const next = normalizeSystemSettings(deepMerge(current, patch));
  await setConfig("system_settings", next);
  systemSettingsCache = { value: next, expiresAt: Date.now() + CACHE_MS };
  return next;
}

async function getAttendanceSettings() {
  const s = await getSystemSettings();
  return s.attendance;
}

async function getNotificationSettingsFromSystem() {
  const s = await getSystemSettings();
  return s.notifications;
}

function invalidateSystemSettingsCache() {
  systemSettingsCache = { value: null, expiresAt: 0 };
}

module.exports = {
  DEFAULT_GPS_SETTINGS,
  DEFAULT_SYSTEM_SETTINGS,
  getConfig,
  setConfig,
  getSystemSettings,
  saveSystemSettings,
  getAttendanceSettings,
  getNotificationSettingsFromSystem,
  normalizeSystemSettings,
  invalidateSystemSettingsCache,
};
