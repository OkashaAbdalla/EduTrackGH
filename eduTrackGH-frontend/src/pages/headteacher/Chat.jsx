/**
 * Headteacher Chat – list conversations, chat with teachers
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from '../../components/common';
import ChatConversation from '../../components/chat/ChatConversation';
import chatService from '../../services/chatService';

const Chat = () => {
  const [searchParams] = useSearchParams();
  const teacherIdFromUrl = searchParams.get('teacher');
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState({ id: null, name: '' });
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
            setSelected({ id: conv.otherId?.toString?.() || conv.otherId, name: conv.otherName || 'Teacher' });
          } else {
            setSelected({ id: teacherIdFromUrl, name: nameFromUrl || 'Teacher' });
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
                      onClick={() => setSelected({ id, name: c.otherName || 'Teacher' })}
                      className={`w-full text-left px-3 py-2 rounded-lg ${
                        selected.id === id ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <p className="font-medium text-gray-900 dark:text-white truncate">{c.otherName || 'Teacher'}</p>
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
              <ChatConversation otherId={selected.id} otherName={selected.name} currentRole="headteacher" onBack={() => setSelected({ id: null, name: '' })} />
            ) : (
              <Card className="p-8 text-center text-gray-500 dark:text-gray-400">
                Select a teacher to start a conversation
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Chat;
