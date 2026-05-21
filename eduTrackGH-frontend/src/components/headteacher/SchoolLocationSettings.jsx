/**
 * Headteacher – compact school GPS boundary settings
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '../common';
import headteacherService from '../../services/headteacherService';
import { useToast } from '../../context';

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
    { enableHighAccuracy: true, maximumAge: 0, _budgetMs: 5500 },
    { enableHighAccuracy: false, maximumAge: 600000, _budgetMs: 4000 },
    { enableHighAccuracy: false, maximumAge: 0, _budgetMs: 3500 },
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

const inputClass =
  'w-full max-w-[9rem] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/80 px-2.5 py-1.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500/40 focus:border-green-500';

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
        msg = 'Geolocation needs HTTPS (or localhost). Use manual coordinates if needed.';
      } else if (denied) {
        msg = 'Location permission denied. Allow location in browser settings, then try again.';
      } else if (timedOut) {
        msg = 'Location timed out. Try again on campus or enter coordinates manually.';
      } else if (code === 2) {
        msg = 'Position unavailable. Enter coordinates manually.';
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
        showToast(res.message || 'School location updated', 'success');
        await load();
      } else showToast(res.message || 'Save failed', 'error');
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const hasBoundary =
    lat !== '' && lng !== '' && radius !== '' && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));

  return (
    <Card className="p-4 max-w-3xl border-l-4 border-l-emerald-500 dark:border-l-emerald-400">
      <div className="flex flex-wrap items-start gap-3 mb-3">
        <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/25">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">School location</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
            Campus center and radius for teacher attendance checks.
          </p>
        </div>
      </div>

      <p className="mb-3 rounded-md border border-amber-200/80 bg-amber-50/90 px-2.5 py-1.5 text-[11px] leading-snug text-amber-900 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-200">
        Set this while on campus. Wrong coordinates can block teachers from marking attendance.
      </p>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-3">
          {hasBoundary && (
            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-md px-2.5 py-1.5 border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Saved: </span>
              {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)} · {radius}m
            </p>
          )}

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Lat
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="9.4075"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Lng
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="-0.8533"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Radius (m)
              </label>
              <input
                type="number"
                min={10}
                max={1000}
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-wrap gap-2 pb-0.5">
              <Button type="submit" variant="primary" size="sm" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={handleUseCurrent} disabled={locating}>
                {locating ? 'Locating…' : 'Use GPS'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </Card>
  );
}
