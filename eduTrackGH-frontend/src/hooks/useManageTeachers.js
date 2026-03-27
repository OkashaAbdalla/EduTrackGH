/**
 * useManageTeachers – data and handlers for headteacher Manage Teachers page
 */

import { useState, useEffect, useCallback } from 'react';
import { headteacherService } from '../services';
import { useToast } from '../context';

export function generateSecurePassword() {
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
}

const initialFormData = { fullName: '', email: '', phone: '', password: '' };

export function useManageTeachers() {
  const { showToast } = useToast();
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [viewDetailsTeacher, setViewDetailsTeacher] = useState(null);
  const [assignTeacher, setAssignTeacher] = useState(null);
  const [assignClassroomId, setAssignClassroomId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tRes, cRes] = await Promise.all([
        headteacherService.getTeachers(),
        headteacherService.getClassrooms(),
      ]);
      if (tRes.success) {
        const raw = tRes.teachers || [];
        setTeachers(raw.map((t) => ({ ...t, isActive: t.isActive !== undefined ? t.isActive : true })));
      } else showToast(tRes.message || 'Failed to load teachers', 'error');
      if (cRes.success) setClassrooms(cRes.classrooms || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load teachers', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredTeachers = teachers.filter((t) => {
    const status = t.isActive ? 'active' : 'inactive';
    const q = searchTerm.toLowerCase();
    return (filter === 'all' || status === filter) &&
      (!q || t.fullName?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q));
  });

  const getAssignedClassrooms = useCallback((teacherId) => {
    return classrooms.filter(
      (c) => c.teacherId && (String(c.teacherId._id || c.teacherId) === String(teacherId))
    );
  }, [classrooms]);

  const handleOpenCreateModal = useCallback(() => {
    setFormData({ ...initialFormData, password: generateSecurePassword() });
    setErrors({});
    setShowCreateModal(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setFormData(initialFormData);
    setErrors({});
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password?.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSaveTeacher = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm()) { showToast('Please fix the errors in the form', 'error'); return; }
    setSaving(true);
    try {
      const result = await headteacherService.createTeacher({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        tempPassword: formData.password,
      });
      if (result.success) {
        setTeachers((prev) => [result.teacher, ...prev]);
        setGeneratedPassword(formData.password);
        setShowPasswordModal(true);
        showToast('Teacher created successfully', 'success');
        handleCloseCreateModal();
      } else showToast(result.message || 'Failed to create teacher', 'error');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create teacher', 'error');
    } finally {
      setSaving(false);
    }
  }, [formData, validateForm, showToast, handleCloseCreateModal]);

  const handleToggleStatus = useCallback(async (id) => {
    try {
      const res = await headteacherService.toggleTeacherStatus(id);
      if (res.success && res.teacher) {
        setTeachers((prev) => prev.map((t) => (t._id || t.id) === id ? { ...t, ...res.teacher, isActive: res.teacher.isActive } : t));
        showToast(res.message || 'Teacher status updated', 'success');
      } else showToast(res.message || 'Failed to update teacher status', 'error');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update teacher status', 'error');
    }
  }, [showToast]);

  const handleDeleteTeacher = useCallback(async (teacher) => {
    const id = teacher?._id || teacher?.id;
    if (!id) return;
    const ok = window.confirm(
      `Delete this teacher permanently?\n\n${teacher.fullName || 'Teacher'} (${teacher.email || ''})\n\nThis cannot be undone.`,
    );
    if (!ok) return;
    setDeletingId(id);
    try {
      const res = await headteacherService.deleteTeacher(id);
      if (res.success) {
        setTeachers((prev) => prev.filter((t) => String(t._id || t.id) !== String(id)));
        // Also clear any classroom assignments in local state
        setClassrooms((prev) => prev.map((c) => {
          const tid = c.teacherId?._id || c.teacherId;
          return String(tid || '') === String(id) ? { ...c, teacherId: null } : c;
        }));
        showToast(res.message || 'Teacher deleted successfully', 'success');
      } else {
        showToast(res.message || 'Failed to delete teacher', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete teacher', 'error');
    } finally {
      setDeletingId(null);
    }
  }, [showToast]);

  const handleAssignClassroom = useCallback(async (e) => {
    e.preventDefault();
    if (!assignTeacher || !assignClassroomId) { showToast('Please select a classroom', 'error'); return; }
    setAssigning(true);
    try {
      const result = await headteacherService.assignClassTeacher(assignClassroomId, assignTeacher._id || assignTeacher.id);
      if (result.success && result.classroom) {
        setClassrooms((prev) => prev.map((c) => String(c._id) === String(assignClassroomId) ? result.classroom : c));
        showToast('Teacher assigned to classroom successfully', 'success');
        setAssignTeacher(null);
        setAssignClassroomId('');
      } else showToast(result.message || 'Failed to assign classroom', 'error');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to assign classroom', 'error');
    } finally {
      setAssigning(false);
    }
  }, [assignTeacher, assignClassroomId, showToast]);

  return {
    teachers,
    classrooms,
    loading,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    filteredTeachers,
    showCreateModal,
    setShowCreateModal,
    saving,
    formData,
    setFormData,
    errors,
    generatedPassword,
    showPasswordModal,
    setShowPasswordModal,
    viewDetailsTeacher,
    setViewDetailsTeacher,
    assignTeacher,
    setAssignTeacher,
    assignClassroomId,
    setAssignClassroomId,
    assigning,
    deletingId,
    getAssignedClassrooms,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleSaveTeacher,
    validateForm,
    handleToggleStatus,
    handleDeleteTeacher,
    handleAssignClassroom,
  };
}
