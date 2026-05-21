/**
 * Headteacher Registers — class attendance register history (all school classes)
 */

import { useCallback } from 'react';
import AttendanceRegisterView from '../../components/attendance/AttendanceRegisterView';
import headteacherService from '../../services/headteacherService';

const Registers = () => {
  const loadClassrooms = useCallback(async () => {
    const res = await headteacherService.getClassrooms();
    if (!res.success) {
      return {
        classrooms: [],
        error: res.message || 'No classrooms found. Create classes under Manage Classes.',
      };
    }
    return { classrooms: res.classrooms || [] };
  }, []);

  const loadHistory = useCallback(async (classroomId, params) => {
    return headteacherService.getClassroomRegisterHistory(classroomId, params);
  }, []);

  return (
    <AttendanceRegisterView
      pageTitle="Class"
      pageTitleAccent="Registers"
      classSelectorVariant="buttons"
      loadClassrooms={loadClassrooms}
      loadHistory={loadHistory}
      exportFilePrefix="headteacher-class-register"
      loadingMessage="Loading school classes..."
      emptyClassroomsMessage="No classes found. Add classes from Manage Classes first."
    />
  );
};

export default Registers;
