import { ref, readonly } from 'vue';
import { $fetch } from 'ofetch';
import { useLogger } from './useLogger';

const { debug, info, warn } = useLogger();

// Cache storage
const cache = ref(new Map());
const cacheStats = ref({
  hits: 0,
  misses: 0,
  size: 0,
  maxSize: 100
});

// Cache configuration
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

export const useApiCache = () => {
  const generateCacheKey = (url, params = {}) => {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${url}?${sortedParams}`;
  };

  const isExpired = (cacheEntry) => {
    return Date.now() > cacheEntry.expiresAt;
  };

  const cleanupExpired = () => {
    const now = Date.now();
    for (const [key, entry] of cache.value.entries()) {
      if (isExpired(entry)) {
        cache.value.delete(key);
        cacheStats.value.size--;
        debug(`Cache entry expired and removed: ${key}`);
      }
    }
  };

  const enforceMaxSize = () => {
    if (cache.value.size > MAX_CACHE_SIZE) {
      // Remove oldest entries
      const entries = Array.from(cache.value.entries());
      entries.sort((a, b) => a[1].createdAt - b[1].createdAt);
      
      const toRemove = entries.slice(0, cache.value.size - MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => {
        cache.value.delete(key);
        cacheStats.value.size--;
      });
      
      debug(`Cache size enforced, removed ${toRemove.length} entries`);
    }
  };

  const set = (key, data, ttl = DEFAULT_TTL) => {
    cleanupExpired();
    enforceMaxSize();

    const cacheEntry = {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      accessCount: 0
    };

    cache.value.set(key, cacheEntry);
    cacheStats.value.size = cache.value.size;
    
    debug(`Cache set: ${key}`, { ttl: `${ttl / 1000}s` });
  };

  const get = (key) => {
    const entry = cache.value.get(key);
    
    if (!entry) {
      cacheStats.value.misses++;
      debug(`Cache miss: ${key}`);
      return null;
    }

    if (isExpired(entry)) {
      cache.value.delete(key);
      cacheStats.value.size--;
      cacheStats.value.misses++;
      debug(`Cache entry expired: ${key}`);
      return null;
    }

    // Update access count and move to end (LRU behavior)
    entry.accessCount++;
    cache.value.delete(key);
    cache.value.set(key, entry);
    
    cacheStats.value.hits++;
    debug(`Cache hit: ${key}`);
    
    return entry.data;
  };

  const has = (key) => {
    const entry = cache.value.get(key);
    return entry && !isExpired(entry);
  };

  const remove = (key) => {
    const deleted = cache.value.delete(key);
    if (deleted) {
      cacheStats.value.size--;
      debug(`Cache entry removed: ${key}`);
    }
    return deleted;
  };

  const clear = () => {
    const size = cache.value.size;
    cache.value.clear();
    cacheStats.value.size = 0;
    info(`Cache cleared, removed ${size} entries`);
  };

  const getStats = () => {
    const hitRate = cacheStats.value.hits + cacheStats.value.misses > 0 
      ? (cacheStats.value.hits / (cacheStats.value.hits + cacheStats.value.misses) * 100).toFixed(2)
      : 0;

    return {
      ...cacheStats.value,
      hitRate: `${hitRate}%`,
      currentSize: cache.value.size
    };
  };

  const preload = async (urls, ttl = DEFAULT_TTL) => {
    info(`Preloading ${urls.length} URLs into cache`);
    
    const results = await Promise.allSettled(
      urls.map(async (url) => {
        try {
          const response = await $fetch(url);
          set(url, response, ttl);
          return { url, success: true };
        } catch (error) {
          warn(`Failed to preload URL: ${url}`, error);
          return { url, success: false, error };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    info(`Cache preload completed: ${successful}/${urls.length} successful`);
    
    return results;
  };

  return {
    set,
    get,
    has,
    remove,
    clear,
    getStats,
    preload,
    stats: readonly(cacheStats)
  };
};
