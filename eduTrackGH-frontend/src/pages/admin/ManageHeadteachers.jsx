/**
 * Manage Headteachers Page (Admin)
 * Purpose: View headteachers and assign them to schools
 */

import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useToast } from '../../context';
import adminService from '../../services/adminService';

const ManageHeadteachers = () => {
  const { showToast } = useToast();
  const [headteachers, setHeadteachers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [assigningId, setAssigningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [htRes, schoolRes] = await Promise.all([
          adminService.getHeadteachers(false),
          adminService.getSchools(false),
        ]);
        if (htRes.success) setHeadteachers(htRes.headteachers || []);
        else showToast(htRes.message || 'Failed to load headteachers', 'error');

        if (schoolRes.success) setSchools(schoolRes.schools || []);
        else showToast(schoolRes.message || 'Failed to load schools', 'error');
      } catch (err) {
        showToast(err?.message || 'Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  const handleAssign = async (headteacherId, schoolId) => {
    setAssigningId(headteacherId);
    try {
      const res = await adminService.assignHeadteacherToSchool(headteacherId, schoolId || null);
      if (res.success && res.headteacher) {
        setHeadteachers((prev) =>
          prev.map((ht) =>
            String(ht._id) === String(res.headteacher.id || res.headteacher._id)
              ? { ...ht, school: res.school || null }
              : ht,
          ),
        );
        showToast(res.message || 'Headteacher assignment updated', 'success');
      } else {
        showToast(res.message || 'Failed to assign headteacher', 'error');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to assign headteacher', 'error');
    } finally {
      setAssigningId(null);
    }
  };

  const handleDelete = async (headteacherId, email) => {
    const ok = window.confirm(
      `Delete this headteacher permanently?\n\n${email || headteacherId}\n\nThis cannot be undone.`,
    );
    if (!ok) return;
    setDeletingId(headteacherId);
    try {
      const res = await adminService.deleteHeadteacher(headteacherId);
      if (res.success) {
        setHeadteachers((prev) => prev.filter((h) => String(h._id) !== String(headteacherId)));
        showToast(res.message || 'Headteacher deleted', 'success');
      } else {
        showToast(res.message || 'Failed to delete headteacher', 'error');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete headteacher', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const mapped = useMemo(
    () =>
      (headteachers || []).map((h) => ({
        id: h._id,
        fullName: h.fullName,
        phone: h.phone,
        email: h.email,
        isActive: h.isActive,
        status: h.isActive ? 'active' : 'inactive',
        schoolLevel: h.schoolLevel, // PRIMARY | JHS
        schoolId: h.school?._id || h.school || '',
        schoolName: h.school?.name || '',
      })),
    [headteachers],
  );

  const filteredHeadteachers =
    filter === 'all' ? mapped : mapped.filter((h) => h.status === filter);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Manage Headteachers
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Assign headteachers to schools and view their status
            </p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Headteachers</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filteredHeadteachers.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text:white mb-2">
              No Headteachers Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No headteachers match your filter
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    School
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Assign to School
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredHeadteachers.map((ht) => (
                  <tr
                    key={ht.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {ht.fullName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {ht.phone || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {ht.schoolName || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {ht.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ht.status === 'active'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}
                      >
                        {ht.status.charAt(0).toUpperCase() + ht.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={ht.schoolId || ''}
                        onChange={(e) => handleAssign(ht.id, e.target.value || null)}
                        disabled={assigningId === ht.id || deletingId === ht.id}
                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Unassigned</option>
                        {schools
                          .filter((s) => {
                            if (!s?.isActive) return false;
                            if (!ht.schoolLevel) return true;
                            if (s.schoolLevel === 'BOTH') {
                              const slotTaken =
                                ht.schoolLevel === 'PRIMARY'
                                  ? s.primaryHeadteacher && String(s.primaryHeadteacher?._id || s.primaryHeadteacher) !== String(ht.id)
                                  : s.jhsHeadteacher && String(s.jhsHeadteacher?._id || s.jhsHeadteacher) !== String(ht.id);
                              return !slotTaken;
                            }
                            if (s.schoolLevel !== ht.schoolLevel) return false;
                            // single-level school: allow if unassigned or assigned to this HT (legacy headteacher)
                            if (!s.headteacher) return true;
                            return String(s.headteacher?._id || s.headteacher) === String(ht.id);
                          })
                          .map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.name} ({s.schoolLevel})
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(ht.id, ht.email)}
                        disabled={deletingId === ht.id}
                        className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {deletingId === ht.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageHeadteachers;
