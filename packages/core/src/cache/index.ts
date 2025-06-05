/**
 * Cache system exports
 * @module @prompt-or-die/core/cache
 */

// Export cache types
export * from './types';

// Export memory cache
export * from './memory-cache';

// Re-export for convenient access
import { MemoryCache } from './memory-cache';
import { CacheOptions, CacheKeyGenerator } from './types';

/**
 * Create a new in-memory cache instance
 */
export function createMemoryCache(options?: CacheOptions): MemoryCache {
  return new MemoryCache(options);
}

/**
 * Global default cache instance
 */
export const defaultCache = createMemoryCache({
  ttl: 3600000, // 1 hour
  maxSize: 500,
  lruEviction: true
});

/**
 * Create a cache key from object parameters
 */
export function createCacheKey(params: Record<string, unknown>): string {
  try {
    return JSON.stringify(sortObjectDeep(params));
  } catch (e) {
    // Fallback if object contains circular references
    return `params_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}

/**
 * Sort object recursively to ensure consistent cache keys
 */
function sortObjectDeep(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date || obj instanceof RegExp) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectDeep);
  }

  return Object.keys(obj)
    .sort()
    .reduce((sorted: Record<string, unknown>, key) => {
      sorted[key] = sortObjectDeep((obj as Record<string, unknown>)[key]);
      return sorted;
    }, {});
}
