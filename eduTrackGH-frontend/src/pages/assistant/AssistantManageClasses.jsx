/**
 * Manage Classes (Assistant Headteacher) — same UI as headteacher
 */

import AssistantRouteGuard from '../../components/assistant/AssistantRouteGuard';
import ManageClasses from '../headteacher/ManageClasses';
import assistantHeadteacherService from '../../services/assistantHeadteacherService';

const AssistantManageClasses = () => (
  <AssistantRouteGuard>
    <ManageClasses apiService={assistantHeadteacherService} />
  </AssistantRouteGuard>
);

export default AssistantManageClasses;
