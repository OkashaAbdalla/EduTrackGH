/**
 * Custom-styled Google sign-in button (sign-in only).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { initGoogleSignIn, isGoogleConfigured } from '../../utils/googleAuth';

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

/**
 * @param {object} props
 * @param {(credential: string) => void | Promise<void>} props.onCredential
 * @param {(message: string) => void} [props.onError]
 * @param {string} [props.className]
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.fullWidth]
 */
const GoogleSignInButton = ({
  onCredential,
  onError,
  className = '',
  disabled = false,
  fullWidth = false,
}) => {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const hiddenHostRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!isGoogleConfigured()) return undefined;

    let cancelled = false;

    const setup = async () => {
      try {
        await initGoogleSignIn(async (response) => {
          const credential = response?.credential;
          if (!credential) {
            onErrorRef.current?.('Google sign-in did not return a credential.');
            return;
          }
          setBusy(true);
          try {
            await onCredentialRef.current(credential);
          } finally {
            setBusy(false);
          }
        });

        if (cancelled || !hiddenHostRef.current || !window.google?.accounts?.id?.renderButton) return;

        hiddenHostRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(hiddenHostRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: fullWidth ? 320 : 200,
        });
        setReady(true);
      } catch (err) {
        if (!cancelled) onErrorRef.current?.(err.message || 'Google sign-in unavailable');
      }
    };

    setup();
    return () => {
      cancelled = true;
    };
  }, [fullWidth]);

  const handleClick = useCallback(() => {
    if (!ready || busy || disabled) return;
    const btn = hiddenHostRef.current?.querySelector('div[role="button"]');
    if (btn) btn.click();
    else onErrorRef.current?.('Google sign-in is still loading. Please wait a moment.');
  }, [ready, busy, disabled]);

  if (!isGoogleConfigured()) {
    return (
      <button
        type="button"
        disabled
        title="Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in"
        className={`flex items-center justify-center gap-2 bg-slate-700/50 border border-slate-600 text-slate-400 py-3 rounded-lg opacity-60 cursor-not-allowed ${fullWidth ? 'w-full' : ''} ${className}`}
      >
        <GoogleIcon />
        <span className="text-sm">Google</span>
      </button>
    );
  }

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
      <div
        ref={hiddenHostRef}
        className="fixed left-[-9999px] top-0 h-0 w-0 overflow-hidden opacity-0 pointer-events-none"
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || busy || !ready}
        className={`relative z-10 flex items-center justify-center gap-2 bg-slate-700/50 border border-slate-600 text-white py-3 rounded-lg hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed no-underline ${fullWidth ? 'w-full' : ''} ${className}`}
      >
        <GoogleIcon />
        <span className="text-sm font-medium no-underline decoration-0">{busy ? 'Signing in…' : 'Google'}</span>
      </button>
    </div>
  );
};

export default GoogleSignInButton;
