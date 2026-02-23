/**
 * Headteacher Dashboard
 * Purpose: School-wide overview for headteachers
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { ROUTES } from '../../utils/constants';
import { Card } from '../../components/common';
import { useAuthContext, useToast } from '../../context';
import authService from '../../services/authService';
import { compressImageFile } from '../../utils/helpers';

const HeadteacherDashboard = () => {
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const schoolLevel = user?.schoolLevel; // PRIMARY or JHS
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceRate: 0,
    teachersCompliant: 0,
    flaggedStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || localStorage.getItem('user_avatar') || '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    // TODO: Replace with real API call
    const fetchStats = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      setStats({
        totalStudents: 450,
        attendanceRate: 87.5,
        teachersCompliant: 8,
        flaggedStudents: 12,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image too large (max 2MB).', 'error');
      return;
    }
    setAvatarLoading(true);
    try {
      const base64 = await compressImageFile(file, { maxDimension: 512, maxSizeBytes: 300 * 1024 });
      const res = await authService.uploadProfilePhoto(base64);
      if (res.success && res.avatarUrl) {
        setAvatarUrl(res.avatarUrl);
        localStorage.setItem('user_avatar', res.avatarUrl);
        setMenuOpen(false);
        showToast('Profile photo updated', 'success');
      } else {
        showToast(res.message || 'Upload failed', 'error');
      }
    } catch (err) {
      showToast(err?.message || 'Failed to upload photo', 'error');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true);
    try {
      const res = await authService.deleteProfilePhoto();
      if (res.success) {
        localStorage.removeItem('user_avatar');
        setAvatarUrl('');
        setMenuOpen(false);
        showToast('Profile photo removed', 'success');
      } else {
        showToast(res.message || 'Failed to remove photo', 'error');
      }
    } catch (err) {
      showToast(err?.message || 'Failed to remove photo', 'error');
    } finally {
      setAvatarLoading(false);
    }
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome{user?.name ? `, ${user.name}` : ''} 
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {schoolLevel === 'PRIMARY'
                ? 'Primary Section (P1-P6) - Attendance monitoring and reports'
                : schoolLevel === 'JHS'
                ? 'JHS Section (JHS 1-3) - Attendance monitoring and reports'
                : 'School-wide attendance monitoring and reports'}
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {user?.name ? user.name.slice(0, 1).toUpperCase() : 'H'}
                </div>
              )}
            </div>
            <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 disabled:opacity-60"
              disabled={avatarLoading}
            >
              {avatarLoading ? 'Updating...' : 'Edit photo'}
              <svg className={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl border border-gray-200 bg-white shadow-lg z-50 dark:border-gray-700 dark:bg-gray-800">
                <label className="block cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
                  {avatarUrl ? 'Change photo' : 'Add photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-60"
                  disabled={avatarLoading || !avatarUrl}
                >
                  Remove photo
                </button>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card variant="stats" className="p-6 border-l-4 border-l-blue-500 dark:border-l-blue-400">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">In your section</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card variant="stats" className="p-6 border-l-4 border-l-green-500 dark:border-l-green-400">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Attendance Rate</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.attendanceRate}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Overall average</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card variant="stats" className="p-6 border-l-4 border-l-purple-500 dark:border-l-purple-400">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Teachers Compliant</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.teachersCompliant}/10</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Marked today</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card variant="stats" className="p-6 border-l-4 border-l-orange-500 dark:border-l-orange-400">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Flagged Students</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.flaggedStudents}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Need attention</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link to={ROUTES.SCHOOL_REPORTS}>
            <Card variant="action" hover className="p-6 group cursor-pointer">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">School Reports</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">View comprehensive attendance reports</p>
                  <div className="mt-3 flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                    <span>View reports</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link to={ROUTES.TEACHER_COMPLIANCE}>
            <Card variant="action" hover className="p-6 group cursor-pointer">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Teacher Compliance</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monitor daily attendance marking compliance</p>
                  <div className="mt-3 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                    <span>Check compliance</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HeadteacherDashboard;
