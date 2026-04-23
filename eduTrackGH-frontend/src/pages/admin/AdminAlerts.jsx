import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import adminService from '../../services/adminService';

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    adminService.getAlerts().then((r) => setAlerts(r.alerts || []));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alerts</h1>
        <Card className="p-0 overflow-x-auto">
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
                <tr key={`${a.type}-${i}`} className="border-t dark:border-gray-800">
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
