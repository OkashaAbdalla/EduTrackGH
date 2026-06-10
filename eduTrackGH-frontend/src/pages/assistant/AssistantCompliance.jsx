/**
 * Teacher Compliance (Assistant Headteacher)
 */

import AssistantRouteGuard from '../../components/assistant/AssistantRouteGuard';
import TeacherCompliance from '../headteacher/TeacherCompliance';
import assistantHeadteacherService from '../../services/assistantHeadteacherService';
import { ROUTES } from '../../utils/constants';

const AssistantCompliance = () => (
  <AssistantRouteGuard>
    <TeacherCompliance
      apiService={assistantHeadteacherService}
      messageRoute={ROUTES.ASSISTANT_TEACHER_CHAT}
    />
  </AssistantRouteGuard>
);

export default AssistantCompliance;
