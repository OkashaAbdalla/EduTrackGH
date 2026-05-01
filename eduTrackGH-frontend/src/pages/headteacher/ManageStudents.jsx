/**
 * Manage Students - Headteacher Page
 * Headteacher can:
 *  - Directly register students (current school roster)
 *  - Review and approve/reject students proposed by teachers
 */

import { useMemo, useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button, Modal } from '../../components/common';
import { PendingStudentsManager, PendingStudentEditsManager, HeadteacherRegisterStudentForm } from '../../components/headteacher';
import { headteacherService, studentService } from '../../services';
import { useToast } from '../../context';

const computeGenderCounts = (students = []) => {
  let boys = 0;
  let girls = 0;
  for (const s of students) {
    const g = String(s?.gender || '').toUpperCase();
    if (g === 'MALE' || g === 'M' || g === 'BOY') boys += 1;
    else if (g === 'FEMALE' || g === 'F' || g === 'GIRL') girls += 1;
  }
  return { boys, girls, total: students.length };
};

const hasPendingTeacherEdit = (s) => !!(s?.pendingEdit?.proposedAt);

const ManageStudents = () => {
  const { showToast } = useToast();
  const [classrooms, setClassrooms] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [classSummaries, setClassSummaries] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsClassroomId, setDetailsClassroomId] = useState('');
  const [detailsStudents, setDetailsStudents] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [studentViewOpen, setStudentViewOpen] = useState(false);
  const [studentEditOpen, setStudentEditOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editData, setEditData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
  });

  useEffect(() => {
    const loadClassrooms = async () => {
      try {
        const res = await headteacherService.getClassrooms();
        if (res.success) {
          setClassrooms(res.classrooms || []);
        } else {
          showToast(res.message || 'Failed to load classrooms', 'error');
        }
      } catch (error) {
        showToast(error.response?.data?.message || 'Failed to load classrooms', 'error');
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClassrooms();
  }, [showToast]);

  useEffect(() => {
    const fetchSummaries = async () => {
      if (!classrooms.length) {
        setClassSummaries({});
        return;
      }
      try {
        setSummaryLoading(true);
        const pairs = await Promise.all(
          classrooms.map(async (c) => {
            const res = await studentService.getStudents({ classroom: c._id });
            const students = res?.success ? res.students || [] : [];
            return [c._id, computeGenderCounts(students)];
          })
        );
        const next = {};
        pairs.forEach(([id, summary]) => (next[id] = summary));
        setClassSummaries(next);
      } catch {
        setClassSummaries({});
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummaries();
  }, [classrooms]);

  const openClassDetails = async (classroomId) => {
    setDetailsClassroomId(classroomId);
    setDetailsOpen(true);
    try {
      setDetailsLoading(true);
      const res = await studentService.getStudents({ classroom: classroomId });
      setDetailsStudents(res?.success ? res.students || [] : []);
    } catch {
      setDetailsStudents([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const detailsClassroom = useMemo(
    () => classrooms.find((c) => c._id === detailsClassroomId) || null,
    [classrooms, detailsClassroomId]
  );

  const openStudentView = (student) => {
    setActiveStudent(student || null);
    setStudentViewOpen(true);
  };

  const openStudentEdit = (student) => {
    setActiveStudent(student || null);
    const dob = student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().slice(0, 10) : '';
    setEditData({
      fullName: student?.fullName || '',
      dateOfBirth: dob,
      gender: student?.gender || '',
      parentName: student?.parentName || '',
      parentEmail: student?.parentEmail || '',
      parentPhone: student?.parentPhone || '',
    });
    setStudentEditOpen(true);
  };

  const saveEdit = async () => {
    if (!activeStudent?._id) return;
    setEditSaving(true);
    try {
      const payload = {
        fullName: editData.fullName,
        dateOfBirth: editData.dateOfBirth || undefined,
        gender: editData.gender || undefined,
        parentName: editData.parentName || undefined,
        parentEmail: editData.parentEmail || undefined,
        parentPhone: editData.parentPhone || undefined,
      };
      const res = await studentService.updateStudent(activeStudent._id, payload);
      if (res?.success) {
        showToast('Student updated successfully', 'success');
        setDetailsStudents((prev) => prev.map((s) => (s._id === activeStudent._id ? { ...s, ...res.student } : s)));
        setStudentEditOpen(false);
      } else showToast(res?.message || 'Update failed', 'error');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Update failed', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Register current students directly and approve new students proposed by teachers.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              onClick={() => setShowRegisterModal(true)}
              disabled={loadingClasses || classrooms.length === 0}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Register Student
            </Button>
          </div>
        </div>

        {/* Info card about flows */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-100">
            Headteachers can register current students directly. Teachers may propose new students or submit edits to
            enrolled students; both flows appear below for your approval.
          </p>
        </Card>

        {/* Current Students (class summary) */}
        {classrooms.length > 0 && (
          <Card className="p-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Students</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Class summary (register view).</p>
            </div>
            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[520px] overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                <div className="grid grid-cols-4 gap-0 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:bg-slate-900 dark:text-slate-400">
                  <div className="px-4 py-3">Class</div>
                  <div className="px-4 py-3 text-center">Boys</div>
                  <div className="px-4 py-3 text-center">Girls</div>
                  <div className="px-4 py-3 text-right">Action</div>
                </div>
                {summaryLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-green-600"></div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-slate-800">
                    {classrooms.map((c) => {
                      const s = classSummaries[c._id] || { boys: 0, girls: 0, total: c.studentCount || 0 };
                      return (
                        <div key={c._id} className="grid grid-cols-4 gap-0 text-sm text-gray-900 dark:text-slate-200">
                          <div className="px-4 py-3 font-semibold">
                            {c.name || 'Class'}{c.grade ? ` (${c.grade})` : ''}
                          </div>
                          <div className="px-4 py-3 text-center tabular-nums">{s.boys}</div>
                          <div className="px-4 py-3 text-center tabular-nums">{s.girls}</div>
                          <div className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => openClassDetails(c._id)}
                              className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              View details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Pending record updates (teacher edits to enrolled students) */}
        <PendingStudentEditsManager />

        {/* Pending Students Manager (new student proposals) */}
        <PendingStudentsManager />
      </div>

      {/* Headteacher Register Student Modal */}
      <HeadteacherRegisterStudentForm
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        classrooms={classrooms}
        onSuccess={() => {}}
      />

      {/* Class details modal */}
      <Modal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={detailsClassroom ? `View details · ${detailsClassroom.name || 'Class'}` : 'View details'}
        size="lg"
      >
        {detailsLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-green-600"></div>
          </div>
        ) : detailsStudents.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            No students found for this class.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(() => {
                const { boys, girls, total } = computeGenderCounts(detailsStudents);
                return (
                  <>
                    <div className="rounded-lg border border-gray-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-950">
                      <div className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{total}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-500">Total</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-950">
                      <div className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{boys}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-500">Boys</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-950">
                      <div className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{girls}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-500">Girls</div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-950">
              <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 dark:border-slate-700 dark:text-slate-100">
                Students
              </div>
              <div className="divide-y divide-gray-200 dark:divide-slate-800">
                {detailsStudents
                  .slice()
                  .sort((a, b) => (a?.fullName || '').localeCompare(b?.fullName || ''))
                  .slice(0, 25)
                  .map((s, idx) => (
                    <div key={s._id || idx} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate font-semibold text-gray-900 dark:text-slate-100">{s?.fullName || ''}</div>
                          {hasPendingTeacherEdit(s) && (
                            <span className="shrink-0 rounded border border-amber-400 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100">
                              Teacher edit pending
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-[11px] text-gray-600 dark:text-slate-400">
                          {String(s?.status || '').toLowerCase() === 'pending' || s?.isApproved === false ? 'Pending' : 'Active'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => openStudentView(s)}
                          className="rounded-md border border-gray-200 bg-white px-3 py-2 font-semibold text-gray-800 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          View details
                        </button>
                        <button
                          type="button"
                          onClick={() => openStudentEdit(s)}
                          className="rounded-md bg-indigo-600 px-3 py-2 font-semibold text-white hover:bg-indigo-700"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              {detailsStudents.length > 25 && (
                <div className="px-4 py-3 text-xs text-gray-500 dark:text-slate-500">
                  Showing 25 of {detailsStudents.length} students.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={studentViewOpen}
        onClose={() => setStudentViewOpen(false)}
        title={activeStudent?.fullName ? `View details · ${activeStudent.fullName}` : 'View details'}
        size="md"
      >
        <div className="space-y-3 text-sm text-gray-700 dark:text-slate-300">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="font-semibold text-gray-900 dark:text-white">Read-only</div>
            <div className="mt-1 text-sm text-gray-600 dark:text-slate-400">This view is for awareness only.</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-500">Parent contact</div>
            <div className="mt-1 text-gray-900 dark:text-white">
              {activeStudent?.parentName || ''}{activeStudent?.parentEmail ? `${activeStudent?.parentName ? ' · ' : ''}${activeStudent.parentEmail}` : ''}{activeStudent?.parentPhone ? `${activeStudent?.parentName || activeStudent?.parentEmail ? ' · ' : ''}${activeStudent.parentPhone}` : ''}
              {!activeStudent?.parentName && !activeStudent?.parentEmail && !activeStudent?.parentPhone ? 'Not provided' : ''}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={studentEditOpen}
        onClose={() => setStudentEditOpen(false)}
        title={activeStudent?.fullName ? `Edit · ${activeStudent.fullName}` : 'Edit'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input
                value={editData.fullName}
                onChange={(e) => setEditData((p) => ({ ...p, fullName: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
              <select
                value={editData.gender}
                onChange={(e) => setEditData((p) => ({ ...p, gender: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
              <input
                type="date"
                value={editData.dateOfBirth}
                onChange={(e) => setEditData((p) => ({ ...p, dateOfBirth: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parent Name</label>
              <input
                value={editData.parentName}
                onChange={(e) => setEditData((p) => ({ ...p, parentName: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parent Email</label>
              <input
                type="email"
                value={editData.parentEmail}
                onChange={(e) => setEditData((p) => ({ ...p, parentEmail: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parent Phone</label>
              <input
                value={editData.parentPhone}
                onChange={(e) => setEditData((p) => ({ ...p, parentPhone: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setStudentEditOpen(false)} disabled={editSaving}>
              Cancel
            </Button>
            <Button variant="primary" type="button" onClick={saveEdit} loading={editSaving}>
              Save changes
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default ManageStudents;