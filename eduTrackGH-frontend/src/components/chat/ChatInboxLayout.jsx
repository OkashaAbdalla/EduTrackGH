/**
 * Responsive chat inbox — list + conversation.
 * Mobile: master-detail (one panel at a time). Desktop (lg+): side-by-side.
 */

import { Card } from '../common';
import ChatListItem from './ChatListItem';

export default function ChatInboxLayout({
  title,
  subtitle,
  conversations = [],
  selected,
  onSelect,
  loading,
  emptyListText = 'No conversations yet',
  emptySelectionText = 'Select a conversation',
  listTitle = 'Conversations',
  children,
}) {
  const hasSelection = Boolean(selected?.id);
  const listHiddenOnMobile = hasSelection;
  const conversationHiddenOnMobile = !hasSelection;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className={`p-4 lg:col-span-1 ${listHiddenOnMobile ? 'hidden lg:block' : 'block'}`}>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{listTitle}</h2>
          {loading ? (
            <div className="animate-pulse h-24 bg-gray-200 dark:bg-gray-700 rounded" />
          ) : (
            <div className="space-y-0.5 max-h-[50vh] lg:max-h-none overflow-y-auto">
              {conversations.map((c) => {
                const id = c.otherId?.toString?.() || c.otherId;
                return (
                  <ChatListItem
                    key={id}
                    name={c.otherName || 'User'}
                    avatarUrl={c.otherAvatarUrl}
                    lastMessage={c.lastMessage}
                    lastAt={c.lastAt}
                    active={selected?.id === id}
                    onClick={() =>
                      onSelect({
                        id,
                        name: c.otherName || 'User',
                        avatarUrl: c.otherAvatarUrl || '',
                      })
                    }
                  />
                );
              })}
              {conversations.length === 0 && <p className="text-sm text-gray-500">{emptyListText}</p>}
            </div>
          )}
        </Card>
        <div className={`lg:col-span-2 min-w-0 ${conversationHiddenOnMobile ? 'hidden lg:block' : 'block'}`}>
          {hasSelection ? (
            children
          ) : (
            <Card className="p-8 text-center text-gray-500 dark:text-gray-400 hidden lg:block">
              {emptySelectionText}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
