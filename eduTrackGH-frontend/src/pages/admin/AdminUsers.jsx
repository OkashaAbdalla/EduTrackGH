import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import adminService from '../../services/adminService';
import { useToast, useConfirm } from '../../context';

const AdminUsers = () => {
  const { showToast } = useToast();
  const { requestConfirmation } = useConfirm();
  const [role, setRole] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDelete = async (u) => {
    const id = u._id || u.id;
    const ok = await requestConfirmation({
      title: 'Delete user',
      message: `Permanently delete ${u.fullName || u.email}?\n\nRole: ${u.role}\nEmail: ${u.email}\n\nThis cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      tone: 'danger',
    });
    if (!ok) return;

    setDeletingId(id);
    try {
      const res = await adminService.deleteUser(id);
      if (res.success) {
        showToast(res.message || 'User deleted', 'success');
        load();
      } else {
        showToast(res.message || 'Failed to delete user', 'error');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
        <Card className="p-4">
          <label className="text-sm text-gray-600 dark:text-gray-400 mr-2">Filter role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="ui-select ui-select-inline"
          >
            <option value="">All</option>
            <option value="admin">Admin</option>
            <option value="headteacher">Headteacher</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
          </select>
        </Card>
        <Card className="p-0 overflow-x-auto table-scroll">
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
              {users.map((u) => {
                const id = u._id || u.id;
                return (
                  <tr key={id} className="border-t dark:border-gray-800">
                    <td className="px-3 py-2">{u.fullName}</td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2 capitalize">{u.role}</td>
                    <td className="px-3 py-2">{u.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="px-3 py-2">
                      {u.role === 'super_admin' ? (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Protected</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          disabled={deletingId === id}
                          className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs disabled:opacity-50"
                        >
                          {deletingId === id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
