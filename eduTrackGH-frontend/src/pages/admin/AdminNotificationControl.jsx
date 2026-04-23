import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import adminService from '../../services/adminService';

const AdminNotificationControl = () => {
  const [settings, setSettings] = useState({ emailEnabled: true, smsEnabled: false, absenceThreshold: 3 });
  const [exportInfo, setExportInfo] = useState(null);

  useEffect(() => {
    adminService.getNotificationSettingsControl().then((r) => {
      if (r.settings) setSettings(r.settings);
    });
  }, []);

  const save = async () => {
    const r = await adminService.updateNotificationSettingsControl(settings);
    if (r.settings) setSettings(r.settings);
  };

  const exportData = async () => {
    const r = await adminService.exportSystemData();
    setExportInfo(r);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Control</h1>
        <Card className="p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!settings.emailEnabled} onChange={(e)=>setSettings({...settings,emailEnabled:e.target.checked})} /> Email enabled</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!settings.smsEnabled} onChange={(e)=>setSettings({...settings,smsEnabled:e.target.checked})} /> SMS enabled</label>
          <div>
            <label className="text-sm">Absence threshold</label>
            <input type="number" value={settings.absenceThreshold} onChange={(e)=>setSettings({...settings,absenceThreshold:Number(e.target.value)})} className="ml-2 px-3 py-1 rounded border dark:bg-gray-800 dark:border-gray-700" />
          </div>
          <button onClick={save} className="px-3 py-2 rounded bg-green-600 text-white text-sm">Save Notification Settings</button>
        </Card>
        <Card className="p-4">
          <button onClick={exportData} className="px-3 py-2 rounded bg-blue-600 text-white text-sm">Export System Summary</button>
          {exportInfo && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Exported at {new Date(exportInfo.exportedAt).toLocaleString()} — users: {exportInfo.summary?.users}, schools: {exportInfo.summary?.schools}, students: {exportInfo.summary?.students}
            </p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminNotificationControl;
