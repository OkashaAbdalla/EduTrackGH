/**
 * CORS allowed origins from FRONTEND_URL.
 * Comma-separated for production (e.g. Vercel prod + preview): https://app.vercel.app,https://preview.vercel.app
 */

function getCorsOrigins() {
  const raw = process.env.FRONTEND_URL;
  if (raw && String(raw).trim()) {
    return String(raw)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return ['http://localhost:5173', 'http://localhost:5174'];
}

module.exports = { getCorsOrigins };
