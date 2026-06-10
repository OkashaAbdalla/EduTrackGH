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

const STATUS_STYLES = {
  present: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  absent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  late: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

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
    submitBlockedByGeo,
    correctionMode,
    studentSearch,
    setStudentSearch,
    filteredStudents,
    selectedStudentId,
    setSelectedStudentId,
    selectedStudent,
    pendingCorrections,
    completeCorrection,
    readyToSubmit,
    getEffectiveStatus,
    stats,
  } = useMarkAttendance();

  const [showUnlockForm, setShowUnlockForm] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState('');
  const [sendingUnlock, setSendingUnlock] = useState(false);

  const currentStudent = correctionMode ? selectedStudent : students[currentIndex];

  const renderSubmitSection = () => (
    <Card className="p-6 space-y-4">
      <p className="text-green-600 dark:text-green-400 font-medium">
        {correctionMode
          ? `${pendingCorrections.length} student${pendingCorrections.length === 1 ? '' : 's'} ready to save. Unchanged students will not be affected.`
          : 'All students marked.'}
      </p>
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
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={saving || submitBlockedByGeo}
        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50"
      >
        {saving ? 'Saving...' : correctionMode ? 'Save corrections' : 'Submit Attendance'}
      </button>
    </Card>
  );

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
      <div className="page-stack max-w-3xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Mark Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {correctionMode
              ? 'Correction mode — search and update individual students without redoing the whole class.'
              : 'Mark one student at a time.'}
          </p>
        </div>

        {error && (
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </Card>
        )}

        {classrooms.length > 0 && (
          <Card className="p-6">
            <div className="card-grid-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="ui-select w-full"
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
                  className="ui-select w-full"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message to headteacher</label>
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
            {correctionMode && (
              <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700">
                <p className="font-semibold text-blue-900 dark:text-blue-100">Correction mode</p>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Attendance was already submitted for this date. Use the search box below to find a student,
                  update their status, then click <strong>Save corrections</strong>. Students you do not change
                  stay as they are and their parents will not be notified again.
                </p>
              </Card>
            )}

            <div className="stats-grid-3">
              <Card className="stat-tile">
                <p className="stat-tile-label">Present</p>
                <p className="stat-tile-value text-green-600 dark:text-green-400">{stats.present}</p>
              </Card>
              <Card className="stat-tile">
                <p className="stat-tile-label">Absent</p>
                <p className="stat-tile-value text-red-600 dark:text-red-400">{stats.absent}</p>
              </Card>
              <Card className="stat-tile">
                <p className="stat-tile-label">Late</p>
                <p className="stat-tile-value text-orange-600 dark:text-orange-400">{stats.late}</p>
              </Card>
            </div>

            {correctionMode && (
              <Card className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search student
                  </label>
                  <input
                    type="search"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Type a name or student ID..."
                    className="ui-select w-full"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto divide-y dark:divide-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  {filteredStudents.map((student) => {
                    const status = getEffectiveStatus(student._id);
                    const isPending = pendingCorrections.some((e) => e.studentId === student._id);
                    const isSelected = selectedStudentId === student._id;
                    return (
                      <button
                        key={student._id}
                        type="button"
                        onClick={() => setSelectedStudentId(student._id)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition ${
                          isSelected ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <span className="font-medium text-gray-900 dark:text-white">{student.fullName}</span>
                        <span className="flex items-center gap-2 shrink-0">
                          {isPending && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">Pending save</span>
                          )}
                          {status ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[status] || ''}`}>
                              {status}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">Not marked</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No students match your search.</p>
                  )}
                </div>
              </Card>
            )}

            {!correctionMode && !allDone && currentStudent && (
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

            {correctionMode && selectedStudent && (
              <MarkAttendanceStudentCard
                currentStudent={selectedStudent}
                currentIndex={0}
                studentsLength={1}
                headerNote={`Updating: ${selectedStudent.fullName}`}
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
                completeCurrent={completeCorrection}
              />
            )}

            {!correctionMode && allDone && renderSubmitSection()}
            {correctionMode && readyToSubmit && renderSubmitSection()}
          </>
        )}

        {!classLoading && selectedClass && students.length === 0 && (
          <Card className="ui-empty">
            <p className="ui-empty-title">No students found</p>
            <p className="ui-empty-text">No students are enrolled in this class yet.</p>
          </Card>
        )}

        {!selectedClass && classrooms.length > 0 && !classLoading && (
          <Card className="ui-empty">
            <p className="ui-empty-title">Select a class</p>
            <p className="ui-empty-text">Choose your class above to start marking attendance.</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MarkAttendance;
