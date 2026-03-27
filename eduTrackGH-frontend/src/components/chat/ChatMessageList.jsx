/**
 * ChatMessageList – message bubbles with timestamps + optional actions
 */

const ChatMessageList = ({ messages, currentRole, onEdit, onDelete }) => {
  return (
    <div className="flex flex-col gap-3 overflow-y-auto flex-1 p-4">
      {messages.map((m) => {
        const isOwn = m.senderRole === currentRole;
        return (
          <div
            key={m.id}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                isOwn
                  ? 'bg-green-600 text-white rounded-br-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">
                {m.isDeleted ? 'Message deleted' : m.message}
              </p>
              <div className="flex items-center justify-between mt-1 gap-2">
                <p className={`text-xs ${isOwn ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {m.createdAt &&
                    new Date(m.createdAt).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  {m.edited && !m.isDeleted && ' · edited'}
                </p>
                {isOwn && !m.isDeleted && (onEdit || onDelete) && (
                  <div className="flex gap-1 text-[11px]">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(m)}
                        className="px-2 py-0.5 rounded bg-black/10 hover:bg-black/20"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(m)}
                        className="px-2 py-0.5 rounded bg-black/10 hover:bg-black/25"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatMessageList;
