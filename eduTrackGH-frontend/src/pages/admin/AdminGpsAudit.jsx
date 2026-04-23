import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import adminService from '../../services/adminService';

const AdminGpsAudit = () => {
  const [settings, setSettings] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [s, l] = await Promise.all([adminService.getGpsSettings(), adminService.getGpsLogs()]);
      setSettings(s.settings);
      setLogs(l.logs || []);
    };
    load();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    const data = await adminService.updateGpsSettings(settings);
    setSettings(data.settings);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">GPS Audit</h1>
        {settings && (
          <Card className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input className="px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-700" type="number" value={settings.defaultRadius} onChange={(e)=>setSettings({...settings, defaultRadius:Number(e.target.value)})} />
            <input className="px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-700" type="number" value={settings.maxRadius} onChange={(e)=>setSettings({...settings, maxRadius:Number(e.target.value)})} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!settings.gpsEnforced} onChange={(e)=>setSettings({...settings,gpsEnforced:e.target.checked})} /> GPS Enforced</label>
            <button onClick={saveSettings} className="px-3 py-2 rounded bg-green-600 text-white">Save Policy</button>
          </Card>
        )}
        <Card className="p-0 overflow-x-auto">
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
              {logs.map((l) => (
                <tr key={l.id} className="border-t dark:border-gray-800">
                  <td className="px-3 py-2">{l.date}</td>
                  <td className="px-3 py-2">{l.school}</td>
                  <td className="px-3 py-2">{l.teacher}</td>
                  <td className="px-3 py-2">{l.gpsData?.distance}m / {l.gpsData?.radius}m</td>
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
