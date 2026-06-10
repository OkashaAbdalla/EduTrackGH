/**
 * Assistant <-> Headteacher chat
 */

import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import AssistantChatConversation from '../../components/assistant/AssistantChatConversation';
import { useDelegationStatus } from '../../hooks/useDelegationStatus';
import { useAuthContext, useToast } from '../../context';
import assistantHeadteacherService from '../../services/assistantHeadteacherService';

const AssistantChat = () => {
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const { status, pendingDelegation, refresh } = useDelegationStatus();
  const headteacher = status?.headteacher;

  const handleActivate = async () => {
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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Headteacher Messages</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Coordinate with {headteacher?.fullName || 'your headteacher'} and accept delegation requests
          </p>
        </div>
        <Card className="p-4">
          <AssistantChatConversation
            otherName={headteacher?.fullName || 'Headteacher'}
            otherAvatarUrl={headteacher?.avatarUrl || ''}
            currentRole={user?.role}
            chatApi={assistantHeadteacherService}
            onDelegationActivate={handleActivate}
            pendingDelegationId={pendingDelegation?.id}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AssistantChat;
