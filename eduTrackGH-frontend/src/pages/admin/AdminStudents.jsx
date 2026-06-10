import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import adminService from '../../services/adminService';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
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

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (schoolFilter) params.schoolId = schoolFilter;
      const data = await adminService.getStudents(params);
      setStudents(data.students || []);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [schoolFilter]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const schoolOptions = useMemo(() => {
    const fromApi = schools.map((s) => ({
      id: s._id || s.id,
      name: s.name || '',
    }));
    const names = new Set(fromApi.map((s) => s.name));
    students.forEach((st) => {
      if (st.school && !names.has(st.school)) {
        names.add(st.school);
      }
    });
    return fromApi.sort((a, b) => a.name.localeCompare(b.name));
  }, [schools, students]);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Students (Read Only)</h1>
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
          {loading
            ? 'Loading…'
            : `${students.length} student${students.length === 1 ? '' : 's'}${
                schoolFilter
                  ? ` at ${schoolOptions.find((s) => s.id === schoolFilter)?.name || 'selected school'}`
                  : ''
              }`}
        </p>

        <Card className="p-0 overflow-x-auto table-scroll">
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
              {!loading && students.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500 dark:text-slate-400">
                    No students found for this filter.
                  </td>
                </tr>
              )}
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
