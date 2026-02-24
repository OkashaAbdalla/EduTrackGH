/**
 * Rate Limiting Middleware
 * Smart rate limiting that only applies to failed login attempts
 */

const rateLimit = require('express-rate-limit');

// In-memory store for failed attempts (in production, use Redis)
const failedAttempts = new Map();

// Clean up old entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  for (const [key, data] of failedAttempts.entries()) {
    if (now - data.firstAttempt > windowMs) {
      failedAttempts.delete(key);
    }
  }
}, 30 * 60 * 1000);

/**
 * Smart rate limiter that only counts failed login attempts
 * @param {number} maxAttempts - Maximum failed attempts allowed
 * @param {string} type - 'login' or 'admin' for different limits
 */
const createSmartLimiter = (maxAttempts, type = 'login') => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `${type}_${ip}`;
    const windowMs = parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS, 10) || 15 * 60 * 1000;
    const now = Date.now();
    
    // Check if IP is currently blocked
    const attempts = failedAttempts.get(key);
    if (attempts && attempts.count >= maxAttempts) {
      const timeLeft = Math.ceil((attempts.firstAttempt + windowMs - now) / 1000 / 60);
      if (timeLeft > 0) {
        return res.status(429).json({
          success: false,
          message: `Too many failed login attempts. Please try again in ${timeLeft} minutes.`,
        });
      } else {
        // Window expired, reset
        failedAttempts.delete(key);
      }
    }
    
    // Store original res.json to intercept response
    const originalJson = res.json;
    res.json = function(data) {
      // Only count failed login attempts (401 status or success: false with auth error)
      const isFailedLogin = (
        res.statusCode === 401 || 
        (data && data.success === false && 
         (data.message?.toLowerCase().includes('invalid') || 
          data.message?.toLowerCase().includes('credentials') ||
          data.message?.toLowerCase().includes('password')))
      );
      
      if (isFailedLogin) {
        const current = failedAttempts.get(key);
        if (current) {
          // Reset window if enough time has passed
          if (now - current.firstAttempt > windowMs) {
            failedAttempts.set(key, { count: 1, firstAttempt: now });
          } else {
            current.count++;
          }
        } else {
          failedAttempts.set(key, { count: 1, firstAttempt: now });
        }
      } else if (data && data.success === true) {
        // Successful login - clear any failed attempts for this IP
        failedAttempts.delete(key);
      }
      
      // Call original res.json
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Standard login: 5 failed attempts per 15 minutes per IP
const loginLimiter = createSmartLimiter(
  parseInt(process.env.RATE_LIMIT_LOGIN_MAX, 10) || 5,
  'login'
);

// Admin login: 3 failed attempts per 15 minutes per IP (stricter)
const adminLoginLimiter = createSmartLimiter(
  parseInt(process.env.RATE_LIMIT_ADMIN_MAX, 10) || 3,
  'admin'
);

// Legacy rate limiters (for non-auth endpoints if needed)
const basicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { 
  loginLimiter, 
  adminLoginLimiter, 
  basicRateLimit,
  createSmartLimiter 
};
