/**
 * Teacher Chat – messages with headteacher
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import ChatConversation from '../../components/chat/ChatConversation';
import ChatListItem from '../../components/chat/ChatListItem';
import chatService from '../../services/chatService';

const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState({ id: null, name: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await chatService.getConversations();
        const list = res.conversations || [];
        setConversations(list);
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
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
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
                      name={c.otherName || 'Headteacher'}
                      avatarUrl={c.otherAvatarUrl}
                      lastMessage={c.lastMessage}
                      lastAt={c.lastAt}
                      active={selected.id === id}
                      onClick={() =>
                        setSelected({
                          id,
                          name: c.otherName || 'Headteacher',
                          avatarUrl: c.otherAvatarUrl || '',
                        })
                      }
                    />
                  );
                })}
                {conversations.length === 0 && <p className="text-sm text-gray-500">No conversations yet</p>}
              </div>
            )}
          </Card>
          <div className="lg:col-span-2">
            {selected.id ? (
              <ChatConversation
                otherId={selected.id}
                otherName={selected.name}
                otherAvatarUrl={selected.avatarUrl}
                currentRole="teacher"
                onBack={() => setSelected({ id: null, name: '', avatarUrl: '' })}
              />
            ) : (
              <Card className="p-8 text-center text-gray-500 dark:text-gray-400">
                {conversations.length === 0 ? 'No messages yet. Your headteacher can start a conversation.' : 'Select a conversation'}
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Chat;
