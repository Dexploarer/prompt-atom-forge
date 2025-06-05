/**
 * Plugin system exports
 * @module @prompt-or-die/core/plugins
 */

// Export plugin types
export * from './types';

// Export plugin manager
export * from './manager';

// Export base plugin implementations
export * from './base';

// Re-export for convenient access
import { PluginManager } from './manager';

/**
 * Create a new plugin manager instance
 */
export function createPluginManager(): PluginManager {
  return new PluginManager();
}
