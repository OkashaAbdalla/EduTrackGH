/**
 * Headteacher: approve or reject teacher-proposed changes to enrolled students.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '../common';
import { studentService } from '../../services';
import { useToast } from '../../context';

const fmt = (v) => {
  if (v == null || v === '') return '—';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    try {
      return new Date(v).toLocaleDateString();
    } catch {
      return v;
    }
  }
  return String(v);
};

const PendingStudentEditsManager = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const load = useCallback(async () => {
    try {
      const result = await studentService.getPendingStudentEdits();
      if (result.success) {
        setStudents(result.students || []);
      } else {
        showToast(result.message || 'Failed to load pending edits', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load pending edits', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (studentId, action) => {
    setActionLoading((prev) => ({ ...prev, [studentId]: action }));
    try {
      const result =
        action === 'approve'
          ? await studentService.approveStudentPendingEdit(studentId)
          : await studentService.rejectStudentPendingEdit(studentId);
      if (result.success) {
        showToast(
          action === 'approve' ? 'Changes approved and applied' : 'Teacher edit dismissed',
          'success',
        );
        setStudents((prev) => prev.filter((s) => s._id !== studentId));
      } else {
        showToast(result.message || `Failed to ${action}`, 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || `Failed to ${action}`, 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [studentId]: null }));
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-green-600" />
        </div>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card className="p-6">
        <div className="py-8 text-center">
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pending record updates</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            When class teachers submit edits to enrolled students, they will appear here for your approval.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Pending student record updates ({students.length})
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Teachers proposed these changes to existing students. Approve to update the official record, or reject to
          discard.
        </p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {students.map((student) => {
          const pe = student.pendingEdit || {};
          const cls = student.classroom;
          const classLabel = cls ? `${cls.name || 'Class'}${cls.grade ? ` (${cls.grade})` : ''}` : '—';
          const proposer = pe.proposedBy?.fullName || 'Teacher';
          const proposedAt = pe.proposedAt ? new Date(pe.proposedAt).toLocaleString() : '—';

          const rows = [
            ['Full name', student.fullName, pe.fullName],
            ['Date of birth', fmt(student.dateOfBirth), pe.dateOfBirth != null ? fmt(pe.dateOfBirth) : null],
            ['Gender', fmt(student.gender), pe.gender != null && pe.gender !== '' ? fmt(pe.gender) : null],
            ['Parent name', student.parentName || '—', pe.parentName],
            ['Parent email', student.parentEmail || '—', pe.parentEmail],
            ['Parent phone', student.parentPhone || '—', pe.parentPhone],
          ].filter(([, , proposed]) => proposed != null && proposed !== '');

          return (
            <div key={student._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{student.fullName}</p>
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                      Update pending
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Class: {classLabel} · Proposed by {proposer} · {proposedAt}
                  </p>

                  <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                    <table className="min-w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-slate-900">
                        <tr>
                          <th className="px-3 py-2 font-semibold text-gray-600 dark:text-slate-400">Field</th>
                          <th className="px-3 py-2 font-semibold text-gray-600 dark:text-slate-400">Current</th>
                          <th className="px-3 py-2 font-semibold text-indigo-700 dark:text-indigo-300">Proposed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {(rows.length ? rows : [['Full name', student.fullName, pe.fullName]]).map(([label, cur, prop]) => (
                          <tr key={label}>
                            <td className="px-3 py-2 text-gray-700 dark:text-slate-300">{label}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-slate-400">{fmt(cur)}</td>
                            <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{fmt(prop)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2 lg:flex-col">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAction(student._id, 'reject')}
                    loading={actionLoading[student._id] === 'reject'}
                    disabled={!!actionLoading[student._id]}
                    className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleAction(student._id, 'approve')}
                    loading={actionLoading[student._id] === 'approve'}
                    disabled={!!actionLoading[student._id]}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default PendingStudentEditsManager;
