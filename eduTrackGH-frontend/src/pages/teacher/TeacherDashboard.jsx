/**
 * Teacher Dashboard
 * Purpose: Main dashboard for teachers to view overview and quick actions
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { ROUTES } from '../../utils/constants';
import { Card, Loader, ProfilePhotoEditor } from '../../components/common';
import { useAuthContext, useToast } from '../../context';
import authService from '../../services/authService';
import { compressImageFile, withAvatarCacheBust } from '../../utils/helpers';
import classroomService from '../../services/classroomService';

const TeacherDashboard = () => {
  const { user, updateUser } = useAuthContext();
  const { showToast } = useToast();
  const [profile, setProfile] = useState({ fullName: '', schoolName: '', classrooms: [] });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [stats, setStats] = useState({
    classesToday: 0,
    unmarkedClasses: 0,
    flaggedStudents: 0,
    totalStudents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, classRes] = await Promise.all([
          authService.getMe(),
          classroomService.getTeacherClassrooms(),
        ]);
        if (meRes.success && meRes.user) {
          if (meRes.user.avatarUrl) setAvatarUrl(withAvatarCacheBust(meRes.user.avatarUrl));
          setProfile((p) => ({
            ...p,
            fullName: meRes.user.fullName || user?.name || '',
            schoolName: meRes.user.schoolName || '',
          }));
        }
        if (classRes.success && classRes.classrooms?.length) {
          setProfile((p) => ({ ...p, classrooms: classRes.classrooms }));
          const total = classRes.classrooms.reduce((s, c) => s + (c.studentCount || 0), 0);
          setStats((prev) => ({ ...prev, classesToday: classRes.classrooms.length, totalStudents: total }));
        }
      } catch {
        setProfile((p) => ({ ...p, fullName: user?.name || '' }));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.name]);

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

    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);
    setAvatarLoading(true);

    try {
      const base64 = await compressImageFile(file, {
        maxDimension: 384,
        maxSizeBytes: 480 * 1024,
        startQuality: 0.92,
      });
      const res = await authService.uploadProfilePhoto(base64);
      if (res.success && res.avatarUrl) {
        const freshUrl = withAvatarCacheBust(res.avatarUrl);
        setAvatarUrl(freshUrl);
        updateUser({ avatarUrl: freshUrl });
        showToast('Profile photo updated', 'success');
      } else {
        setAvatarUrl(user?.avatarUrl || '');
        showToast(res.message || 'Upload failed', 'error');
      }
    } catch (err) {
      setAvatarUrl(user?.avatarUrl || '');
      showToast(err?.message || 'Failed to upload photo', 'error');
    } finally {
      URL.revokeObjectURL(previewUrl);
      setAvatarLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl('');
    setAvatarLoading(true);
    try {
      const res = await authService.deleteProfilePhoto();
      if (res.success) {
        updateUser({ avatarUrl: '' });
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
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header – teacher name, school, assigned class */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Welcome{profile.fullName ? `, ${profile.fullName}` : ''}
          </h1>
          {profile.schoolName && (
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">{profile.schoolName}</p>
          )}
          {profile.classrooms?.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Assigned class{profile.classrooms.length > 1 ? 'es' : ''}: {profile.classrooms.map((c) => c.name).join(', ')}
            </p>
          )}
          <p className="text-gray-600 dark:text-dashboard-muted mt-1">Monitor attendance and track student progress</p>
          </div>
          <ProfilePhotoEditor
            avatarUrl={avatarUrl}
            userName={profile.fullName || user?.name}
            loading={avatarLoading}
            onFileSelect={handleAvatarChange}
            onRemove={handleRemoveAvatar}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card variant="stats" className="p-6 border-l-4 border-l-blue-500 dark:border-l-blue-400">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Classes Today</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.classesToday}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Active classes</p>
              </div>
              <div className="w-14 h-14 bg-blue-600 dark:bg-dashboard-accent rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card variant="stats" className="p-6 border-l-4 border-l-red-500 dark:border-l-red-400">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Unmarked Classes</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.unmarkedClasses}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Requires attention</p>
              </div>
              <div className="w-14 h-14 bg-red-600 dark:bg-red-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card variant="stats" className="p-6 border-l-4 border-l-orange-500 dark:border-l-orange-400">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Flagged Students</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.flaggedStudents}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Chronic absenteeism</p>
              </div>
              <div className="w-14 h-14 bg-orange-600 dark:bg-orange-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card variant="stats" className="p-6 border-l-4 border-l-green-500 dark:border-l-green-400">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">In your classes</p>
              </div>
              <div className="w-14 h-14 bg-uds-green dark:bg-green-700 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Link to={ROUTES.MARK_ATTENDANCE}>
            <Card variant="action" hover className="p-6 group cursor-pointer">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 bg-uds-green dark:bg-green-700 rounded-xl flex items-center justify-center group-hover:opacity-95 transition-opacity duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Mark Attendance</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Record daily attendance for your classes</p>
                  <div className="mt-3 flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                    <span>Get started</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link to={ROUTES.TEACHER_MANAGE_STUDENTS}>
            <Card variant="action" hover className="p-6 group cursor-pointer">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 bg-blue-600 dark:bg-dashboard-accent rounded-xl flex items-center justify-center group-hover:opacity-95 transition-opacity duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Propose Students</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Propose new students for approval</p>
                  <div className="mt-3 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                    <span>Add students</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link to={ROUTES.ATTENDANCE_HISTORY}>
            <Card variant="action" hover className="p-6 group cursor-pointer">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 bg-slate-600 dark:bg-slate-500 rounded-xl flex items-center justify-center group-hover:opacity-95 transition-opacity duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Attendance History</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Browse past attendance records</p>
                  <div className="mt-3 flex items-center text-slate-600 dark:text-slate-400 text-sm font-medium">
                    <span>View history</span>
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

export default TeacherDashboard;
