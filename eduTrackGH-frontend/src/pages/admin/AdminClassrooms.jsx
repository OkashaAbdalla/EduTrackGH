import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import adminService from '../../services/adminService';

const AdminClassrooms = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    adminService.getClassroomsGlobal().then((r) => setRows(r.classrooms || []));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classrooms (Read Only)</h1>
        <Card className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-3 py-2 text-left">Classroom</th>
                <th className="px-3 py-2 text-left">School</th>
                <th className="px-3 py-2 text-left">Teacher</th>
                <th className="px-3 py-2 text-left">Students</th>
                <th className="px-3 py-2 text-left">Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t dark:border-gray-800">
                  <td className="px-3 py-2">{c.name} ({c.grade})</td>
                  <td className="px-3 py-2">{c.school}</td>
                  <td className="px-3 py-2">{c.teacher || '-'}</td>
                  <td className="px-3 py-2">{c.studentCount}</td>
                  <td className="px-3 py-2">{c.attendanceRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminClassrooms;
