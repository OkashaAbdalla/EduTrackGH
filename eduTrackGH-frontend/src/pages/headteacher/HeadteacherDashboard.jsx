/**
 * Headteacher Dashboard
 * Purpose: School-wide overview for headteachers
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Loader, ProfilePhotoEditor } from '../../components/common';
import HeadteacherStatsCards from '../../components/headteacher/HeadteacherStatsCards';
import HeadteacherQuickActions from '../../components/headteacher/HeadteacherQuickActions';
import SchoolLocationSettings from '../../components/headteacher/SchoolLocationSettings';
import { useAuthContext, useToast, useSocket, useConfirm } from '../../context';
import authService from '../../services/authService';
import { messageService, headteacherService } from '../../services';
import { compressImageFile, withAvatarCacheBust } from '../../utils/helpers';

const HeadteacherDashboard = () => {
  const { user, updateUser } = useAuthContext();
  const { showToast } = useToast();
  const { socket } = useSocket();
  const { requestConfirmation } = useConfirm();
  const schoolLevel = user?.schoolLevel; // PRIMARY or JHS
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceRate: 0,
    teachersCompliant: 0,
    flaggedStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [unlockRequests, setUnlockRequests] = useState([]);
  const [unlockingId, setUnlockingId] = useState(null);
  const statsInitialLoadRef = useRef(true);

  useEffect(() => {
    const fetchStats = async () => {
      const isInitial = statsInitialLoadRef.current;
      try {
        if (isInitial) setLoading(true);
        const res = await headteacherService.getDashboardStats();
        if (res?.success && res?.stats) {
          setStats({
            totalStudents: res.stats.totalStudents || 0,
            attendanceRate: res.stats.attendanceRate || 0,
            teachersCompliant: res.stats.teachersCompliant || 0,
            flaggedStudents: res.stats.flaggedStudents || 0,
          });
        } else if (isInitial) {
          showToast(res?.message || 'Failed to load dashboard stats', 'error');
        }
      } catch (err) {
        if (isInitial) showToast(err?.message || 'Failed to load dashboard stats', 'error');
      } finally {
        if (isInitial) {
          setLoading(false);
          statsInitialLoadRef.current = false;
        }
      }
    };
    fetchStats();
    const pollId = setInterval(fetchStats, 30000);
    return () => clearInterval(pollId);
  }, [showToast]);


  const fetchUnlockRequests = useCallback(async () => {
    try {
      const res = await messageService.getAttendanceUnlockRequests();
      if (res.success) {
        setUnlockRequests(res.messages || []);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to load unlock requests', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await authService.getMe();
        if (res.success && res.user) {
          if (res.user.schoolName) setSchoolName(res.user.schoolName);
          if (res.user.avatarUrl) setAvatarUrl(withAvatarCacheBust(res.user.avatarUrl));
        }
      } catch {
        // Silent fail
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    fetchUnlockRequests();
    const pollId = setInterval(fetchUnlockRequests, 30000);
    return () => clearInterval(pollId);
  }, [fetchUnlockRequests]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchUnlockRequests();
    socket.on('unlock_request', handler);
    socket.on('compliance_updated', handler);
    return () => {
      socket.off('unlock_request', handler);
      socket.off('compliance_updated', handler);
    };
  }, [socket, fetchUnlockRequests]);

  const handleUnlockRequest = async (request) => {
    const confirmed = await requestConfirmation({
      title: 'Unlock Attendance',
      message: 'Are you sure to unlock attendance?',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      tone: 'danger',
    });
    if (!confirmed) return;

    setUnlockingId(request.id);
    try {
      const res = await headteacherService.unlockAttendance(request.classroomId, request.attendanceDate);
      if (res.success) {
        setUnlockRequests((prev) => prev.filter((m) => m.id !== request.id));
        showToast('Attendance unlocked for this date.', 'success');
      } else {
        showToast(res.message || 'Failed to unlock attendance', 'error');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to unlock attendance', 'error');
    } finally {
      setUnlockingId(null);
    }
  };

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

  const sectionSubtitle =
    schoolLevel === 'PRIMARY'
      ? 'Primary Section (P1–P6)'
      : schoolLevel === 'JHS'
        ? 'JHS Section (JHS 1–3)'
        : 'School section';

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Welcome{user?.name ? `, ${user.name}` : ''}
            </h1>
            {schoolName && (
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{schoolName}</p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{sectionSubtitle}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Monitor attendance, classes, and staff from one place.
            </p>
          </div>
          <ProfilePhotoEditor
            avatarUrl={avatarUrl}
            userName={user?.name}
            loading={avatarLoading}
            onFileSelect={handleAvatarChange}
            onRemove={handleRemoveAvatar}
          />
        </div>

        <HeadteacherStatsCards stats={stats} />

        {/* Attendance unlock requests from teachers */}
        {unlockRequests.length > 0 && (
          <Card className="p-5 border-l-4 border-l-amber-500 dark:border-l-amber-400">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Attendance unlock requests
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
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
                          onClick={() => handleUnlockRequest(r)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 shadow-sm"
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

        <SchoolLocationSettings />

        <HeadteacherQuickActions />
      </div>
    </DashboardLayout>
  );
};

export default HeadteacherDashboard;
