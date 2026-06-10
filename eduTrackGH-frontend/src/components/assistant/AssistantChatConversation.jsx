/**
 * Headteacher <-> Assistant chat conversation (right-click edit/delete)
 */

import { useState, useEffect } from 'react';
import ChatMessageList from '../chat/ChatMessageList';
import { ProfileAvatar } from '../common';
import { useSocket, useToast, useConfirm } from '../../context';

const AssistantChatConversation = ({
  otherName,
  otherAvatarUrl = '',
  currentRole,
  chatApi,
  onDelegationActivate,
  pendingDelegationId,
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const { socket } = useSocket();
  const { showToast } = useToast();
  const { requestConfirmation } = useConfirm();

  const loadMessages = async () => {
    try {
      const res = await chatApi.getAssistantChat();
      setMessages(res.messages || []);
      setEditingMessage(null);
    } catch {
      showToast('Failed to load messages', 'error');
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (data) => {
      setMessages((prev) => {
        const exists = prev.some((m) => String(m.id) === String(data.id));
        return exists ? prev : [...prev, data];
      });
    };
    const onDeleted = (data) => {
      setMessages((prev) => prev.filter((m) => String(m.id) !== String(data.id)));
    };
    socket.on('assistant_chat_message', onMessage);
    socket.on('assistant_chat_message_deleted', onDeleted);
    return () => {
      socket.off('assistant_chat_message', onMessage);
      socket.off('assistant_chat_message_deleted', onDeleted);
    };
  }, [socket]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      if (editingMessage) {
        const res = await chatApi.updateAssistantChatMessage(editingMessage.id, text);
        if (res.success && res.message) {
          setMessages((prev) => prev.map((m) => (m.id === res.message.id ? res.message : m)));
        }
        setEditingMessage(null);
      } else {
        const res = await chatApi.sendAssistantChat(text);
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

  const handleActivateDelegation = async (delegationId) => {
    const ok = await requestConfirmation({
      title: 'Activate Assistant Duties',
      message: 'Accept this request and start acting as Assistant Headteacher?',
      confirmText: 'Activate',
      cancelText: 'Cancel',
    });
    if (!ok) return;
    await onDelegationActivate?.(delegationId);
    await loadMessages();
  };

  const renderDelegationButton = (m) => {
    const isDelegationRequest =
      m.messageType === 'delegation_request' &&
      currentRole === 'assistant_headteacher' &&
      pendingDelegationId &&
      String(m.delegationId) === String(pendingDelegationId);
    if (!isDelegationRequest) return null;
    return (
      <button
        type="button"
        onClick={() => handleActivateDelegation(m.delegationId)}
        className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold"
      >
        Activate Assistant Duties
      </button>
    );
  };

  return (
    <div className="flex flex-col h-[min(480px,calc(100dvh-11rem))] lg:h-[480px] border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center gap-2 sm:gap-3 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0">
        <ProfileAvatar src={otherAvatarUrl} name={otherName} size="sm" />
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{otherName || 'Chat'}</h3>
      </div>
      <ChatMessageList
        messages={messages}
        currentRole={currentRole}
        strictRoleMatch
        renderMessageExtra={renderDelegationButton}
        onEdit={(m) => {
          setEditingMessage(m);
          setInput(m.message || '');
        }}
        onDelete={async (m) => {
          try {
            await chatApi.deleteAssistantChatMessage(m.id);
            setMessages((prev) => prev.filter((x) => String(x.id) !== String(m.id)));
          } catch {
            showToast('Failed to delete message', 'error');
          }
        }}
      />
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="flex-1 min-w-0 px-3 sm:px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 text-base"
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

export default AssistantChatConversation;

