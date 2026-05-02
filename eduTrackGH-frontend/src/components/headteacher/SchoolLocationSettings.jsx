/**
 * Headteacher – configure school GPS boundary for teacher attendance (geo-fence)
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../common';
import headteacherService from '../../services/headteacherService';
import { useToast } from '../../context';

/** Hard cap for “Use current location” — user requirement: must not exceed ~13s. */
const SCHOOL_LOCATION_GEO_MAX_MS = 13000;

function coordsFromGeolocationPosition(position) {
  const latitude = Number(position?.coords?.latitude);
  const longitude = Number(position?.coords?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const acc = Number(position?.coords?.accuracy);
  return {
    latitude,
    longitude,
    accuracy: Number.isFinite(acc) ? acc : null,
  };
}

/**
 * School boundary setup only (not teacher attendance checks).
 *
 * Order matters: **phone / GPS first** (`enableHighAccuracy: true`) so mobiles get a real GNSS fix when available.
 * If that times out or fails (typical on desktop), fall back to **network / Wi‑Fi** paths.
 * Teacher “Mark attendance” still uses stricter `watchPosition` + high accuracy in `useMarkAttendance.js` — unchanged.
 *
 * All attempts share one 13s budget.
 */
async function readStablePositionForSchoolSetup() {
  if (!navigator.geolocation) {
    throw new Error('Geolocation not supported');
  }
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    const e = new Error('Geolocation requires HTTPS (or localhost).');
    e.code = 'INSECURE_CONTEXT';
    throw e;
  }

  const startedAt = Date.now();
  const remainingMs = () => SCHOOL_LOCATION_GEO_MAX_MS - (Date.now() - startedAt);

  /**
   * @param {GeolocationPositionOptions & { _budgetMs?: number }} opts _budgetMs caps this single call (not passed to API)
   */
  const getOnce = (opts) => {
    const { _budgetMs = 5000, ...geoOpts } = opts;
    const budget = Math.min(Math.max(_budgetMs, 1500), Math.max(800, remainingMs()));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(Object.assign(new Error('timeout'), { code: 3 }));
      }, budget + 300);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          resolve(pos);
        },
        (err) => {
          clearTimeout(timer);
          reject(err || new Error('Position error'));
        },
        { ...geoOpts, timeout: budget }
      );
    });
  };

  let lastErr = new Error('Location unavailable');
  const attempts = [
    // 1) Phones / tablets: GPS & sensors (same intent as attendance high-accuracy mode)
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      _budgetMs: 5500,
    },
    // 2) Desktop / Wi‑Fi: cached network position (fast when GPS not available)
    {
      enableHighAccuracy: false,
      maximumAge: 600000,
      _budgetMs: 4000,
    },
    // 3) Fresh network fix (no cache)
    {
      enableHighAccuracy: false,
      maximumAge: 0,
      _budgetMs: 3500,
    },
  ];

  for (const a of attempts) {
    if (remainingMs() < 900) break;
    try {
      const pos = await getOnce(a);
      const c = coordsFromGeolocationPosition(pos);
      if (c) return c;
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr;
}

export default function SchoolLocationSettings() {
  const { showToast } = useToast();
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('100');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await headteacherService.getSchoolLocation();
      if (res.success && res.location) {
        setLat(String(res.location.latitude ?? ''));
        setLng(String(res.location.longitude ?? ''));
        setRadius(String(res.location.radius ?? '100'));
      } else {
        setLat('');
        setLng('');
        setRadius('100');
      }
    } catch {
      showToast('Could not load school location', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUseCurrent = async () => {
    setLocating(true);
    try {
      const pos = await readStablePositionForSchoolSetup();
      setLat(String(pos.latitude.toFixed(6)));
      setLng(String(pos.longitude.toFixed(6)));
      showToast('Location captured.', 'success');
    } catch (err) {
      const code = err?.code;
      const denied = code === 1;
      const timedOut = code === 3 || err?.message === 'timeout';
      const insecure = err?.code === 'INSECURE_CONTEXT';
      let msg =
        'Could not read your location. Allow location for this site, use HTTPS, or enter coordinates manually.';
      if (insecure) {
        msg = 'Geolocation needs a secure connection (HTTPS) except on localhost. Open the app over HTTPS or use manual coordinates.';
      } else if (denied) {
        msg =
          'Location permission denied. Click the lock icon in the address bar → Site settings → Location → Allow, then try again.';
      } else if (timedOut) {
        msg =
          'Location request timed out. Try again near a window, disable strict privacy blocking for this site, or enter lat/lng from a map.';
      } else if (code === 2) {
        msg =
          'Position unavailable (browser could not determine location). Check OS location services and try again, or enter coordinates manually.';
      }
      showToast(msg, 'error');
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const latitude = Number(lat);
    const longitude = Number(lng);
    const r = Number(radius);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      showToast('Enter valid latitude and longitude', 'error');
      return;
    }
    if (!Number.isFinite(r) || r < 10 || r > 1000) {
      showToast('Radius must be between 10 and 1000 meters', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await headteacherService.setSchoolLocation({ latitude, longitude, radius: r });
      if (res.success) {
        showToast(res.message || 'School location updated successfully', 'success');
        await load();
      } else showToast(res.message || 'Save failed', 'error');
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const summary =
    lat !== '' && lng !== '' && radius !== '' && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
      ? `Lat: ${Number(lat).toFixed(6)} | Lng: ${Number(lng).toFixed(6)} | Radius: ${radius}m`
      : null;

  return (
    <Card className="p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">School location settings</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Set the school center and radius so teachers can only submit attendance while on campus.
        </p>
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          Update this location only while physically at the school. Saving coordinates from another place can block teachers from marking attendance.
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          {summary && (
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
              <span className="font-medium text-gray-700 dark:text-gray-300">Saved boundary: </span>
              {summary}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
              <input
                type="text"
                inputMode="decimal"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="e.g. 9.4075"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
              <input
                type="text"
                inputMode="decimal"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="e.g. -0.8533"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Radius (meters)</label>
              <input
                type="number"
                min={10}
                max={1000}
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50 shadow-sm"
            >
              {saving ? 'Saving…' : 'Save location'}
            </button>
            <button
              type="button"
              onClick={handleUseCurrent}
              disabled={locating}
              className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {locating ? 'Locating…' : 'Use current location'}
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}
