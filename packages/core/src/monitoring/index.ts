/**
 * Performance monitoring system exports
 * @module @prompt-or-die/core/monitoring
 */

// Export monitoring types
export * from './types';

// Export metric registry
export * from './registry';

// Re-export for convenient access
import { DefaultMetricRegistry } from './registry';
import { MetricRegistryOptions } from './types';

/**
 * Create a new metric registry instance
 */
export function createMetricRegistry(options?: MetricRegistryOptions): DefaultMetricRegistry {
  return new DefaultMetricRegistry(options);
}

// Create a global singleton registry instance for convenience
export const globalRegistry = createMetricRegistry({
  enableDefaultMetrics: true
});
