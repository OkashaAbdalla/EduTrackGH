/**
 * Assistant Headteacher Dashboard — standby or active acting mode
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card, Loader, ProfilePhotoEditor } from '../../components/common';
import HeadteacherStatsCards from '../../components/headteacher/HeadteacherStatsCards';
import { useDelegationStatus } from '../../hooks/useDelegationStatus';
import { useToast, useConfirm, useSocket, useAuthContext } from '../../context';
import authService from '../../services/authService';
import assistantHeadteacherService from '../../services/assistantHeadteacherService';
import { ROUTES } from '../../utils/constants';
import { compressImageFile, withAvatarCacheBust } from '../../utils/helpers';

const AssistantDashboard = () => {
  const { user, updateUser } = useAuthContext();
  const { isActing, pendingDelegation, activeDelegation, refresh } = useDelegationStatus();
  const { showToast } = useToast();
  const { requestConfirmation } = useConfirm();
  const { socket } = useSocket();
  const [stats, setStats] = useState({ totalStudents: 0, attendanceRate: 0, teachersCompliant: 0, flaggedStudents: 0 });
  const [loading, setLoading] = useState(false);
  const [unlockRequests, setUnlockRequests] = useState([]);
  const [unlockingId, setUnlockingId] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    setAvatarUrl(user?.avatarUrl || '');
  }, [user?.avatarUrl]);

  const fetchStats = useCallback(async () => {
    if (!isActing) return;
    try {
      setLoading(true);
      const res = await assistantHeadteacherService.getDashboardStats();
      if (res?.success && res?.stats) {
        setStats({
          totalStudents: res.stats.totalStudents || 0,
          attendanceRate: res.stats.attendanceRate || 0,
          teachersCompliant: res.stats.teachersCompliant || 0,
          flaggedStudents: res.stats.flaggedStudents || 0,
        });
      }
    } catch {
      showToast('Failed to load dashboard stats', 'error');
    } finally {
      setLoading(false);
    }
  }, [isActing, showToast]);

  const fetchUnlockRequests = useCallback(async () => {
    if (!isActing) return;
    try {
      const res = await assistantHeadteacherService.getUnlockRequests();
      if (res.success) setUnlockRequests(res.messages || []);
    } catch {
      /* ignore */
    }
  }, [isActing]);

  useEffect(() => {
    fetchStats();
    fetchUnlockRequests();
  }, [fetchStats, fetchUnlockRequests]);

  useEffect(() => {
    if (!socket || !isActing) return;
    const handler = () => {
      fetchStats();
      fetchUnlockRequests();
    };
    socket.on('unlock_request', handler);
    socket.on('compliance_updated', handler);
    return () => socket.off('unlock_request', handler);
  }, [socket, isActing, fetchStats, fetchUnlockRequests]);

  const handleActivate = async () => {
    const ok = await requestConfirmation({
      title: 'Activate Assistant Duties',
      message: 'Start acting as Assistant Headteacher with permitted school duties?',
      confirmText: 'Activate',
      cancelText: 'Cancel',
    });
    if (!ok) return;
    try {
      const res = await assistantHeadteacherService.activateDelegation();
      if (res.success) {
        showToast('You are now acting as Assistant Headteacher', 'success');
        refresh();
      } else {
        showToast(res.message || 'Activation failed', 'error');
      }
    } catch {
      showToast('Failed to activate delegation', 'error');
    }
  };

  const handleEnd = async () => {
    const ok = await requestConfirmation({
      title: 'End Acting Duties',
      message: 'Stop acting as Assistant Headteacher?',
      confirmText: 'End',
      cancelText: 'Cancel',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const res = await assistantHeadteacherService.endDelegation();
      if (res.success) {
        showToast('Acting duties ended', 'success');
        refresh();
      }
    } catch {
      showToast('Failed to end delegation', 'error');
    }
  };

  const handleUnlock = async (req) => {
    setUnlockingId(req.id);
    try {
      const res = await assistantHeadteacherService.unlockAttendance(req.classroomId, req.attendanceDate);
      if (res.success) {
        showToast('Attendance unlocked', 'success');
        fetchUnlockRequests();
      } else {
        showToast(res.message || 'Unlock failed', 'error');
      }
    } catch {
      showToast('Failed to unlock attendance', 'error');
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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assistant Headteacher</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isActing ? 'You are currently acting on behalf of your headteacher' : 'Standby — waiting for delegation'}
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

        {!isActing && (
          <Card className="p-6 border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/10">
            <h2 className="font-semibold text-amber-900 dark:text-amber-100">Not active yet</h2>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
              You can only perform headteacher duties after your headteacher sends a delegation request and you activate it.
            </p>
            {pendingDelegation ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Pending request:</strong> {pendingDelegation.note || 'Your headteacher needs you to cover.'}
                </p>
                <button
                  type="button"
                  onClick={handleActivate}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
                >
                  Activate Assistant Duties
                </button>
                <p className="text-xs text-gray-500">
                  Or open{' '}
                  <Link to={ROUTES.ASSISTANT_CHAT} className="text-green-600 hover:underline">
                    Headteacher Messages
                  </Link>{' '}
                  and activate from the chat notice.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                Check{' '}
                <Link to={ROUTES.ASSISTANT_CHAT} className="text-green-600 hover:underline">
                  Headteacher Messages
                </Link>{' '}
                for updates from your headteacher.
              </p>
            )}
          </Card>
        )}

        {isActing && (
          <>
            <Card className="p-4 flex flex-wrap items-center justify-between gap-3 border border-green-200 dark:border-green-800">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Acting mode active</p>
                {activeDelegation?.note && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activeDelegation.note}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleEnd}
                className="px-3 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white"
              >
                End Acting Duties
              </button>
            </Card>

            {loading ? (
              <Loader />
            ) : (
              <HeadteacherStatsCards stats={stats} schoolLevel={undefined} />
            )}

            {unlockRequests.length > 0 && (
              <Card className="p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Urgent unlock requests</h2>
                <div className="space-y-3">
                  {unlockRequests.map((req) => (
                    <div key={req.id} className="flex flex-wrap items-start justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{req.teacher}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{req.classroom} · {req.attendanceDate}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{req.message}</p>
                      </div>
                      <button
                        type="button"
                        disabled={unlockingId === req.id}
                        onClick={() => handleUnlock(req)}
                        className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50"
                      >
                        {unlockingId === req.id ? 'Unlocking…' : 'Unlock'}
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AssistantDashboard;
