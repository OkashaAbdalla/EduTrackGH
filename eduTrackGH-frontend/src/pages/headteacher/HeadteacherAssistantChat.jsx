/**
 * Headteacher chat with assistant headteacher
 */

import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import AssistantChatConversation from '../../components/assistant/AssistantChatConversation';
import { useDelegationStatus } from '../../hooks/useDelegationStatus';
import { useAuthContext } from '../../context';
import headteacherService from '../../services/headteacherService';

const HeadteacherAssistantChat = () => {
  const { user } = useAuthContext();
  const { status } = useDelegationStatus();
  const assistant = status?.assistant;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Assistant Headteacher</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Message {assistant?.fullName || 'your assistant'} and send delegation requests
          </p>
        </div>
        <Card className="p-4">
          <AssistantChatConversation
            otherName={assistant?.fullName || 'Assistant Headteacher'}
            otherAvatarUrl={assistant?.avatarUrl || ''}
            currentRole={user?.role}
            chatApi={headteacherService}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HeadteacherAssistantChat;
