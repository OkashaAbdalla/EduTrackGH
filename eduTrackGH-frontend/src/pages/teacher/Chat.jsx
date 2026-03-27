/**
 * Teacher Chat – messages with headteacher
 */

import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import ChatConversation from '../../components/chat/ChatConversation';
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
          setSelected({ id: first.otherId?.toString?.() || first.otherId, name: first.otherName || 'Headteacher' });
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
              <div className="space-y-1">
                {conversations.map((c) => {
                  const id = c.otherId?.toString?.() || c.otherId;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelected({ id, name: c.otherName || 'Headteacher' })}
                      className={`w-full text-left px-3 py-2 rounded-lg ${
                        selected.id === id ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <p className="font-medium text-gray-900 dark:text-white truncate">{c.otherName || 'Headteacher'}</p>
                      <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
                    </button>
                  );
                })}
                {conversations.length === 0 && <p className="text-sm text-gray-500">No conversations yet</p>}
              </div>
            )}
          </Card>
          <div className="lg:col-span-2">
            {selected.id ? (
              <ChatConversation otherId={selected.id} otherName={selected.name} currentRole="teacher" onBack={() => setSelected({ id: null, name: '' })} />
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
