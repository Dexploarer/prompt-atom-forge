/**
 * Cache system tests
 */

import { 
  MemoryCache,
  createMemoryCache,
  createCacheKey,
  CacheEntryMetadata
} from '../cache';

describe('Cache System', () => {
  let cache: MemoryCache;
  
  beforeEach(() => {
    cache = createMemoryCache({ maxSize: 10 });
  });
  
  describe('Basic Operations', () => {
    it('should set and get cache entries', async () => {
      await cache.set('key1', 'value1');
      
      const value = await cache.get('key1');
      expect(value).toBe('value1');
    });
    
    it('should return undefined for non-existent keys', async () => {
      const value = await cache.get('non-existent');
      expect(value).toBeUndefined();
    });
    
    it('should delete cache entries', async () => {
      await cache.set('key1', 'value1');
      await cache.delete('key1');
      
      const value = await cache.get('key1');
      expect(value).toBeUndefined();
    });
    
    it('should clear all cache entries', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      
      await cache.clear();
      
      const value1 = await cache.get('key1');
      const value2 = await cache.get('key2');
      
      expect(value1).toBeUndefined();
      expect(value2).toBeUndefined();
    });
  });
  
  describe('Cache Expiration', () => {
    it('should respect TTL for cache entries', async () => {
      // Set entry with 50ms TTL
      await cache.set('short-lived', 'value', { ttl: 50 });
      
      // Should exist immediately
      const valueBefore = await cache.get('short-lived');
      expect(valueBefore).toBe('value');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // Should be gone now
      const valueAfter = await cache.get('short-lived');
      expect(valueAfter).toBeUndefined();
    });
    
    it('should return stale data with refreshing flag', async () => {
      // Set entry with 50ms TTL and staleWhileRevalidate
      await cache.set('stale-entry', 'stale value', { 
        ttl: 50,
        staleWhileRevalidate: true
      });
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // Should still be available but marked as stale
      const { value, metadata } = await cache.getWithMetadata('stale-entry');
      expect(value).toBe('stale value');
      expect(metadata?.isStale).toBe(true);
    });
    
    it('should update entry TTL on access when using sliding expiration', async () => {
      await cache.set('sliding-entry', 'value', { 
        ttl: 100,
        slidingExpiration: true
      });
      
      // Access the entry which should reset its expiration
      await new Promise(resolve => setTimeout(resolve, 50));
      const value1 = await cache.get('sliding-entry');
      expect(value1).toBe('value');
      
      // Wait another 70ms (total 120ms > ttl)
      // Should still exist due to sliding window reset
      await new Promise(resolve => setTimeout(resolve, 70));
      const value2 = await cache.get('sliding-entry');
      expect(value2).toBe('value');
      
      // Now wait without accessing
      await new Promise(resolve => setTimeout(resolve, 120));
      const value3 = await cache.get('sliding-entry');
      expect(value3).toBeUndefined();
    });
  });
  
  describe('LRU Eviction Policy', () => {
    it('should evict least recently used items when full', async () => {
      // Fill the cache to its max size (10)
      for (let i = 0; i < 10; i++) {
        await cache.set(`key-${i}`, `value-${i}`);
      }
      
      // Access some items to change their LRU status
      await cache.get('key-0');
      await cache.get('key-2');
      await cache.get('key-4');
      
      // Add a new entry, forcing eviction
      await cache.set('new-key', 'new-value');
      
      // The least recently used should be evicted (key-1)
      const evictedValue = await cache.get('key-1');
      expect(evictedValue).toBeUndefined();
      
      // The most recently accessed should still be there
      const recentValue = await cache.get('key-0');
      expect(recentValue).toBe('value-0');
      
      // The new value should be there
      const newValue = await cache.get('new-key');
      expect(newValue).toBe('new-value');
    });
  });
  
  describe('Cache Stats', () => {
    it('should track hits and misses', async () => {
      await cache.set('hit-key', 'value');
      
      // Cache hit
      await cache.get('hit-key');
      
      // Cache miss
      await cache.get('miss-key');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
    
    it('should track evictions', async () => {
      // Fill the cache with maxSize = 10
      for (let i = 0; i < 12; i++) {
        await cache.set(`key-${i}`, `value-${i}`);
      }
      
      const stats = cache.getStats();
      expect(stats.evictions).toBe(2); // Two items evicted
    });
    
    it('should report size correctly', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      expect(stats.size).toBe(2);
    });
  });
  
  describe('Cache Key Generation', () => {
    it('should create consistent cache keys', () => {
      const obj1 = { 
        a: 1, 
        b: 'string', 
        c: { nested: true }
      };
      
      const obj2 = { 
        c: { nested: true }, 
        a: 1, 
        b: 'string'
      };
      
      // Keys should be consistent regardless of property order
      const key1 = createCacheKey('prefix', obj1);
      const key2 = createCacheKey('prefix', obj2);
      
      expect(key1).toBe(key2);
    });
    
    it('should create unique keys for different objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };
      
      const key1 = createCacheKey('test', obj1);
      const key2 = createCacheKey('test', obj2);
      
      expect(key1).not.toBe(key2);
    });
    
    it('should handle non-object inputs', () => {
      const key1 = createCacheKey('test', 'string-value');
      const key2 = createCacheKey('test', 123);
      const key3 = createCacheKey('test', true);
      
      expect(typeof key1).toBe('string');
      expect(typeof key2).toBe('string');
      expect(typeof key3).toBe('string');
      expect(key1).not.toBe(key2);
      expect(key2).not.toBe(key3);
    });
  });
});
