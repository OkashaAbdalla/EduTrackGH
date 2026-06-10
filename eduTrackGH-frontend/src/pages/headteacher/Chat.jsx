/**
 * Headteacher Chat – list conversations, chat with teachers
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import ChatConversation from '../../components/chat/ChatConversation';
import ChatInboxLayout from '../../components/chat/ChatInboxLayout';
import chatService from '../../services/chatService';

const Chat = () => {
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
    <DashboardLayout>
      <ChatInboxLayout
        title="Messages"
        conversations={conversations}
        selected={selected}
        onSelect={setSelected}
        loading={loading}
        emptyListText="No conversations yet"
        emptySelectionText="Select a teacher to start a conversation"
      >
        <ChatConversation
          otherId={selected.id}
          otherName={selected.name}
          otherAvatarUrl={selected.avatarUrl}
          currentRole="headteacher"
          onBack={() => setSelected({ id: null, name: '', avatarUrl: '' })}
        />
      </ChatInboxLayout>
    </DashboardLayout>
  );
};

export default Chat;
