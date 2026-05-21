/**
 * WhatsApp-style conversation row — avatar + name + preview
 */

import { ProfileAvatar } from '../common';

const formatChatTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function ChatListItem({ name, avatarUrl, lastMessage, lastAt, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition ${
        active
          ? 'bg-[color:var(--accent-muted)] border border-[color:var(--accent-border)]'
          : 'hover:bg-[color:var(--glass)] border border-transparent'
      }`}
    >
      <ProfileAvatar src={avatarUrl} name={name} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-medium text-[color:var(--text-primary)] truncate">{name}</p>
          {lastAt && (
            <span className="shrink-0 text-[10px] text-[color:var(--text-muted)]">{formatChatTime(lastAt)}</span>
          )}
        </div>
        <p className="text-xs text-[color:var(--text-secondary)] truncate mt-0.5">{lastMessage || 'No messages yet'}</p>
      </div>
    </button>
  );
}
