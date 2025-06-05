/**
 * Plugin manager implementation
 * @module @prompt-or-die/core/plugins
 */

import { 
  Plugin, 
  PluginLifecycle, 
  PluginRegistrationOptions, 
  PluginRegistrationResult,
  PluginStatus,
  PromptTransformerPlugin,
  PromptValidatorPlugin,
  PromptHookPlugin
} from './types';
import { ConfigurationError, PluginError } from '../errors';

/**
 * Manages plugin lifecycle and registration
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private pluginStatus: Map<string, PluginStatus> = new Map();
  private pluginConfigs: Map<string, Record<string, unknown>> = new Map();
  private initialized = false;
  
  /**
   * Register a plugin with the system
   */
  async registerPlugin(
    plugin: Plugin,
    options: PluginRegistrationOptions = {}
  ): Promise<PluginRegistrationResult> {
    try {
      // Check if plugin is already registered
      if (this.plugins.has(plugin.id)) {
        throw new PluginError(`Plugin with ID ${plugin.id} is already registered`);
      }
      
      // Store plugin instance and mark as registered
      this.plugins.set(plugin.id, plugin);
      this.pluginStatus.set(plugin.id, PluginStatus.REGISTERED);
      
      // Store plugin configuration if provided
      if (options.config) {
        this.pluginConfigs.set(plugin.id, { ...options.config });
      }
      
      // Call lifecycle hook if implemented
      if ('onRegister' in plugin && typeof (plugin as PluginLifecycle).onRegister === 'function') {
        await (plugin as PluginLifecycle).onRegister?.();
      }
      
      // Initialize plugin if auto-enable is set
      if (options.autoEnable) {
        await this.initializePlugin(plugin.id);
        this.pluginStatus.set(plugin.id, PluginStatus.ENABLED);
      }
      
      return { success: true, plugin };
    } catch (error) {
      this.pluginStatus.set(plugin.id, PluginStatus.FAILED);
      
      if (options.throwOnError) {
        throw error;
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  
  /**
   * Unregister a plugin from the system
   */
  async unregisterPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    
    if (!plugin) {
      return false;
    }
    
    try {
      // Call lifecycle hooks if implemented
      if ('onUnregister' in plugin && typeof (plugin as PluginLifecycle).onUnregister === 'function') {
        await (plugin as PluginLifecycle).onUnregister?.();
      }
      
      // Call destroy method if implemented
      if (plugin.destroy) {
        await plugin.destroy();
      }
      
      // Remove plugin from maps
      this.plugins.delete(pluginId);
      this.pluginStatus.delete(pluginId);
      this.pluginConfigs.delete(pluginId);
      
      return true;
    } catch (error) {
      this.pluginStatus.set(pluginId, PluginStatus.FAILED);
      throw new PluginError(`Failed to unregister plugin ${pluginId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Initialize a plugin
   */
  async initializePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    
    if (!plugin) {
      throw new PluginError(`Plugin ${pluginId} is not registered`);
    }
    
    try {
      await plugin.init();
      this.pluginStatus.set(pluginId, PluginStatus.INITIALIZED);
    } catch (error) {
      this.pluginStatus.set(pluginId, PluginStatus.FAILED);
      throw new PluginError(`Failed to initialize plugin ${pluginId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get a plugin by ID
   */
  getPlugin<T extends Plugin = Plugin>(pluginId: string): T | undefined {
    return this.plugins.get(pluginId) as T | undefined;
  }
  
  /**
   * Get plugins by type
   */
  getPluginsByType<T extends Plugin>(typeChecker: (plugin: Plugin) => boolean): T[] {
    return Array.from(this.plugins.values()).filter(typeChecker) as T[];
  }
  
  /**
   * Get all transformer plugins
   */
  getTransformerPlugins(): PromptTransformerPlugin[] {
    return this.getPluginsByType<PromptTransformerPlugin>(
      plugin => 'transformBlock' in plugin && typeof (plugin as PromptTransformerPlugin).transformBlock === 'function'
    );
  }
  
  /**
   * Get all validator plugins
   */
  getValidatorPlugins(): PromptValidatorPlugin[] {
    return this.getPluginsByType<PromptValidatorPlugin>(
      plugin => 'validateBlock' in plugin && typeof (plugin as PromptValidatorPlugin).validateBlock === 'function'
    );
  }
  
  /**
   * Get all hook plugins
   */
  getHookPlugins(): PromptHookPlugin[] {
    return this.getPluginsByType<PromptHookPlugin>(
      plugin => {
        const p = plugin as PromptHookPlugin;
        return (
          (p.beforePromptExecution !== undefined) || 
          (p.afterPromptExecution !== undefined) || 
          (p.onPromptExecutionError !== undefined)
        );
      }
    );
  }
  
  /**
   * Check if a plugin is registered
   */
  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }
  
  /**
   * Get plugin status
   */
  getPluginStatus(pluginId: string): PluginStatus | undefined {
    return this.pluginStatus.get(pluginId);
  }
  
  /**
   * Get plugin configuration
   */
  getPluginConfig<T = Record<string, unknown>>(pluginId: string): T | undefined {
    return this.pluginConfigs.get(pluginId) as T | undefined;
  }
  
  /**
   * Update plugin configuration
   */
  updatePluginConfig(
    pluginId: string, 
    config: Record<string, unknown>
  ): void {
    if (!this.plugins.has(pluginId)) {
      throw new ConfigurationError(`Cannot update config for non-existent plugin ${pluginId}`);
    }
    
    const currentConfig = this.pluginConfigs.get(pluginId) || {};
    this.pluginConfigs.set(pluginId, { ...currentConfig, ...config });
  }
  
  /**
   * Initialize all registered plugins
   */
  async initializeAll(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    const promises: Promise<void>[] = [];
    
    for (const pluginId of this.plugins.keys()) {
      promises.push(this.initializePlugin(pluginId));
    }
    
    await Promise.all(promises);
    this.initialized = true;
  }
  
  /**
   * Destroy all plugins and reset manager state
   */
  async destroyAll(): Promise<void> {
    const promises: Promise<boolean>[] = [];
    
    for (const pluginId of this.plugins.keys()) {
      promises.push(this.unregisterPlugin(pluginId));
    }
    
    await Promise.all(promises);
    this.initialized = false;
  }
  
  /**
   * Get all registered plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Get count of registered plugins
   */
  get pluginCount(): number {
    return this.plugins.size;
  }
}
