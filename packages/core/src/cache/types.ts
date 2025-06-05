/**
 * Cache system type definitions
 * @module @prompt-or-die/core/cache
 */

/**
 * Cache entry metadata
 */
export interface CacheEntryMetadata {
  /** When the entry was created */
  createdAt: number;
  /** When the entry expires, or undefined for no expiration */
  expiresAt?: number;
  /** Whether the entry is stale (expired but allowed via staleWhileRevalidate) */
  isStale?: boolean;
  /** Number of times this entry has been accessed */
  accessCount?: number;
  /** Timestamp of last access */
  lastAccessed?: number;
  /** Custom metadata for the cache entry */
  custom?: Record<string, unknown>;
}

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T = unknown> {
  /** The cached value */
  value: T;
  /** Metadata for the cache entry */
  metadata: CacheEntryMetadata;
}

/**
 * Cache options
 */
export interface CacheOptions {
  /** Default time-to-live in milliseconds for cache entries */
  ttl?: number;
  /** Maximum number of entries to keep in cache */
  maxSize?: number;
  /** Whether to use LRU eviction policy (remove least recently used first) */
  lruEviction?: boolean;
  /** Whether to allow stale entries to be returned and refreshed in background */
  staleWhileRevalidate?: boolean;
  /** Whether the cache is enabled */
  enabled?: boolean;
}

/**
 * Options for setting a value in cache
 */
export interface CacheSetOptions {
  /** Time-to-live in milliseconds for this specific cache entry */
  ttl?: number;
  /** Whether to allow this entry to be returned stale and refreshed in background */
  staleWhileRevalidate?: boolean;
  /** Whether to reset the TTL on each access to this entry */
  slidingExpiration?: boolean;
}

/**
 * Cache key generator function
 */
export type CacheKeyGenerator<T> = (value: T) => string;

/**
 * Cache interface defining the core functionality
 */
export interface Cache {
  /** Get a value from cache */
  get<T>(key: string): Promise<T | undefined>;
  
  /** Get a value with its metadata from cache */
  getWithMetadata<T>(key: string): Promise<{ value: T; metadata: CacheEntryMetadata } | undefined>;
  
  /** Set a value in cache */
  set<T>(key: string, value: T, options?: CacheSetOptions | number): Promise<void>;
  
  /** Check if a key exists in cache */
  has(key: string): Promise<boolean>;
  
  /** Delete a value from cache */
  delete(key: string): Promise<boolean>;
  
  /** Clear all values from cache */
  clear(): Promise<void>;
  
  /** Get cache stats */
  getStats(): CacheStats;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Current number of items in cache */
  size: number;
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Ratio of hits to total accesses */
  hitRatio: number;
  /** Average access time in milliseconds */
  averageAccessTimeMs?: number;
  /** Estimated memory size in bytes */
  estimatedSize?: number;
  /** Number of items evicted from cache due to size constraints */
  evictions: number;
}
