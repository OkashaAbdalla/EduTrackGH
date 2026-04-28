/**
 * Headteacher – configure school GPS boundary for teacher attendance (geo-fence)
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../common';
import headteacherService from '../../services/headteacherService';
import { useToast } from '../../context';

function readCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
    });
  });
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
      const p = await readCurrentPosition();
      setLat(String(p.coords.latitude.toFixed(6)));
      setLng(String(p.coords.longitude.toFixed(6)));
      showToast('Coordinates filled from your current location', 'success');
    } catch {
      showToast('Could not read your location. Check browser permissions.', 'error');
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
