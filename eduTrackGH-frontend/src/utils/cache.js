/**
 * Simple Cache Utility
 * Purpose: Cache API responses to reduce unnecessary requests
 */

const cache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

const getCacheKey = (url, params = {}) => {
  const paramString = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  return paramString ? `${url}?${paramString}` : url;
};

export const cacheService = {
  get: (url, params) => {
    const key = getCacheKey(url, params);
    const cached = cache.get(key);
    
    if (!cached) return null;
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      cache.delete(key);
      return null;
    }
    
    return cached.data;
  },

  set: (url, params, data) => {
    const key = getCacheKey(url, params);
    cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  },

  invalidate: (pattern) => {
    // Invalidate all cache entries matching pattern
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  },

  clear: () => {
    cache.clear();
  },
};

export default cacheService;
