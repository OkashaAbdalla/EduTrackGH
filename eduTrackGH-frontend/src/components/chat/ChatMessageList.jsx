/**
 * ChatMessageList – message bubbles with right-click edit/delete menu
 */

import { useState } from 'react';
import ContextMenu from '../common/ContextMenu';
import { useConfirm } from '../../context';

const isHeadteacherSide = (role) => role === 'headteacher' || role === 'assistant_headteacher';

const isOwnMessage = (message, currentRole, strictRoleMatch = false) => {
  if (message.senderRole === currentRole) return true;
  if (strictRoleMatch) return false;
  if (isHeadteacherSide(currentRole) && message.senderRole === 'headteacher') return true;
  return false;
};

const canEditMessage = (message) => message.messageType !== 'delegation_request';

const ChatMessageList = ({
  messages,
  currentRole,
  onEdit,
  onDelete,
  strictRoleMatch = false,
  renderMessageExtra,
}) => {
  const { requestConfirmation } = useConfirm();
  const [menu, setMenu] = useState(null);

  const closeMenu = () => setMenu(null);

  const canUseMenu = (message) => {
    if (message.isDeleted) return false;
    const isOwn = isOwnMessage(message, currentRole, strictRoleMatch);
    if (onDelete) return true;
    return isOwn && Boolean(onEdit) && canEditMessage(message);
  };

  const handleContextMenu = (e, message) => {
    if (!canUseMenu(message)) return;
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, message });
  };

  const handleEdit = async (message) => {
    const ok = await requestConfirmation({
      title: 'Edit Message',
      message: 'Edit this message?',
      confirmText: 'Edit',
      cancelText: 'Cancel',
    });
    if (ok) onEdit?.(message);
  };

  const handleDelete = async (message) => {
    const isOwn = isOwnMessage(message, currentRole, strictRoleMatch);
    const ok = await requestConfirmation({
      title: 'Delete Message',
      message: isOwn
        ? 'Delete this message for everyone? It will be cleared from both chats.'
        : 'Remove this message from your chat only? The sender will still see it.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      tone: 'danger',
    });
    if (ok) onDelete?.(message);
  };

  const menuItems = menu
    ? [
        ...(onEdit && isOwnMessage(menu.message, currentRole, strictRoleMatch) && canEditMessage(menu.message)
          ? [{ id: 'edit', label: 'Edit', onClick: () => handleEdit(menu.message) }]
          : []),
        ...(onDelete
          ? [{ id: 'delete', label: 'Delete', onClick: () => handleDelete(menu.message), danger: true }]
          : []),
      ]
    : [];

  return (
    <>
      <div className="flex flex-col gap-3 overflow-y-auto flex-1 p-4">
        {messages.filter((m) => !m.isDeleted).map((m) => {
          const isOwn = isOwnMessage(m, currentRole, strictRoleMatch);
          const hasActions = canUseMenu(m);
          const extra = renderMessageExtra?.(m);
          return (
            <div
              key={m.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                onContextMenu={hasActions ? (e) => handleContextMenu(e, m) : undefined}
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  isOwn
                    ? 'bg-green-600 text-white rounded-br-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
                } ${hasActions ? 'cursor-context-menu' : ''}`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
                {extra}
                <p className={`text-xs mt-1 ${isOwn ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {m.createdAt &&
                    new Date(m.createdAt).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  {m.edited && ' · edited'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {menu && menuItems.length > 0 && (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={closeMenu} />
      )}
    </>
  );
};

export default ChatMessageList;
