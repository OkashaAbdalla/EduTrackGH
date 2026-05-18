/**
 * Admin login API segment (must match frontend VITE_ADMIN_LOGIN_PATH).
 * POST /api/auth/:segment
 */

const DEFAULT_ADMIN_LOGIN_PATH = 'secure-admin-default';

function normalizeAdminLoginPath(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.trim().replace(/^\/+|\/+$/g, '');
}

function getAdminLoginPath() {
  const fromEnv = normalizeAdminLoginPath(process.env.ADMIN_LOGIN_PATH);
  return fromEnv || DEFAULT_ADMIN_LOGIN_PATH;
}

function getAdminLoginApiPath() {
  return `/api/auth/${getAdminLoginPath()}`;
}

function assertAdminLoginPathConfigured() {
  const fromEnv = normalizeAdminLoginPath(process.env.ADMIN_LOGIN_PATH);
  if (fromEnv) return;

  const msg =
    'ADMIN_LOGIN_PATH is not set — using "' +
    DEFAULT_ADMIN_LOGIN_PATH +
    '". Set it in .env to the same value as frontend VITE_ADMIN_LOGIN_PATH or admin login returns 404.';

  if (process.env.NODE_ENV === 'production') {
    console.error(`❌ ${msg}`);
  } else {
    console.warn(`⚠️  ${msg}`);
  }
}

module.exports = {
  DEFAULT_ADMIN_LOGIN_PATH,
  normalizeAdminLoginPath,
  getAdminLoginPath,
  getAdminLoginApiPath,
  assertAdminLoginPathConfigured,
};
