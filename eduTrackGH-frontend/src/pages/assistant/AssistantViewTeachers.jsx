/**
 * View Teachers (Assistant Headteacher) — same UI as headteacher, no create/delete
 */

import AssistantRouteGuard from '../../components/assistant/AssistantRouteGuard';
import ManageTeachers from '../headteacher/ManageTeachers';
import assistantHeadteacherService from '../../services/assistantHeadteacherService';

const AssistantViewTeachers = () => (
  <AssistantRouteGuard>
    <ManageTeachers apiService={assistantHeadteacherService} readOnly />
  </AssistantRouteGuard>
);

export default AssistantViewTeachers;
