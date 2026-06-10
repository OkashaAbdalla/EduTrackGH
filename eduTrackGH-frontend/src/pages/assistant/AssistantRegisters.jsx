/**
 * Class registers (Assistant Headteacher — active delegation)
 */

import { useCallback } from 'react';
import AssistantRouteGuard from '../../components/assistant/AssistantRouteGuard';
import AttendanceRegisterView from '../../components/attendance/AttendanceRegisterView';
import assistantHeadteacherService from '../../services/assistantHeadteacherService';

const AssistantRegistersContent = () => {
  const loadClassrooms = useCallback(async () => {
    const res = await assistantHeadteacherService.getClassrooms();
    if (!res.success) {
      return { classrooms: [], error: res.message || 'No classrooms found.' };
    }
    return { classrooms: res.classrooms || [] };
  }, []);

  const loadHistory = useCallback(async (classroomId, params) => {
    return assistantHeadteacherService.getClassroomRegisterHistory(classroomId, params);
  }, []);

  return (
    <AttendanceRegisterView
      pageTitle="Class"
      pageTitleAccent="Registers"
      classSelectorVariant="buttons"
      loadClassrooms={loadClassrooms}
      loadHistory={loadHistory}
      exportFilePrefix="assistant-class-register"
      loadingMessage="Loading school classes..."
      emptyClassroomsMessage="No classes found. Add classes from Manage Classes first."
    />
  );
};

const AssistantRegisters = () => (
  <AssistantRouteGuard>
    <AssistantRegistersContent />
  </AssistantRouteGuard>
);

export default AssistantRegisters;
