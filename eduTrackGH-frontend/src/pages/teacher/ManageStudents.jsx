/**
 * Manage Students - Teacher Page
 * Optimized: Lazy loading, efficient state management
 */

import { useMemo, useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button, Modal } from '../../components/common';
import { ProposeStudentForm } from '../../components/teacher';
import { classroomService, studentService } from '../../services';
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

const isProposalPending = (s) =>
  String(s?.status || '').toLowerCase() === 'pending' || s?.isApproved === false;

const hasPendingRecordEdit = (s) => !!(s?.pendingEdit?.proposedAt && !isProposalPending(s));

const ManageStudents = () => {
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
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
    const fetchClassrooms = async () => {
      try {
        // Assuming teacher has access to their classrooms
        const result = await classroomService.getTeacherClassrooms();
        if (result.success) {
          setClassrooms(result.classrooms || []);
        }
      } catch (error) {
        showToast('Failed to load classrooms', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
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
            const res = await classroomService.getClassroomStudents(c._id, {
              includePendingProposals: true,
            });
            const students = res?.success ? res.students || [] : [];
            return [c._id, computeGenderCounts(students)];
          })
        );
        const next = {};
        pairs.forEach(([id, summary]) => {
          next[id] = summary;
        });
        setClassSummaries(next);
      } catch (err) {
        setClassSummaries({});
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummaries();
  }, [classrooms]);

  const openDetails = async (classroomId) => {
    setDetailsClassroomId(classroomId);
    setDetailsOpen(true);
    try {
      setDetailsLoading(true);
      const res = await classroomService.getClassroomStudents(classroomId, {
        includePendingProposals: true,
      });
      setDetailsStudents(res?.success ? res.students || [] : []);
    } catch {
      setDetailsStudents([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const openStudentView = (student) => {
    setActiveStudent(student || null);
    setStudentViewOpen(true);
  };

  const openStudentEdit = (student) => {
    setActiveStudent(student || null);
    const pe = student?.pendingEdit;
    const dobSource = pe?.dateOfBirth ?? student?.dateOfBirth;
    const dob = dobSource ? new Date(dobSource).toISOString().slice(0, 10) : '';
    setEditData({
      fullName: pe?.fullName ?? student?.fullName ?? '',
      dateOfBirth: dob,
      gender: pe?.gender ?? student?.gender ?? '',
      parentName: pe?.parentName ?? student?.parentName ?? '',
      parentEmail: pe?.parentEmail ?? student?.parentEmail ?? '',
      parentPhone: pe?.parentPhone ?? student?.parentPhone ?? '',
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
        showToast(
          res.pendingApproval
            ? res.message || 'Changes submitted for headteacher approval'
            : 'Student updated successfully',
          'success',
        );
        setDetailsStudents((prev) =>
          prev.map((s) => (s._id === activeStudent._id ? { ...s, ...(res.student || {}) } : s)),
        );
        setStudentEditOpen(false);
      } else {
        showToast(res?.message || 'Update failed', 'error');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Update failed', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const detailsClassroom = useMemo(
    () => classrooms.find((c) => c._id === detailsClassroomId) || null,
    [classrooms, detailsClassroomId]
  );

  const handleFormSuccess = () => {
    // Refresh or update any student lists if needed
    showToast('Student proposal submitted successfully', 'success');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Students</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Propose new students for headteacher approval
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              variant="primary"
              onClick={() => setShowForm(true)}
              disabled={classrooms.length === 0}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Propose Student
            </Button>
          </div>
        </div>

        {/* Current Students (awareness only) */}
        {classrooms.length > 0 && (
          <Card className="p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Students</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Class summary to avoid duplicate proposals.
                </p>
              </div>
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
                              onClick={() => openDetails(c._id)}
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

        {/* Classrooms Overview */}
        {classrooms.length === 0 ? (
          <Card className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No classrooms assigned</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Contact your headteacher to get assigned to classrooms.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom) => (
              <Card key={classroom._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {classroom.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {classroom.grade}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {classroom.studentCount || 0} students
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Student Registration Process
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  1. Propose students using the form above<br />
                  2. Headteacher reviews and approves/rejects proposals<br />
                  3. Approved students become active and can be marked for attendance<br />
                  4. Parents are automatically linked if email/phone matches existing accounts
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Propose Student Form Modal */}
      <ProposeStudentForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        classrooms={classrooms}
        onSuccess={handleFormSuccess}
      />

      {/* Read-only details modal */}
      <Modal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={detailsClassroom ? `View details · ${detailsClassroom.name || 'Class'}` : 'View details'}
        size="md"
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
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <div className="font-semibold text-gray-900 dark:text-slate-100">Class roster</div>
              <div className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                Use <b>Edit</b> to update details. New registrations still awaiting approval can be corrected directly;
                enrolled students go to the headteacher for approval.
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(() => {
                const { boys, girls, total } = computeGenderCounts(detailsStudents);
                const pendingProposals = detailsStudents.filter((s) => isProposalPending(s)).length;
                const pendingRecordEdits = detailsStudents.filter((s) => hasPendingRecordEdit(s)).length;
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
                    <div className="col-span-3 rounded-lg border border-gray-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-950">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {pendingProposals} pending registration{pendingProposals !== 1 ? 's' : ''}
                        {pendingRecordEdits > 0
                          ? ` · ${pendingRecordEdits} record update${pendingRecordEdits !== 1 ? 's' : ''} with headteacher`
                          : ''}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-950">
              <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 dark:border-slate-700 dark:text-slate-100">
                Recent students
              </div>
              <div className="divide-y divide-gray-200 dark:divide-slate-800">
                {detailsStudents
                  .slice()
                  .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
                  .slice(0, 8)
                  .map((s, idx) => {
                    const status = isProposalPending(s) ? 'Pending' : 'Active';
                    const linked = s?.parentEmail || s?.parentPhone || s?.parent ? 'Linked' : 'Not linked';
                    const when = s?.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—';
                    return (
                      <div key={s._id || idx} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-gray-900 dark:text-slate-100">{s?.fullName || `Student ${idx + 1}`}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-600 dark:text-slate-400">
                            <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-900">
                              {status}
                            </span>
                            <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-900">
                              {linked}
                            </span>
                            {hasPendingRecordEdit(s) && (
                              <span className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
                                Awaiting headteacher
                              </span>
                            )}
                            <span className="font-mono">{when}</span>
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
                            className="min-h-[2.5rem] rounded-md border border-indigo-500 bg-indigo-600 px-3 py-2 font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                            title={
                              isProposalPending(s)
                                ? 'Edit this registration proposal'
                                : 'Submit changes for headteacher approval'
                            }
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Student view modal */}
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
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-500">Status</div>
              <div className="mt-1 font-semibold text-gray-900 dark:text-white">
                {String(activeStudent?.status || '').toLowerCase() === 'pending' || activeStudent?.isApproved === false ? 'Pending' : 'Active'}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-500">Parent link</div>
              <div className="mt-1 font-semibold text-gray-900 dark:text-white">
                {activeStudent?.parentEmail || activeStudent?.parentPhone || activeStudent?.parent ? 'Linked' : 'Not linked'}
              </div>
            </div>
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

      {/* Student edit modal (correction) */}
      <Modal
        isOpen={studentEditOpen}
        onClose={() => setStudentEditOpen(false)}
        title={activeStudent?.fullName ? `Edit · ${activeStudent.fullName}` : 'Edit'}
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            {activeStudent && isProposalPending(activeStudent) ? (
              <p>
                This student is still a <b>registration proposal</b>. Your changes apply immediately before the
                headteacher approves or rejects.
              </p>
            ) : (
              <p>
                This student is on the official class list. Your changes are sent to the <b>headteacher</b> for approval
                before they update the school record.
              </p>
            )}
            {activeStudent && hasPendingRecordEdit(activeStudent) && (
              <p className="mt-2 font-medium">
                You already have a pending submission for this student. Saving again will replace it with your new
                values.
              </p>
            )}
          </div>
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