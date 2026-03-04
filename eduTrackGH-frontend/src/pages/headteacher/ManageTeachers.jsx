/**
 * Manage Teachers Page (Headteacher)
 * Purpose: Headteacher creates and views teachers in their school
 * Scope: Only teachers belonging to the headteacher's school
 * Privacy: Phone not displayed (no SMS); details in View Details modal
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Button, Modal } from '../../components/common';
import { useToast } from '../../context';
import { headteacherService } from '../../services';

const ManageTeachers = () => {
  const { showToast } = useToast();
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [viewDetailsTeacher, setViewDetailsTeacher] = useState(null);
  const [assignTeacher, setAssignTeacher] = useState(null);
  const [assignClassroomId, setAssignClassroomId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Generate secure random password (same approach as admin)
  const generateSecurePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const [tRes, cRes] = await Promise.all([
          headteacherService.getTeachers(),
          headteacherService.getClassrooms(),
        ]);
        if (tRes.success) {
          const raw = tRes.teachers || [];
          const normalized = raw.map((t) => ({
            ...t,
            isActive: t.isActive !== undefined ? t.isActive : true,
          }));
          setTeachers(normalized);
        } else {
          showToast(tRes.message || 'Failed to load teachers', 'error');
        }
        if (cRes.success) setClassrooms(cRes.classrooms || []);
      } catch (error) {
        showToast(error.response?.data?.message || 'Failed to load teachers', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, [showToast]);

  const handleOpenCreateModal = () => {
    const password = generateSecurePassword();
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      password,
    });
    setErrors({});
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password?.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        tempPassword: formData.password,
      };

      const result = await headteacherService.createTeacher(payload);
      if (result.success) {
        const newTeacher = result.teacher;
        setTeachers(prev => [newTeacher, ...prev]);
        setGeneratedPassword(formData.password);
        setShowPasswordModal(true);
        showToast('Teacher created successfully', 'success');
        handleCloseCreateModal();
      } else {
        showToast(result.message || 'Failed to create teacher', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create teacher', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      showToast('Password copied to clipboard', 'success');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await headteacherService.toggleTeacherStatus(id);
      if (res.success && res.teacher) {
        const updated = res.teacher;
        setTeachers((prev) =>
          prev.map((t) =>
            (t._id || t.id) === id ? { ...t, ...updated, isActive: updated.isActive } : t
          )
        );
        showToast(res.message || 'Teacher status updated', 'success');
      } else {
        showToast(res.message || 'Failed to update teacher status', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update teacher status', 'error');
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const status = t.isActive ? 'active' : 'inactive';
    const matchesFilter = filter === 'all' || status === filter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      t.fullName?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const getAssignedClassrooms = (teacherId) =>
    classrooms.filter(
      (c) => c.teacherId && (String(c.teacherId._id || c.teacherId) === String(teacherId))
    );

  const handleAssignClassroom = async (e) => {
    e.preventDefault();
    if (!assignTeacher || !assignClassroomId) {
      showToast('Please select a classroom', 'error');
      return;
    }
    setAssigning(true);
    try {
      const result = await headteacherService.assignClassTeacher(assignClassroomId, assignTeacher._id || assignTeacher.id);
      if (result.success && result.classroom) {
        setClassrooms((prev) =>
          prev.map((c) =>
            String(c._id) === String(assignClassroomId) ? result.classroom : c
          )
        );
        showToast('Teacher assigned to classroom successfully', 'success');
        setAssignTeacher(null);
        setAssignClassroomId('');
      } else {
        showToast(result.message || 'Failed to assign classroom', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to assign classroom', 'error');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Manage Teachers
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create and view teacher accounts for your school
            </p>
          </div>
          <Button variant="primary" onClick={handleOpenCreateModal}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Teacher
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Teachers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {teachers.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                In your school
              </p>
            </div>
          </Card>
          <Card className="p-6 bg-green-50 dark:bg-green-900/15 border border-green-100 dark:border-green-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800/60 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Secure onboarding
                </p>
                <p className="text-xs text-green-700 dark:text-green-300/80">
                  Temporary passwords are generated and can be shared with teachers.
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Teachers</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {teachers.filter((t) => t.isActive).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Currently active in your school
              </p>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </Card>

        {/* Teachers Table */}
        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-10 px-6">
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                No teachers yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start by creating teacher accounts for your school.
              </p>
              <Button variant="primary" onClick={handleOpenCreateModal}>
                Create First Teacher
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredTeachers.map((teacher) => {
                    const status = teacher.isActive ? 'Active' : 'Inactive';
                    return (
                    <tr key={teacher._id || teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/70">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {teacher.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {teacher.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(teacher._id || teacher.id)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            teacher.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {status}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setViewDetailsTeacher(teacher)}
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            View Details
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAssignTeacher(teacher); setAssignClassroomId(''); }}
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/60"
                          >
                            Assign Classroom
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Create Teacher Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create Teacher
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Teacher will be linked to your school automatically.
                </p>
              </div>
              <button
                onClick={handleCloseCreateModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSaveTeacher}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g. Ama Mensah"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="teacher@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone (optional)
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0241234567"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Temporary Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const pwd = generateSecurePassword();
                      setFormData(prev => ({ ...prev, password: pwd }));
                      showToast('New password generated', 'success');
                    }}
                    className="text-xs text-green-700 dark:text-green-300 hover:underline"
                  >
                    Regenerate
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(formData.password || '');
                      showToast('Password copied', 'success');
                    }}
                    className="px-3 py-2 text-xs border rounded-lg border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Copy
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseCreateModal}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={saving}>
                  Create Teacher
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      <Modal
        isOpen={!!viewDetailsTeacher}
        onClose={() => setViewDetailsTeacher(null)}
        title="Teacher Details"
        size="md"
      >
        {viewDetailsTeacher && (
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Full Name</span>
              <p className="font-medium text-gray-900 dark:text-white mt-0.5">{viewDetailsTeacher.fullName}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Email</span>
              <p className="font-medium text-gray-900 dark:text-white mt-0.5">{viewDetailsTeacher.email}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Status</span>
              <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                {viewDetailsTeacher.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Assigned Classroom(s)</span>
              <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                {getAssignedClassrooms(viewDetailsTeacher._id || viewDetailsTeacher.id).length > 0
                  ? getAssignedClassrooms(viewDetailsTeacher._id || viewDetailsTeacher.id)
                      .map((c) => `${c.name} (${c.grade})`)
                      .join(', ')
                  : 'None'}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Account Created</span>
              <p className="font-medium text-gray-900 dark:text-white mt-0.5">
                {viewDetailsTeacher.createdAt
                  ? new Date(viewDetailsTeacher.createdAt).toLocaleDateString()
                  : '—'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Classroom Modal */}
      <Modal
        isOpen={!!assignTeacher}
        onClose={() => { setAssignTeacher(null); setAssignClassroomId(''); }}
        title="Assign Classroom"
        size="md"
      >
        {assignTeacher && (
          <form onSubmit={handleAssignClassroom} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Assign <span className="font-medium text-gray-900 dark:text-white">{assignTeacher.fullName}</span> to a classroom.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Classroom
              </label>
              <select
                value={assignClassroomId}
                onChange={(e) => setAssignClassroomId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select a classroom</option>
                {classrooms.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.grade})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setAssignTeacher(null); setAssignClassroomId(''); }}
                disabled={assigning}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={assigning}>
                Assign
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Password Info Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Teacher Account Created
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Share this temporary password with the teacher. They can change it after first login.
            </p>
            <div className="flex items-center justify-between px-3 py-2 border rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 mb-4">
              <span className="font-mono text-sm text-gray-900 dark:text-white">
                {generatedPassword}
              </span>
              <button
                onClick={handleCopyPassword}
                className="text-xs text-green-700 dark:text-green-300 hover:underline"
              >
                Copy
              </button>
            </div>
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => setShowPasswordModal(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageTeachers;

