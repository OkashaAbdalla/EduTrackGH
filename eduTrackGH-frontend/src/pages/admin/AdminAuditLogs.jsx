import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import adminService from '../../services/adminService';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    adminService.getAuditLogs().then((r) => setLogs(r.logs || []));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
        <Card className="p-0 overflow-x-auto">
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
                <tr key={`${l.type}-${i}`} className="border-t dark:border-gray-800">
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
