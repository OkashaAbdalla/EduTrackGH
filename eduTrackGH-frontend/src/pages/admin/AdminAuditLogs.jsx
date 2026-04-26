import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import adminService from '../../services/adminService';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadLogs = async () => {
      try {
        setLoading(true);
        setError('');
        const r = await adminService.getAuditLogs();
        if (!mounted) return;
        setLogs(r.logs || []);
      } catch (_err) {
        if (!mounted) return;
        setError('Failed to load audit logs. Please retry.');
        setLogs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadLogs();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
        <Card className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-4 text-sm text-gray-600 dark:text-gray-300">Loading audit logs...</div>
          ) : null}
          {error ? (
            <div className="p-4 text-sm text-red-600 dark:text-red-400">{error}</div>
          ) : null}
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-3 py-2 text-left">Time</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Actor</th>
                <th className="px-3 py-2 text-left">Target</th>
                <th className="px-3 py-2 text-left">School</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={`${l.type || 'log'}-${l.at || ''}-${l.actor || ''}-${i}`} className="border-t dark:border-gray-800">
                  <td className="px-3 py-2">{new Date(l.at).toLocaleString()}</td>
                  <td className="px-3 py-2">{l.type}</td>
                  <td className="px-3 py-2">{l.actor}</td>
                  <td className="px-3 py-2">{l.target}</td>
                  <td className="px-3 py-2">{l.school || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAuditLogs;
