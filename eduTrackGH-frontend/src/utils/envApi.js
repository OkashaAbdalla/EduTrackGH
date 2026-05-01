/**
 * API / Socket base URLs.
 * In development, default to same-origin `/api` + Vite proxy so requests are not cross-origin
 * (fixes Brave/Firefox strict tracking protections and CORS edge cases with localhost vs 127.0.0.1).
 * Set VITE_DEV_PROXY=0 to call the backend URL directly in dev instead.
 */

export function useDevApiProxy() {
  return import.meta.env.DEV && import.meta.env.VITE_DEV_PROXY !== '0';
}

export function getApiBaseUrl() {
  if (useDevApiProxy()) return '/api';
  const raw = import.meta.env.VITE_API_URL;
  if (raw) return raw;
  if (import.meta.env.DEV) return 'http://localhost:5000/api';
  return '';
}

/**
 * Socket.IO origin (no path). Must match where the engine is reachable.
 */
export function getSocketBaseUrl() {
  if (useDevApiProxy()) {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '');
  if (!apiUrl) return '';
  return apiUrl.replace(/\/api\/?$/, '');
}

export function assertProductionApiConfigured() {
  if (!import.meta.env.PROD) return;
  if (!import.meta.env.VITE_API_URL) {
    throw new Error('VITE_API_URL must be configured for production builds.');
  }
}
