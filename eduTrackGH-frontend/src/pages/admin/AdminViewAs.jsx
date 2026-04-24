import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import adminService from '../../services/adminService';

const AdminViewAs = () => {
  const navigate = useNavigate();
  const { role, id } = useParams();
  const [targetRole, setTargetRole] = useState(role || 'teacher');
  const [targetId, setTargetId] = useState(id || '');
  const [payload, setPayload] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const showReadOnly = useMemo(() => !!payload?.readOnly, [payload]);

  const inspect = async (e) => {
    e.preventDefault();
    setError('');
    setPayload(null);
    setDashboard(null);
    try {
      const [data, dash] = await Promise.all([
        adminService.getViewAsProfile(targetRole, targetId.trim()),
        adminService.getViewAsDashboard(targetRole, targetId.trim()),
      ]);
      setPayload(data);
      setDashboard(dash?.dashboard || null);
      navigate(`/admin/view-as/${targetRole}/${targetId.trim()}`, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to inspect user');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">View-As Mode</h1>
        <Card className="p-4">
          <form onSubmit={inspect} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-700">
              <option value="teacher">teacher</option>
              <option value="headteacher">headteacher</option>
              <option value="parent">parent</option>
            </select>
            <input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="User ID" className="md:col-span-2 px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-700" />
            <button type="submit" className="px-3 py-2 rounded bg-green-600 text-white">Inspect</button>
          </form>
        </Card>

        {error && <Card className="p-4 text-red-600">{error}</Card>}
        {showReadOnly && (
          <>
            <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/20">
              <p className="font-semibold text-amber-700 dark:text-amber-300">🔒 Viewing as {payload.user.role} (Read-Only Mode)</p>
              <p className="text-sm text-amber-700/80 dark:text-amber-300/80 mt-1">Write operations are disabled in this inspection mode.</p>
            </Card>
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><span className="font-semibold">Name:</span> {payload.user.fullName}</div>
                <div><span className="font-semibold">Email:</span> {payload.user.email}</div>
                <div><span className="font-semibold">Role:</span> {payload.user.role}</div>
                <div><span className="font-semibold">Active:</span> {payload.user.isActive ? 'Yes' : 'No'}</div>
              </div>
            </Card>
            {dashboard && (
              <Card className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Read-Only Dashboard Mirror</h2>
                {payload.user.role === 'teacher' && (
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div><span className="font-semibold">Classrooms:</span> {dashboard.summary?.classrooms || 0}</div>
                      <div><span className="font-semibold">Students:</span> {dashboard.summary?.students || 0}</div>
                      <div><span className="font-semibold">Attendance Buckets:</span> {(dashboard.summary?.attendanceByStatus || []).length}</div>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Recent attendance</p>
                      <div className="space-y-1">
                        {(dashboard.recentAttendance || []).slice(0, 8).map((r) => (
                          <div key={r._id} className="text-gray-700 dark:text-gray-300">
                            {new Date(r.date).toLocaleDateString()} - {r.studentId?.fullName || 'Student'} - {r.status}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {payload.user.role === 'headteacher' && (
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div><span className="font-semibold">Classrooms:</span> {dashboard.summary?.classrooms || 0}</div>
                      <div><span className="font-semibold">Teachers:</span> {dashboard.summary?.teachers || 0}</div>
                      <div><span className="font-semibold">Students:</span> {dashboard.summary?.students || 0}</div>
                      <div><span className="font-semibold">Attendance rate:</span> {dashboard.summary?.attendanceRate || 0}%</div>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Classrooms</p>
                      <div className="space-y-1">
                        {(dashboard.classrooms || []).slice(0, 8).map((c) => (
                          <div key={c.id} className="text-gray-700 dark:text-gray-300">
                            {c.name} ({c.grade}) - teacher: {c.teacher || 'Unassigned'} - students: {c.studentCount}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {payload.user.role === 'parent' && (
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div><span className="font-semibold">Children:</span> {dashboard.summary?.children || 0}</div>
                      <div><span className="font-semibold">Unread notifications:</span> {dashboard.summary?.unreadNotifications || 0}</div>
                      <div><span className="font-semibold">Attendance Buckets:</span> {(dashboard.summary?.attendanceByStatus || []).length}</div>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Children</p>
                      <div className="space-y-1">
                        {(dashboard.children || []).slice(0, 8).map((c) => (
                          <div key={c.id} className="text-gray-700 dark:text-gray-300">
                            {c.fullName} - {c.classroom || c.grade || '-'} - {c.school || '-'}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminViewAs;
