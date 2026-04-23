import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import adminService from '../../services/adminService';

const AdminUsers = () => {
  const [role, setRole] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers(role ? { role } : {});
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [role]);

  const toggleStatus = async (u) => {
    await adminService.updateUserStatus(u._id || u.id, { isActive: !u.isActive });
    load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
        <Card className="p-4">
          <label className="text-sm text-gray-600 dark:text-gray-400 mr-2">Filter role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="">All</option>
            <option value="admin">Admin</option>
            <option value="headteacher">Headteacher</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
          </select>
        </Card>
        <Card className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id || u.id} className="border-t dark:border-gray-800">
                  <td className="px-3 py-2">{u.fullName}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2 capitalize">{u.role}</td>
                  <td className="px-3 py-2">{u.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => toggleStatus(u)}
                      className="px-2 py-1 rounded bg-green-600 text-white text-xs"
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && users.length === 0 && <p className="p-4 text-gray-500">No users found.</p>}
          {loading && <p className="p-4 text-gray-500">Loading...</p>}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
