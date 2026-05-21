/**
 * Teacher Attendance History
 */

import { useCallback } from 'react';
import AttendanceRegisterView from '../../components/attendance/AttendanceRegisterView';
import classroomService from '../../services/classroomService';
import attendanceService from '../../services/attendanceService';

const AttendanceHistory = () => {
  const loadClassrooms = useCallback(async () => {
    const res = await classroomService.getTeacherClassrooms();
    if (!res.success || !res.classrooms?.length) {
      return {
        classrooms: [],
        error: res.message || 'No classrooms assigned. Contact your headteacher.',
      };
    }
    return { classrooms: res.classrooms };
  }, []);

  const loadHistory = useCallback(async (classroomId, params) => {
    return attendanceService.getClassroomAttendanceHistory(classroomId, params);
  }, []);

  return (
    <AttendanceRegisterView
      pageTitle="Attendance"
      pageTitleAccent="History"
      classSelectorVariant="select"
      loadClassrooms={loadClassrooms}
      loadHistory={loadHistory}
      exportFilePrefix="attendance-history-register"
      loadingMessage="Loading your classrooms..."
      emptyClassroomsMessage="No classrooms assigned. Contact your headteacher."
    />
  );
};

export default AttendanceHistory;
