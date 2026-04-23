import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import adminService from '../../services/adminService';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await adminService.getStudents();
        setStudents(data.students || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students (Read Only)</h1>
        <Card className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Admission</th>
                <th className="px-3 py-2 text-left">School</th>
                <th className="px-3 py-2 text-left">Classroom</th>
                <th className="px-3 py-2 text-left">Parent Email</th>
                <th className="px-3 py-2 text-left">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t dark:border-gray-800">
                  <td className="px-3 py-2">{s.fullName}</td>
                  <td className="px-3 py-2">{s.admissionNumber}</td>
                  <td className="px-3 py-2">{s.school}</td>
                  <td className="px-3 py-2">{s.classroom}</td>
                  <td className="px-3 py-2">{s.parent?.email || '-'}</td>
                  <td className="px-3 py-2">{s.attendancePercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <p className="p-4 text-gray-500">Loading...</p>}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminStudents;
