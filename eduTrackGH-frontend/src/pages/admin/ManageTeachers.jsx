/**
 * Manage Teachers Page (Admin)
 * Purpose: View, create, edit, and deactivate teacher accounts
 * Features: List all teachers, assign to schools, manage status
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import { useToast } from '../../context';
import adminService from '../../services/adminService';

const ManageTeachers = () => {
  const { showToast } = useToast();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    schoolLevel: 'PRIMARY',
    assignedClasses: [],
    password: ''
  });
  const [errors, setErrors] = useState({});

  // Available classes based on school level
  const classOptions = {
    PRIMARY: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
    JHS: ['JHS 1', 'JHS 2', 'JHS 3']
  };

  // Generate secure random password
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
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getTeachers();
      setTeachers(response.data || []);
    } catch (error) {
      console.error('Failed to load teachers:', error);
      showToast('Failed to load teachers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    // Phone optional (email notifications only)
    if (!editingTeacher && !formData.password?.trim()) newErrors.password = 'Password is required';
    if (!editingTeacher && formData.assignedClasses.length === 0) newErrors.assignedClasses = 'Select at least one class';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateteacher = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingTeacher) {
        // Update existing teacher
        const response = await adminService.updateTeacher(editingTeacher._id, formData);
        setTeachers(teachers.map(t => 
          t._id === editingTeacher._id 
            ? response.data
            : t
        ));
        showToast('Teacher updated successfully', 'success');
        handleCloseModal();
      } else {
        // Create new teacher
        const response = await adminService.createTeacher({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          tempPassword: formData.password,  // Backend expects 'tempPassword'
          schoolLevel: formData.schoolLevel,
          assignedClasses: formData.assignedClasses
        });

        // Add new teacher to list
        setTeachers([response.data, ...teachers]);
        setGeneratedPassword(formData.password);
        setShowPasswordModal(true);
        handleCloseModal();
        showToast('Teacher created successfully. Verification email sent.', 'success');
      }
    } catch (error) {
      console.error('Failed to save teacher:', error);
      showToast(error.response?.data?.message || 'Failed to save teacher', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      fullName: teacher.fullName,
      email: teacher.email,
      phone: teacher.phone,
      schoolLevel: teacher.schoolLevel,
      assignedClasses: teacher.assignedClasses || [],
      password: ''
    });
    setShowCreateModal(true);
  };

  const handleOpenCreateModal = () => {
    setEditingTeacher(null);
    const password = generateSecurePassword();
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      schoolLevel: 'PRIMARY',
      assignedClasses: [],
      password
    });
    setErrors({});
    setShowCreateModal(true);
  };

  const handleToggleClass = (className) => {
    setFormData(prev => ({
      ...prev,
      assignedClasses: prev.assignedClasses.includes(className)
        ? prev.assignedClasses.filter(c => c !== className)
        : [...prev.assignedClasses, className]
    }));
  };

  const handleSchoolLevelChange = (level) => {
    setFormData(prev => ({
      ...prev,
      schoolLevel: level,
      assignedClasses: [] // Reset classes when changing level
    }));
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingTeacher(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      schoolLevel: 'PRIMARY',
      assignedClasses: [],
      password: ''
    });
    setErrors({});
  };

  const handleCopyPassword = () => {
    if (formData.password) {
      navigator.clipboard.writeText(formData.password);
      showToast('Password copied!', 'success');
    }
  };

  const handleRegeneratePassword = () => {
    const newPassword = generateSecurePassword();
    setFormData({ ...formData, password: newPassword });
    showToast('New password generated', 'success');
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await adminService.toggleTeacherStatus(id);
      setTeachers(teachers.map(t => 
        t._id === id ? response.data : t
      ));
      const teacher = teachers.find(t => t._id === id);
      const newStatus = teacher?.status === 'active' ? 'inactive' : 'active';
      showToast(`Teacher ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (error) {
      console.error('Failed to update teacher status:', error);
      showToast('Failed to update teacher status', 'error');
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const matchFilter = filter === 'all' || t.status === filter;
    const matchSearch = t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       t.phone.includes(searchTerm);
    return matchFilter && matchSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Manage Teachers</h1>
            <p className="text-gray-600 dark:text-gray-400">Create, view, and manage teacher accounts</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition font-medium flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Teacher</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Teachers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{teachers.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">All roles</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active Teachers</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {teachers.filter(t => t.status === 'active').length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Currently active</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Classes Assigned</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {teachers.reduce((sum, t) => sum + t.classesAssigned, 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Total assignments</p>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-green-500 dark:focus:border-green-400 focus:outline-none"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-green-500 dark:focus:border-green-400 focus:outline-none"
            >
              <option value="all">All Teachers</option>
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
            <div className="text-center py-12 p-6">
              <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Teachers Found</h3>
              <p className="text-gray-600 dark:text-gray-400">No teachers match your search or filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Level</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">Classes</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map(teacher => (
                    <tr key={teacher._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {teacher.fullName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {teacher.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {teacher.phone}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          teacher.schoolLevel === 'PRIMARY'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        }`}>
                          {teacher.schoolLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">
                        {teacher.assignedClasses?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          teacher.status === 'active'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center space-x-2 flex items-center justify-center">
                        <button
                          onClick={() => handleEditTeacher(teacher)}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition text-xs font-medium"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(teacher._id)}
                          className={`inline-flex items-center px-2.5 py-1.5 rounded-lg transition text-xs font-medium ${
                            teacher.status === 'active'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          }`}
                        >
                          {teacher.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Create/Edit Teacher Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-scale-in">
            <div className="space-y-4">
              {/* Header */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingTeacher ? 'Edit Teacher' : 'Create New Teacher'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {editingTeacher 
                    ? 'Update teacher information'
                    : 'Add a new teacher to the system'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateteacher} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Grace Osei"
                    className={`w-full px-4 py-2 border-2 rounded-lg bg-white dark:bg-gray-700/80 text-gray-900 dark:text-white focus:outline-none transition ${
                      errors.fullName 
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:border-green-500'
                    }`}
                  />
                  {errors.fullName && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="grace@edutrack.test"
                    className={`w-full px-4 py-2 border-2 rounded-lg bg-white dark:bg-gray-700/80 text-gray-900 dark:text-white focus:outline-none transition ${
                      errors.email 
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:border-green-500'
                    }`}
                  />
                  {errors.email && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone (optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0241234567"
                    className={`w-full px-4 py-2 border-2 rounded-lg bg-white dark:bg-gray-700/80 text-gray-900 dark:text-white focus:outline-none transition ${
                      errors.phone 
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:border-green-500'
                    }`}
                  />
                  {errors.phone && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.phone}</p>}
                </div>

                {/* School Level */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">School Level</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleSchoolLevelChange('PRIMARY')}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition border-2 ${
                        formData.schoolLevel === 'PRIMARY'
                          ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      Primary
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSchoolLevelChange('JHS')}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition border-2 ${
                        formData.schoolLevel === 'JHS'
                          ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      JHS
                    </button>
                  </div>
                </div>

                {/* Assign Classes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Assign Classes</label>
                  <div className="grid grid-cols-3 gap-2">
                    {classOptions[formData.schoolLevel].map((className) => (
                      <button
                        key={className}
                        type="button"
                        onClick={() => handleToggleClass(className)}
                        className={`px-3 py-2.5 rounded-lg font-medium text-sm transition border-2 ${
                          formData.assignedClasses.includes(className)
                            ? 'border-green-500 dark:border-green-400 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {formData.assignedClasses.includes(className) && (
                          <span className="mr-1">✓</span>
                        )}
                        {className}
                      </button>
                    ))}
                  </div>
                  {formData.assignedClasses.length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Select at least one class</p>
                  )}
                </div>

                {/* Temporary Password Display (for new teachers only) */}
                {!editingTeacher && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Auto-Generated Password</label>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-700/80 rounded px-3 py-2 border border-green-300 dark:border-green-700">
                      <code className="flex-1 text-sm font-mono font-bold text-green-700 dark:text-green-400">
                        {formData.password}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition"
                        title="Copy password"
                      >
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={handleRegeneratePassword}
                        className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition"
                        title="Generate new password"
                      >
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-2">✓ Will be sent via email to the teacher</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 dark:from-green-600 dark:to-green-700 text-white hover:from-green-700 hover:to-green-800 transition font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingTeacher ? 'Update Teacher' : 'Create Teacher'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && generatedPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto p-8 space-y-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Teacher Created Successfully!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Here's the temporary password:</p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Temporary Password:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono font-bold text-gray-900 dark:text-white break-all">
                  {generatedPassword}
                </code>
                <button
                  onClick={handleCopyPassword}
                  className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                  title="Copy password"
                >
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Important:</p>
              <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                <li>• Copy this password now - you won't see it again</li>
                <li>• A confirmation email has been sent to the teacher</li>
                <li>• Teacher must change password on first login</li>
                <li>• Email expires in 24 hours</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setShowPasswordModal(false);
                setGeneratedPassword(null);
                showToast('Teacher created and email sent successfully', 'success');
              }}
              className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition font-medium"
            >
              Understood
            </button>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageTeachers;
