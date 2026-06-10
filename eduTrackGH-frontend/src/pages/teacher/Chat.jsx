/**
 * Teacher Chat – messages with headteacher
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import ChatConversation from '../../components/chat/ChatConversation';
import ChatInboxLayout from '../../components/chat/ChatInboxLayout';
import chatService from '../../services/chatService';

const Chat = () => {
  const location = useLocation();
  const openUserId = location.state?.openUserId;
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState({ id: null, name: '', avatarUrl: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await chatService.getConversations();
        const list = res.conversations || [];
        setConversations(list);
        if (openUserId) {
          const conv = list.find((c) => (c.otherId?.toString?.() || c.otherId) === String(openUserId));
          if (conv) {
            setSelected({
              id: conv.otherId?.toString?.() || conv.otherId,
              name: conv.otherName || 'Headteacher',
              avatarUrl: conv.otherAvatarUrl || '',
            });
            return;
          }
          setSelected({ id: String(openUserId), name: 'Headteacher', avatarUrl: '' });
          return;
        }
        if (list.length > 0 && !selected.id) {
          const first = list[0];
          setSelected({
            id: first.otherId?.toString?.() || first.otherId,
            name: first.otherName || 'Headteacher',
            avatarUrl: first.otherAvatarUrl || '',
          });
        }
      } catch {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [openUserId]);

  return (
    <DashboardLayout>
      <ChatInboxLayout
        title="Messages"
        conversations={conversations}
        selected={selected}
        onSelect={setSelected}
        loading={loading}
        emptyListText="No conversations yet"
        emptySelectionText={
          conversations.length === 0
            ? 'No messages yet. Your headteacher can start a conversation.'
            : 'Select a conversation'
        }
      >
        <ChatConversation
          otherId={selected.id}
          otherName={selected.name}
          otherAvatarUrl={selected.avatarUrl}
          currentRole="teacher"
          onBack={() => setSelected({ id: null, name: '', avatarUrl: '' })}
        />
      </ChatInboxLayout>
    </DashboardLayout>
  );
};

export default Chat;
