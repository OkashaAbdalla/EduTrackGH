/**
 * Assistant Headteacher — messages with teachers (same UI as headteacher chat)
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import AssistantRouteGuard from '../../components/assistant/AssistantRouteGuard';
import { Card } from '../../components/common';
import ChatConversation from '../../components/chat/ChatConversation';
import ChatListItem from '../../components/chat/ChatListItem';
import chatService from '../../services/chatService';

const AssistantTeacherChatContent = () => {
  const [searchParams] = useSearchParams();
  const teacherIdFromUrl = searchParams.get('teacher');
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState({ id: null, name: '', avatarUrl: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await chatService.getConversations();
        const list = res.conversations || [];
        setConversations(list);
        if (teacherIdFromUrl) {
          const conv = list.find((c) => (c.otherId?.toString?.() || c.otherId) === teacherIdFromUrl);
          const nameFromUrl = searchParams.get('name') || '';
          if (conv) {
            setSelected({
              id: conv.otherId?.toString?.() || conv.otherId,
              name: conv.otherName || 'Teacher',
              avatarUrl: conv.otherAvatarUrl || '',
            });
          } else {
            setSelected({ id: teacherIdFromUrl, name: nameFromUrl || 'Teacher', avatarUrl: '' });
          }
        }
      } catch {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teacherIdFromUrl, searchParams]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Notify teachers to mark attendance or follow up on compliance</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 lg:col-span-1">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Conversations</h2>
          {loading ? (
            <div className="animate-pulse h-24 bg-gray-200 dark:bg-gray-700 rounded" />
          ) : (
            <div className="space-y-0.5">
              {conversations.map((c) => {
                const id = c.otherId?.toString?.() || c.otherId;
                return (
                  <ChatListItem
                    key={id}
                    name={c.otherName || 'Teacher'}
                    avatarUrl={c.otherAvatarUrl}
                    lastMessage={c.lastMessage}
                    lastAt={c.lastAt}
                    active={selected.id === id}
                    onClick={() =>
                      setSelected({
                        id,
                        name: c.otherName || 'Teacher',
                        avatarUrl: c.otherAvatarUrl || '',
                      })
                    }
                  />
                );
              })}
              {conversations.length === 0 && (
                <p className="text-sm text-gray-500">No conversations yet. Message a teacher from Teacher Compliance.</p>
              )}
            </div>
          )}
        </Card>
        <div className="lg:col-span-2">
          {selected.id ? (
            <ChatConversation
              otherId={selected.id}
              otherName={selected.name}
              otherAvatarUrl={selected.avatarUrl}
              currentRole="assistant_headteacher"
              onBack={() => setSelected({ id: null, name: '', avatarUrl: '' })}
            />
          ) : (
            <Card className="p-8 text-center text-gray-500 dark:text-gray-400">
              Select a teacher to start a conversation
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const AssistantTeacherChat = () => (
  <DashboardLayout>
    <AssistantRouteGuard>
      <AssistantTeacherChatContent />
    </AssistantRouteGuard>
  </DashboardLayout>
);

export default AssistantTeacherChat;
