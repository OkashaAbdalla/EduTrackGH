import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import { useToast, useConfirm } from '../../context';
import adminService from '../../services/adminService';

const AdminGpsAudit = () => {
  const { showToast } = useToast();
  const { requestConfirmation } = useConfirm();
  const [settings, setSettings] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([adminService.getGpsSettings(), adminService.getGpsLogs()]);
      if (s?.success && s.settings) {
        setSettings(s.settings);
      } else {
        showToast('Could not load GPS policy', 'error');
      }
      setLogs(l?.logs || []);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to load GPS audit data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const saveSettings = async () => {
    if (!settings) return;
    const ok = await requestConfirmation({
      title: 'Save GPS policy',
      message:
        'Updates the default geo-fence radius limits and whether teachers must be within school GPS range to mark attendance.',
      confirmText: 'Save',
      cancelText: 'Cancel',
      tone: 'primary',
    });
    if (!ok) return;

    setSaving(true);
    try {
      const data = await adminService.updateGpsSettings({
        defaultRadius: Number(settings.defaultRadius),
        maxRadius: Number(settings.maxRadius),
        gpsEnforced: !!settings.gpsEnforced,
      });
      if (data?.success) {
        setSettings(data.settings);
        showToast(data.message || 'GPS policy saved', 'success');
      } else {
        showToast(data?.message || 'Save failed', 'error');
      }
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to save GPS policy', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">GPS Audit</h1>

        {loading && <p className="text-sm text-gray-500 dark:text-slate-400">Loading…</p>}

        {settings && !loading && (
          <Card className="p-4 stats-grid-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Default radius (m)
              <input
                type="number"
                min={10}
                className="mt-1 w-full px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-700"
                value={settings.defaultRadius}
                onChange={(e) =>
                  setSettings({ ...settings, defaultRadius: Number(e.target.value) || 0 })
                }
              />
            </label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Max radius (m)
              <input
                type="number"
                min={10}
                className="mt-1 w-full px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-700"
                value={settings.maxRadius}
                onChange={(e) =>
                  setSettings({ ...settings, maxRadius: Number(e.target.value) || 0 })
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mt-6">
              <input
                type="checkbox"
                checked={!!settings.gpsEnforced}
                onChange={(e) => setSettings({ ...settings, gpsEnforced: e.target.checked })}
              />
              GPS enforced for marking
            </label>
            <button
              type="button"
              disabled={saving}
              onClick={saveSettings}
              className="mt-6 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold disabled:opacity-50 hover:bg-green-700"
            >
              {saving ? 'Saving…' : 'Save Policy'}
            </button>
          </Card>
        )}

        <Card className="p-0 overflow-x-auto table-scroll">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">School</th>
                <th className="px-3 py-2 text-left">Teacher</th>
                <th className="px-3 py-2 text-left">Distance</th>
                <th className="px-3 py-2 text-left">Within Radius</th>
              </tr>
            </thead>
            <tbody>
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    No GPS audit logs yet.
                  </td>
                </tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="border-t dark:border-gray-800">
                  <td className="px-3 py-2">{l.date}</td>
                  <td className="px-3 py-2">{l.school}</td>
                  <td className="px-3 py-2">{l.teacher}</td>
                  <td className="px-3 py-2">
                    {l.gpsData?.distance}m / {l.gpsData?.radius}m
                  </td>
                  <td className="px-3 py-2">{l.gpsData?.withinRadius ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminGpsAudit;
