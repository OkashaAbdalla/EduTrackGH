import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import adminService from '../../services/adminService';

const AdminAuthLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ role: '', action: '', search: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const load = async () => {
    const data = await adminService.getAuthLogs({ ...filters, page, limit });
    setLogs(data.logs || []);
    setTotal(Number(data.total || 0));
  };

  useEffect(() => {
    load();
  }, [page]);

  const onFilter = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Auth Logs</h1>
        <Card className="p-4">
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={onFilter}>
            <input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search email"
              className="px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-700"
            />
            <select value={filters.role} onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))} className="px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-700">
              <option value="">All roles</option>
              <option value="super_admin">super_admin</option>
              <option value="admin">admin</option>
              <option value="headteacher">headteacher</option>
              <option value="teacher">teacher</option>
              <option value="parent">parent</option>
            </select>
            <select value={filters.action} onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))} className="px-3 py-2 rounded border dark:bg-gray-800 dark:border-gray-700">
              <option value="">All actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="FAILED_LOGIN">FAILED_LOGIN</option>
              <option value="PASSWORD_RESET">PASSWORD_RESET</option>
            </select>
            <button type="submit" className="px-3 py-2 rounded bg-green-600 text-white">Apply</button>
          </form>
        </Card>
        <Card className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">IP</th>
                <th className="px-3 py-2 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id} className="border-t dark:border-gray-800">
                  <td className="px-3 py-2">{l.email}</td>
                  <td className="px-3 py-2">{l.role || '-'}</td>
                  <td className="px-3 py-2">{l.action}</td>
                  <td className="px-3 py-2">{l.ipAddress || '-'}</td>
                  <td className="px-3 py-2">{new Date(l.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div className="flex items-center justify-between">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-2 rounded border disabled:opacity-50 dark:border-gray-700">Prev</button>
          <span className="text-sm text-gray-500">Page {page} / {Math.max(1, Math.ceil(total / limit))}</span>
          <button disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} className="px-3 py-2 rounded border disabled:opacity-50 dark:border-gray-700">Next</button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAuthLogs;
