import { useEffect, useState, useCallback, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import adminService from '../../services/adminService';

const AdminClassrooms = () => {
  const [rows, setRows] = useState([]);
  const [schools, setSchools] = useState([]);
  const [schoolFilter, setSchoolFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchools = async () => {
      try {
        const data = await adminService.getSchools();
        setSchools(data.schools || []);
      } catch {
        setSchools([]);
      }
    };
    loadSchools();
  }, []);

  const loadClassrooms = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (schoolFilter) params.schoolId = schoolFilter;
      const r = await adminService.getClassroomsGlobal(params);
      setRows(r.classrooms || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [schoolFilter]);

  useEffect(() => {
    loadClassrooms();
  }, [loadClassrooms]);

  const schoolOptions = useMemo(() => {
    return schools
      .map((s) => ({ id: s._id || s.id, name: s.name || '' }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [schools]);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Classrooms (Read Only)</h1>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-full sm:w-auto sm:min-w-[220px]">
            Filter by school
            <select
              className="ui-select ui-select-sm w-full mt-1"
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
            >
              <option value="">All schools</option>
              {schoolOptions.map((s) => (
                <option key={s.id || s.name} value={s.id || ''}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          {loading ? 'Loading…' : `${rows.length} classroom${rows.length === 1 ? '' : 's'}`}
        </p>

        <Card className="p-0 overflow-x-auto table-scroll">
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
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                    No classrooms found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminClassrooms;
