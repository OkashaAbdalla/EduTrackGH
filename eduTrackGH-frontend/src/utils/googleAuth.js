/**
 * Google Identity Services (GIS) loader.
 */

import { GOOGLE_AUTH } from './constants';

const SCRIPT_ID = 'google-gsi-client';
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let initialized = false;
let loadPromise = null;
let credentialHandler = null;

export function isGoogleConfigured() {
  const id = GOOGLE_AUTH.CLIENT_ID;
  return Boolean(id && id !== 'YOUR_GOOGLE_CLIENT_ID');
}

function loadGoogleScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google sign-in is only available in the browser'));
  }
  if (window.google?.accounts?.id) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google sign-in')));
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google sign-in'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * @param {(response: { credential: string }) => void} onCredential
 */
export async function initGoogleSignIn(onCredential) {
  if (!isGoogleConfigured()) {
    throw new Error('Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to your environment.');
  }

  credentialHandler = onCredential;
  await loadGoogleScript();

  if (!initialized) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_AUTH.CLIENT_ID,
      callback: (response) => credentialHandler?.(response),
      auto_select: false,
      cancel_on_tap_outside: true,
      context: 'signin',
      ux_mode: 'popup',
    });
    initialized = true;
  }
}
