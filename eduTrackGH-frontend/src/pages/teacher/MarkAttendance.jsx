/**
 * Mark Attendance Page – composes hook + MarkAttendanceStudentCard. Under 300 lines.
 */

import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import { useMarkAttendance } from '../../hooks/useMarkAttendance';
import MarkAttendanceStudentCard from '../../components/teacher/MarkAttendanceStudentCard';
import { messageService } from '../../services';
import { useToast } from '../../context';

const MarkAttendance = () => {
  const { showToast } = useToast();
  const {
    classrooms,
    selectedClass,
    setSelectedClass,
    selectedDate,
    setSelectedDate,
    isDateLocked,
    lockStatusLoading,
    students,
    initialLoading,
    classLoading,
    saving,
    error,
    currentIndex,
    entries,
    currentStatus,
    setCurrentStatus,
    currentPhotoUrl,
    setCurrentPhotoUrl,
    setCurrentVerificationType,
    currentManualReason,
    setCurrentManualReason,
    currentManualOther,
    setCurrentManualOther,
    videoRef,
    cameraActive,
    cameraError,
    capturing,
    uploading,
    startCamera,
    stopCamera,
    capturePhoto,
    setManualVerification,
    canCompleteCurrent,
    completeCurrent,
    allDone,
    handleSubmit,
    needsGeoFence,
    geoSubmitState,
    geoMessage,
    refreshGeoPreview,
    submitBlockedByGeo,
  } = useMarkAttendance();

  const [showUnlockForm, setShowUnlockForm] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState('');
  const [sendingUnlock, setSendingUnlock] = useState(false);

  const currentStudent = students[currentIndex];
  const stats = {
    present: entries.filter((e) => e.status === 'present').length,
    absent: entries.filter((e) => e.status === 'absent').length,
    late: entries.filter((e) => e.status === 'late').length,
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your classrooms...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mark Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Mark one student at a time. Present requires photo or manual reason.</p>
        </div>

        {error && (
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </Card>
        )}

        {classrooms.length > 0 && (
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Choose a class...</option>
                  {classrooms.map((cls) => (
                    <option key={cls._id} value={cls._id}>{cls.name} (Grade {cls.grade})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </Card>
        )}

        {classLoading && (
          <Card className="p-12">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
            </div>
          </Card>
        )}

        {lockStatusLoading && selectedClass && selectedDate && (
          <Card className="p-6">
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">Checking if date is available...</p>
          </Card>
        )}

        {!lockStatusLoading && isDateLocked && selectedClass && selectedDate && (
          <Card className="p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800">
            <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">Attendance locked</h3>
            <p className="text-amber-700 dark:text-amber-300 mb-4">
              Attendance for {selectedDate} has already been submitted and is locked. To make changes, contact your headteacher to request an unlock.
            </p>
            <button
              type="button"
              onClick={() => setShowUnlockForm((v) => !v)}
              className="text-sm text-blue-600 dark:text-blue-400 underline"
            >
              Need to correct or unlock this day? Notify headteacher
            </button>
            {showUnlockForm && (
              <div className="mt-4 space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message to headteacher
                </label>
                <textarea
                  rows={3}
                  value={unlockMessage}
                  onChange={(e) => setUnlockMessage(e.target.value)}
                  placeholder="Explain what needs to be corrected and why you need this date unlocked..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  disabled={sendingUnlock || !unlockMessage.trim() || !selectedClass}
                  onClick={async () => {
                    if (!selectedClass) return;
                    setSendingUnlock(true);
                    try {
                      await messageService.sendAttendanceUnlockRequest({
                            classroomId: selectedClass,
                            attendanceDate: selectedDate,
                            message: unlockMessage.trim(),
                          });
                          setUnlockMessage('');
                          setShowUnlockForm(false);
                          showToast('Unlock request sent to headteacher', 'success');
                        } catch (err) {
                          showToast(err?.response?.data?.message || 'Failed to send unlock request', 'error');
                        } finally {
                          setSendingUnlock(false);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {sendingUnlock ? 'Sending...' : 'Send unlock request'}
                </button>
              </div>
            )}
          </Card>
        )}

        {!lockStatusLoading && !isDateLocked && !classLoading && students.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Present</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.present}</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Absent</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Late</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.late}</p>
              </Card>
            </div>

            {!allDone && currentStudent && (
              <MarkAttendanceStudentCard
                currentStudent={currentStudent}
                currentIndex={currentIndex}
                studentsLength={students.length}
                currentStatus={currentStatus}
                setCurrentStatus={setCurrentStatus}
                currentPhotoUrl={currentPhotoUrl}
                setCurrentPhotoUrl={setCurrentPhotoUrl}
                setCurrentVerificationType={setCurrentVerificationType}
                currentManualReason={currentManualReason}
                setCurrentManualReason={setCurrentManualReason}
                currentManualOther={currentManualOther}
                setCurrentManualOther={setCurrentManualOther}
                videoRef={videoRef}
                cameraActive={cameraActive}
                cameraError={cameraError}
                capturing={capturing}
                uploading={uploading}
                startCamera={startCamera}
                stopCamera={stopCamera}
                capturePhoto={capturePhoto}
                setManualVerification={setManualVerification}
                canCompleteCurrent={canCompleteCurrent}
                completeCurrent={completeCurrent}
              />
            )}

            {allDone && (
              <Card className="p-6 space-y-4">
                <p className="text-green-600 dark:text-green-400 font-medium">All students marked.</p>
                {needsGeoFence && (
                  <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      geoSubmitState === 'ok'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-200'
                        : geoSubmitState === 'blocked'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                        : geoSubmitState === 'checking'
                        ? 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
                        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    <p className="font-medium">School location check</p>
                    <p className="mt-1 opacity-90">{geoMessage || 'Checking location…'}</p>
                    {geoSubmitState !== 'checking' && (
                      <button
                        type="button"
                        onClick={refreshGeoPreview}
                        className="mt-2 text-sm font-medium text-green-700 dark:text-green-400 underline"
                      >
                        Refresh location
                      </button>
                    )}
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={saving || submitBlockedByGeo}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Submit Attendance'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUnlockForm((v) => !v)}
                  className="text-sm text-blue-600 dark:text-blue-400 underline mt-2"
                >
                  Need to correct or unlock this day? Notify headteacher
                </button>
                {showUnlockForm && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Message to headteacher
                    </label>
                    <textarea
                      rows={3}
                      value={unlockMessage}
                      onChange={(e) => setUnlockMessage(e.target.value)}
                      placeholder="Explain what needs to be corrected and why you need this date unlocked..."
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      disabled={sendingUnlock || !unlockMessage.trim() || !selectedClass}
                      onClick={async () => {
                        if (!selectedClass) return;
                        setSendingUnlock(true);
                        try {
                          await messageService.sendAttendanceUnlockRequest({
                            classroomId: selectedClass,
                            attendanceDate: selectedDate,
                            message: unlockMessage.trim(),
                          });
                          setUnlockMessage('');
                          setShowUnlockForm(false);
                          showToast('Unlock request sent to headteacher', 'success');
                        } catch (err) {
                          showToast(err?.response?.data?.message || 'Failed to send unlock request', 'error');
                        } finally {
                          setSendingUnlock(false);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {sendingUnlock ? 'Sending...' : 'Send unlock request'}
                    </button>
                  </div>
                )}
              </Card>
            )}
          </>
        )}

        {!classLoading && selectedClass && students.length === 0 && (
          <Card className="p-12 text-center text-gray-500 dark:text-gray-400">No students found for this class.</Card>
        )}

        {!selectedClass && classrooms.length > 0 && !classLoading && (
          <Card className="p-12 text-center text-gray-500 dark:text-gray-400">Select your class to mark attendance.</Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MarkAttendance;
