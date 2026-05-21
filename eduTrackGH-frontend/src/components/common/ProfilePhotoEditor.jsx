/**
 * Profile photo upload control — crisp avatar + edit menu
 */

import { useRef, useState } from 'react';
import ProfileAvatar from './ProfileAvatar';

const ProfilePhotoEditor = ({
  avatarUrl,
  userName = '',
  loading = false,
  onFileSelect,
  onRemove,
  size = 'md',
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileSelect?.(e);
    setMenuOpen(false);
    clearFileInput();
  };

  return (
    <div className="flex items-center justify-end gap-3 shrink-0">
      <ProfileAvatar key={avatarUrl || 'no-avatar'} src={avatarUrl} name={userName} size={size} />
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-[color:var(--glass-border)] bg-[color:var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[color:var(--text-primary)] shadow-sm transition hover:border-[color:var(--accent-border)] disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Updating…' : 'Edit photo'}
          <svg
            className={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-[color:var(--glass-border)] bg-[color:var(--bg-elevated)] shadow-lg">
              <label className="block cursor-pointer px-3 py-2 text-sm text-[color:var(--text-primary)] transition hover:bg-[color:var(--glass)]">
                {avatarUrl ? 'Change photo' : 'Add photo'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  onRemove?.();
                  setMenuOpen(false);
                  clearFileInput();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-[color:var(--danger)] transition hover:bg-red-500/10 disabled:opacity-50"
                disabled={loading || !avatarUrl}
              >
                Remove photo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePhotoEditor;
