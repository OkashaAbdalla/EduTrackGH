/**
 * ChatConversation – conversation view with messages and send input
 */

import { useState, useEffect } from 'react';
import ChatMessageList from './ChatMessageList';
import chatService from '../../services/chatService';
import { useSocket } from '../../context';
import { useToast } from '../../context';

const ChatConversation = ({ otherId, otherName, currentRole, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const { socket } = useSocket();
  const { showToast } = useToast();

  const loadMessages = async () => {
    if (!otherId) return;
    try {
      const res = await chatService.getConversation(otherId);
      setMessages(res.messages || []);
      setEditingMessage(null);
    } catch {
      showToast('Failed to load messages', 'error');
    }
  };

  useEffect(() => {
    loadMessages();
  }, [otherId]);

  useEffect(() => {
    if (!socket || !otherId) return;
    const handler = (data) => {
      const ht = data.headteacherId?.toString?.();
      const tt = data.teacherId?.toString?.();
      const match = (currentRole === 'headteacher' && tt === otherId) || (currentRole === 'teacher' && ht === otherId);
      if (match) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === data.id);
          return exists ? prev : [...prev, data];
        });
      }
    };
    socket.on('chat_message', handler);
    return () => socket.off('chat_message', handler);
  }, [socket, otherId, currentRole]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      if (editingMessage) {
        const res = await chatService.updateMessage(editingMessage.id, text);
        if (res.success && res.message) {
          setMessages((prev) => prev.map((m) => (m.id === res.message.id ? res.message : m)));
        }
        setEditingMessage(null);
      } else {
        const res = await (currentRole === 'headteacher'
          ? chatService.sendMessage(otherId, text)
          : chatService.sendMessage(null, text));

        // Append immediately from HTTP response (socket is best-effort).
        if (res?.success && res?.message?.id) {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === res.message.id);
            return exists ? prev : [...prev, res.message];
          });
        }
      }
      setInput('');
    } catch {
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[480px] border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {onBack && (
          <button type="button" onClick={onBack} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h3 className="font-semibold text-gray-900 dark:text-white">{otherName || 'Chat'}</h3>
      </div>
      <ChatMessageList
        messages={messages}
        currentRole={currentRole}
        onEdit={(m) => {
          setEditingMessage(m);
          setInput(m.message || '');
        }}
        onDelete={async (m) => {
          if (!window.confirm('Delete this message for both sides?')) return;
          try {
            await chatService.deleteMessage(m.id);
            setMessages((prev) => prev.filter((x) => x.id !== m.id));
          } catch {
            showToast('Failed to delete message', 'error');
          }
        }}
      />
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium"
        >
          {editingMessage ? 'Save' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatConversation;
