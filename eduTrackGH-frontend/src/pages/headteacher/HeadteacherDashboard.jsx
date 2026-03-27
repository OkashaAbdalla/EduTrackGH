/**
 * Headteacher Dashboard
 * Purpose: School-wide overview for headteachers
 */

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import HeadteacherStatsCards from '../../components/headteacher/HeadteacherStatsCards';
import HeadteacherQuickActions from '../../components/headteacher/HeadteacherQuickActions';
import { useAuthContext, useToast, useSocket } from '../../context';
import authService from '../../services/authService';
import { messageService, headteacherService } from '../../services';
import { compressImageFile } from '../../utils/helpers';

const HeadteacherDashboard = () => {
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const { socket } = useSocket();
  const schoolLevel = user?.schoolLevel; // PRIMARY or JHS
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceRate: 0,
    teachersCompliant: 0,
    flaggedStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [unlockRequests, setUnlockRequests] = useState([]);
  const [unlockingId, setUnlockingId] = useState(null);

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

  const fetchUnlockRequests = useCallback(async () => {
    try {
      const res = await messageService.getAttendanceUnlockRequests();
      if (res.success) {
        setUnlockRequests(res.messages || []);
      }
    } catch (err) {
      console.error('Failed to load unlock requests', err);
    }
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await authService.getMe();
        if (res.success && res.user) {
          if (res.user.schoolName) setSchoolName(res.user.schoolName);
          if (res.user.avatarUrl) setAvatarUrl(res.user.avatarUrl);
        }
      } catch {
        // Silent fail
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    fetchUnlockRequests();
  }, [fetchUnlockRequests]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchUnlockRequests();
    socket.on('unlock_request', handler);
    return () => socket.off('unlock_request', handler);
  }, [socket, fetchUnlockRequests]);

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
            {schoolName && (
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">
                {schoolName}
              </p>
            )}
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

        <HeadteacherStatsCards stats={stats} />

        {/* Attendance unlock requests from teachers */}
        {unlockRequests.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Attendance unlock requests
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Teachers have requested unlocks for the following dates. Review and unlock attendance if appropriate.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Date</th>
                    <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Class</th>
                    <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Teacher</th>
                    <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Reason</th>
                    <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {unlockRequests.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 px-3 text-gray-900 dark:text-white">
                        {r.attendanceDate}
                      </td>
                      <td className="py-2 px-3 text-gray-900 dark:text-white">
                        {r.classroom || '—'}
                      </td>
                      <td className="py-2 px-3 text-gray-900 dark:text-white">
                        {r.teacher}
                      </td>
                      <td className="py-2 px-3 text-gray-700 dark:text-gray-300 max-w-xs">
                        {r.message}
                      </td>
                      <td className="py-2 px-3">
                        <button
                          type="button"
                          disabled={unlockingId === r.id}
                          onClick={async () => {
                            setUnlockingId(r.id);
                            try {
                              const res = await headteacherService.unlockAttendance(
                                r.classroomId,
                                r.attendanceDate
                              );
                              if (res.success) {
                                setUnlockRequests((prev) =>
                                  prev.filter((m) => m.id !== r.id)
                                );
                                showToast('Attendance unlocked for this date.', 'success');
                              } else {
                                showToast(res.message || 'Failed to unlock attendance', 'error');
                              }
                            } catch (err) {
                              console.error('Failed to unlock attendance', err);
                              showToast('Failed to unlock attendance', 'error');
                            } finally {
                              setUnlockingId(null);
                            }
                          }}
                          className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium disabled:opacity-50"
                        >
                          {unlockingId === r.id ? 'Unlocking...' : 'Unlock'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <HeadteacherQuickActions />
      </div>
    </DashboardLayout>
  );
};

export default HeadteacherDashboard;
