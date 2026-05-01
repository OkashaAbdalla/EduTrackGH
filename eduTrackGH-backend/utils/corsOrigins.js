/**
 * CORS allowed origins from FRONTEND_URL.
 * Comma-separated for production (e.g. Vercel prod + preview): https://app.vercel.app,https://preview.vercel.app
 *
 * Browser `Origin` never includes a trailing slash; normalize configured URLs so CORS matches Brave/Chrome/Firefox.
 * Include 127.0.0.1 alongside localhost — Brave users often open http://127.0.0.1:5173 while env lists localhost only.
 */

function normalizeOrigin(origin) {
  const s = String(origin || '').trim();
  if (!s) return '';
  return s.replace(/\/+$/, '');
}

function getDefaultDevOrigins() {
  return [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];
}

function getCorsOrigins() {
  const raw = process.env.FRONTEND_URL;
  if (!raw || !String(raw).trim()) {
    return getDefaultDevOrigins();
  }

  const fromEnv = String(raw)
    .split(',')
    .map((s) => normalizeOrigin(s))
    .filter(Boolean);

  // Production: trust FRONTEND_URL only (avoid exposing dev origins on public APIs).
  if (process.env.NODE_ENV === 'production') {
    return fromEnv;
  }

  return [...new Set([...fromEnv, ...getDefaultDevOrigins()])];
}

module.exports = { getCorsOrigins };
