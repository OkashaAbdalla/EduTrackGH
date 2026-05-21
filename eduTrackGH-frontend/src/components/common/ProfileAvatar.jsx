/**
 * Profile avatar — sharp display with optional Cloudinary sizing
 */

import { getOptimizedImageUrl } from '../../utils/helpers';

const SIZES = {
  sm: { box: 32, px: 64, text: 'text-xs' },
  md: { box: 44, px: 88, text: 'text-sm' },
  lg: { box: 56, px: 112, text: 'text-base' },
  xl: { box: 80, px: 160, text: 'text-lg' },
};

const ProfileAvatar = ({ src, name = '', size = 'md', className = '' }) => {
  const cfg = SIZES[size] || SIZES.md;
  const initial = name ? name.trim().slice(0, 1).toUpperCase() : '?';
  const displaySrc = src ? getOptimizedImageUrl(src, { width: cfg.px, height: cfg.px }) : null;

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border border-[color:var(--glass-border)] bg-[color:var(--bg-elevated)] shadow-sm ${className}`}
      style={{ width: cfg.box, height: cfg.box }}
    >
      {displaySrc ? (
        <img
          key={displaySrc}
          src={displaySrc}
          alt={name ? `${name} profile` : 'Profile'}
          width={cfg.box}
          height={cfg.box}
          decoding="async"
          loading="eager"
          className="h-full w-full object-cover [image-rendering:auto]"
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center font-semibold tracking-tight text-[color:var(--text-secondary)] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 ${cfg.text}`}
        >
          {initial}
        </div>
      )}
    </div>
  );
};

export default ProfileAvatar;
