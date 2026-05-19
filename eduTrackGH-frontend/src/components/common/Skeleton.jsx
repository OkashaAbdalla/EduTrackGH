/**
 * Skeleton Loader — glass placeholders
 */

const Skeleton = ({ className = '', variant = 'default' }) => {
  const pulse = 'animate-pulse rounded-lg bg-[color:var(--glass)] border border-[color:var(--glass-border)]';

  if (variant === 'card') {
    return (
      <div className={`${pulse} p-5 ${className}`}>
        <div className="h-3 rounded w-3/4 mb-4 opacity-60 bg-[color:var(--glass-border)]" />
        <div className="h-7 rounded w-1/2 mb-2 opacity-60 bg-[color:var(--glass-border)]" />
        <div className="h-3 rounded w-1/4 opacity-40 bg-[color:var(--glass-border)]" />
      </div>
    );
  }

  if (variant === 'stats') {
    return (
      <div className={`ui-card-stats ${className}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-3 rounded w-24 opacity-60 bg-[color:var(--glass-border)]" />
            <div className="h-8 rounded w-16 opacity-60 bg-[color:var(--glass-border)]" />
            <div className="h-3 rounded w-32 opacity-40 bg-[color:var(--glass-border)]" />
          </div>
          <div className="w-11 h-11 rounded-lg opacity-60 bg-[color:var(--glass-border)]" />
        </div>
      </div>
    );
  }

  return <div className={`${pulse} ${className}`} />;
};

export default Skeleton;
