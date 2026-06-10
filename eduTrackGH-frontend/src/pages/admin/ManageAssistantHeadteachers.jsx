/**
 * Manage Assistant Headteachers (Admin)
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import adminService from '../../services/adminService';
import { useToast, useConfirm } from '../../context';

const ManageAssistantHeadteachers = () => {
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { requestConfirmation } = useConfirm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAssistantHeadteachers();
      if (res.success) setAssistants(res.assistants || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id, name) => {
    const ok = await requestConfirmation({
      title: 'Delete Assistant Headteacher',
      message: `Delete ${name}? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      tone: 'danger',
    });
    if (!ok) return;
    const res = await adminService.deleteAssistantHeadteacher(id);
    if (res.success) {
      showToast('Assistant headteacher deleted', 'success');
      load();
    } else {
      showToast(res.message || 'Delete failed', 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Assistant Headteachers</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">School-level cover accounts linked to headteachers</p>
          </div>
          <Link
            to={ROUTES.CREATE_ASSISTANT_HEADTEACHER}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
          >
            Create Assistant
          </Link>
        </div>
        {loading ? (
          <Card className="p-12 text-center text-gray-500">Loading…</Card>
        ) : assistants.length === 0 ? (
          <Card className="p-12 text-center text-gray-500">No assistant headteachers yet</Card>
        ) : (
          <div className="space-y-3">
            {assistants.map((a) => (
              <Card key={a.id || a._id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{a.fullName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{a.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {a.school?.name || 'School'} · {a.schoolLevel} · HT: {a.linkedHeadteacher?.fullName || '—'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id || a._id, a.fullName)}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageAssistantHeadteachers;
