import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import adminService from '../../services/adminService';

const AdminAnalytics = () => {
  const [data, setData] = useState({ trends: [], bestSchools: [], worstSchools: [] });
  useEffect(() => {
    adminService.getAnalytics().then((r) => setData(r.analytics || { trends: [], bestSchools: [], worstSchools: [] }));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h2 className="font-semibold mb-2">Best Schools</h2>
            <ul className="space-y-1 text-sm">
              {data.bestSchools.map((s) => <li key={s.schoolId}>{s.schoolName}: {s.attendanceRate}%</li>)}
            </ul>
          </Card>
          <Card className="p-4">
            <h2 className="font-semibold mb-2">Worst Schools</h2>
            <ul className="space-y-1 text-sm">
              {data.worstSchools.map((s) => <li key={s.schoolId}>{s.schoolName}: {s.attendanceRate}%</li>)}
            </ul>
          </Card>
        </div>
        <Card className="p-4">
          <h2 className="font-semibold mb-2">Attendance Trends</h2>
          <div className="space-y-1 text-sm">
            {data.trends.map((t) => (
              <div key={t.month} className="flex justify-between">
                <span>{t.month}</span>
                <span>{t.attendanceRate}% ({t.totalRecords} records)</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
