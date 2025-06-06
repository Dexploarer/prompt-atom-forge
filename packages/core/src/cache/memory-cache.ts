/**
 * In-memory cache implementation
 * @module @prompt-or-die/core/cache
 */

import { Cache, CacheEntry, CacheEntryMetadata, CacheOptions, CacheSetOptions, CacheStats } from './types';

/**
 * In-memory LRU cache implementation
 */
export class MemoryCache implements Cache {
  private cache: Map<string, CacheEntry> = new Map();
  private options: Required<CacheOptions>;
  private stats: {
    hits: number;
    misses: number;
    evictions: number;
    accessTimes: number[];
    size: number;
    hitRatio: number;
    averageAccessTimeMs?: number;
  };
  private enabled: boolean;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 60 * 1000, // Default 1 minute
      maxSize: options.maxSize || 1000,
      lruEviction: options.lruEviction !== false, // Default true
      staleWhileRevalidate: options.staleWhileRevalidate || false,
      enabled: options.enabled !== false, // Default true
    };

    this.enabled = this.options.enabled;

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      accessTimes: [],
      size: 0,
      hitRatio: 0,
    };
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    if (!this.enabled) {
      return undefined;
    }

    if (!this.cache.has(key)) {
      this.stats.misses++;
      return undefined;
    }

    const entry = this.cache.get(key)!;
    const now = Date.now();

    // Check if the entry has expired
    if (entry.metadata.expiresAt && entry.metadata.expiresAt < now) {
      // If stale-while-revalidate is enabled, return the stale value
      if (this.options.staleWhileRevalidate) {
        // Mark as stale and track the hit
        entry.metadata.isStale = true;
        this.stats.hits++;
        return entry.value as T;
      }

      // Entry has expired and stale-while-revalidate not enabled
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // Update LRU status by touching the entry
    this.updateEntryAccess(key, entry);

    this.stats.hits++;
    this.updateHitRatio();
    return entry.value as T;
  }

  /**
   * Get a value with metadata from cache
   */
  async getWithMetadata<T>(key: string): Promise<{ value: T; metadata: CacheEntryMetadata } | undefined> {
    if (!this.enabled) {
      return undefined;
    }

    if (!this.cache.has(key)) {
      this.stats.misses++;
      return undefined;
    }

    const entry = this.cache.get(key)!;
    const now = Date.now();

    // Check if the entry has expired
    if (entry.metadata.expiresAt && entry.metadata.expiresAt < now) {
      // If stale-while-revalidate is enabled, return the stale value
      if (this.options.staleWhileRevalidate) {
        // Mark as stale and track the hit
        entry.metadata.isStale = true;
        this.stats.hits++;
        return { value: entry.value as T, metadata: entry.metadata };
      }

      // Entry has expired and stale-while-revalidate not enabled
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // Update LRU status by touching the entry
    this.updateEntryAccess(key, entry);

    this.stats.hits++;
    this.updateHitRatio();
    return { value: entry.value as T, metadata: entry.metadata };
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options?: CacheSetOptions | number): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const now = Date.now();
    let ttl: number;
    let staleWhileRevalidate: boolean;
    let slidingExpiration: boolean;

    // Handle both numeric TTL and options object
    if (typeof options === 'number') {
      ttl = options;
      staleWhileRevalidate = this.options.staleWhileRevalidate;
      slidingExpiration = false;
    } else if (options) {
      ttl = options.ttl ?? this.options.ttl;
      staleWhileRevalidate = options.staleWhileRevalidate ?? this.options.staleWhileRevalidate;
      slidingExpiration = options.slidingExpiration ?? false;
    } else {
      ttl = this.options.ttl;
      staleWhileRevalidate = this.options.staleWhileRevalidate;
      slidingExpiration = false;
    }

    const expiresAt = now + ttl;

    const entry: CacheEntry = {
      value,
      metadata: {
        createdAt: now,
        expiresAt,
        isStale: false,
        accessCount: 0,
        lastAccessed: now,
        custom: { 
          staleWhileRevalidate, 
          slidingExpiration 
        }
      }
    };

    // Check if we need to evict something to make room
    if (this.options.maxSize > 0 && this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evict();
    }

    this.cache.set(key, entry);
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    const result = this.cache.delete(key);
    return result;
  }

  /**
   * Clear all values from cache
   */
  async clear(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    this.cache.clear();
  }

  /**
   * Check if a key exists in cache
   */
  async has(key: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }
    
    if (!this.cache.has(key)) {
      return false;
    }
    
    const entry = this.cache.get(key)!;
    const now = Date.now();
    
    // Check if expired
    if (entry.metadata.expiresAt && entry.metadata.expiresAt < now) {
      if (!this.options.staleWhileRevalidate) {
        this.cache.delete(key);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Update entry access information
   */
  private updateEntryAccess(key: string, entry: CacheEntry): void {
    // Only update if LRU eviction policy is enabled
    if (this.options.lruEviction) {
      const now = Date.now();
      // Update metadata
      entry.metadata.accessCount = (entry.metadata.accessCount || 0) + 1;
      entry.metadata.lastAccessed = now;
      
      // Track access time for stats
      const startTime = performance.now();
      this.stats.accessTimes.push(startTime);
      
      // Keep only the last 100 access times to avoid memory bloat
      if (this.stats.accessTimes.length > 100) {
        this.stats.accessTimes.shift();
      }
      
      // Handle sliding expiration if enabled
      const slidingExpiration = entry.metadata.custom?.['slidingExpiration'];
      if (slidingExpiration && entry.metadata.expiresAt) {
        // Reset expiration based on current access time
        const ttl = entry.metadata.expiresAt - entry.metadata.createdAt;
        entry.metadata.expiresAt = now + ttl;
      }
      
      // For LRU, delete and add again to move to most-recently-used position
      this.cache.delete(key);
      this.cache.set(key, entry);
    }
  }
  
  /**
   * Update hit ratio stat
   */
  private updateHitRatio(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRatio = total > 0 ? this.stats.hits / total : 0;
    this.stats.size = this.cache.size;
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    // Calculate average access time if we have data
    if (this.stats.accessTimes.length > 0) {
      const sum = this.stats.accessTimes.reduce((a, b) => a + b, 0);
      this.stats.averageAccessTimeMs = sum / this.stats.accessTimes.length;
    }

    const result: CacheStats = {
      size: this.stats.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRatio: this.stats.hitRatio,
      estimatedSize: this.estimateSize(),
      evictions: this.stats.evictions
    };
    
    if (this.stats.averageAccessTimeMs !== undefined) {
      result.averageAccessTimeMs = this.stats.averageAccessTimeMs;
    }
    
    return result;
  }

  /**
   * Evict least recently/frequently used entries when cache is full
   */
  private evict(): void {
    if (this.cache.size === 0) return;

    if (this.options.lruEviction) {
      // LRU: Remove least recently used entry
      let lruKey: string | undefined;
      let oldestAccess = Infinity;

      for (const [key, entry] of this.cache.entries()) {
        const lastAccess = entry.metadata.lastAccessed || 0;
        if (lastAccess < oldestAccess) {
          oldestAccess = lastAccess;
          lruKey = key;
        }
      }
      
      // If we found a least-recently-used key, remove it
      if (lruKey) {
        this.cache.delete(lruKey);
        this.stats.evictions++;
        this.stats.size = this.cache.size;
      } else {
        // If no access times recorded, fall back to first item in cache
        lruKey = this.cache.keys().next().value;
        if (lruKey) {
          this.cache.delete(lruKey);
          this.stats.evictions++;
          this.stats.size = this.cache.size;
        }
      }
    } else {
      // FIFO: Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.delete(firstKey).catch(e => console.error(`Error evicting key ${firstKey}:`, e));
      }
    }
  }
  

  
  /**
   * Estimate memory usage of cache
   */
  private estimateSize(): number {
    let totalSize = 0;
    
    // Rough estimate based on key and value sizes
    for (const [key, entry] of this.cache.entries()) {
      // Estimate key size (2 bytes per character in JS strings)
      totalSize += key.length * 2;
      
      // Estimate value size based on its type
      if (typeof entry.value === 'string') {
        totalSize += (entry.value as string).length * 2;
      } else if (typeof entry.value === 'object' && entry.value !== null) {
        try {
          totalSize += JSON.stringify(entry.value).length * 2;
        } catch {
          // Fallback if not serializable
          totalSize += 1024; // Assume 1KB
        }
      } else {
        // For numbers, booleans, etc.
        totalSize += 8;
      }
      
      // Metadata size (timestamps, etc.)
      totalSize += 24;
    }
    
    return totalSize;
  }
}
