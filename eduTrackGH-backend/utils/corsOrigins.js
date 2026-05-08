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

  // Production: trust FRONTEND_URL list. Add known Render aliases for this project
  // to prevent accidental lockout from common frontend URL typos during redeploys.
  if (process.env.NODE_ENV === 'production') {
    const renderAliases = [
      'https://edutrackgh-frontend.onrender.com',
      'https://edutrackgh-fronted.onrender.com',
    ];
    return [...new Set([...fromEnv, ...renderAliases])];
  }

  return [...new Set([...fromEnv, ...getDefaultDevOrigins()])];
}

/** Origin matches a CORS-allowed frontend (normalized, no trailing slash). */
function isAllowedFrontendOrigin(origin) {
  const o = normalizeOrigin(origin);
  if (!o || !/^https?:\/\//i.test(o)) return false;
  return getCorsOrigins().some((a) => normalizeOrigin(a) === o);
}

/**
 * Base URL for links in outbound email (reset / verify).
 * Prefer the browser Origin (or Referer origin) when it is in the CORS allowlist, so local dev
 * with FRONTEND_URL still pointing at production does not send users to prod with a token stored
 * only on the local API database. If Origin is missing or untrusted, use the first FRONTEND_URL origin.
 */
function resolveFrontendBaseForEmailLink(req) {
  const originHeader = String(req?.headers?.origin || '').trim();
  if (originHeader && isAllowedFrontendOrigin(originHeader)) {
    return normalizeOrigin(originHeader);
  }
  const referer = String(req?.headers?.referer || '').trim();
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (isAllowedFrontendOrigin(refOrigin)) return normalizeOrigin(refOrigin);
    } catch (_) {
      // ignore
    }
  }
  const raw = process.env.FRONTEND_URL || process.env.CLIENT_URL || process.env.APP_URL || '';
  const origins = String(raw)
    .split(',')
    .map((s) => normalizeOrigin(s))
    .filter(Boolean);

  // Development fallback:
  // When Origin/Referer are missing (common with same-origin /api calls via dev proxy),
  // prefer a localhost origin if one exists. This prevents generating reset links to prod
  // while the token is stored in the local MongoDB.
  if (process.env.NODE_ENV === 'development') {
    const localOrigin =
      origins.find((o) => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(o)) ||
      origins.find((o) => o.includes('localhost:')) ||
      origins.find((o) => o.includes('127.0.0.1:'));
    if (localOrigin) return localOrigin;

    // If FRONTEND_URL is set to prod only (common on dev machines due to env overrides),
    // still prefer local for link generation in development.
    return 'http://localhost:5173';
  }

  // Otherwise: first configured origin.
  const first = origins[0];
  if (first && /^https?:\/\//i.test(first)) return first;

  return 'http://localhost:5173';
}

module.exports = { getCorsOrigins, isAllowedFrontendOrigin, resolveFrontendBaseForEmailLink };
