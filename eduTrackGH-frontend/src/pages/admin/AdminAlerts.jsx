import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import adminService from '../../services/adminService';

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadAlerts = async () => {
      try {
        setLoading(true);
        setError('');
        const r = await adminService.getAlerts();
        if (!mounted) return;
        setAlerts(r.alerts || []);
      } catch (_err) {
        if (!mounted) return;
        setError('Failed to load alerts. Please retry.');
        setAlerts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadAlerts();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alerts</h1>
        <Card className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-4 text-sm text-gray-600 dark:text-gray-300">Loading alerts...</div>
          ) : null}
          {error ? (
            <div className="p-4 text-sm text-red-600 dark:text-red-400">{error}</div>
          ) : null}
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Message</th>
                <th className="px-3 py-2 text-left">School</th>
                <th className="px-3 py-2 text-left">Classroom</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a, i) => (
                <tr
                  key={`${a.type || 'alert'}-${a.createdAt || ''}-${a.school || ''}-${a.classroom || ''}-${i}`}
                  className="border-t dark:border-gray-800"
                >
                  <td className="px-3 py-2">{a.type}</td>
                  <td className="px-3 py-2">{a.message}</td>
                  <td className="px-3 py-2">{a.school}</td>
                  <td className="px-3 py-2">{a.classroom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAlerts;
