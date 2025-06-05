/**
 * @module @prompt-or-die/core
 * Core functionality for prompt-or-die SDK
 * @version 0.1.0
 */

// Import module dependencies
import { CoreOptions, PromptProvider, ExecutionOptions } from './types';
import { PluginManager, Plugin, PluginLifecycle, PromptHookPlugin, PromptTransformerPlugin } from './plugins';
import { createMetricRegistry, globalRegistry, MetricRegistry } from './monitoring';
import { createMemoryCache, defaultCache, Cache } from './cache';
import { ConfigurationError, SDKError } from './errors';
import { PromptBuilder } from './prompt';

// Export core functionality
export * from './errors';
export * from './prompt';
export * from './validation';
export * from './types';
export * from './types/utility-types';
export * from './plugins';
export * from './monitoring';
export * from './cache';
export * from './validators/schema';
export * from './validators/input';

/**
 * Core SDK singleton
 */
export class CoreSDK {
  private initialized = false;
  private options: CoreOptions = {};
  private readonly providers: Map<string, PromptProvider> = new Map();
  private pluginManager: PluginManager;
  private metricRegistry: MetricRegistry;
  private cache: Cache;

  constructor(options: CoreOptions = {}) {
    this.options = {
      ...options,
      debug: options.debug ?? false,
    };

    // Initialize plugin manager
    this.pluginManager = new PluginManager();
    
    // Initialize metrics
    this.metricRegistry = options.metricsEnabled === false
      ? createMetricRegistry({ enabled: false })
      : globalRegistry;
    
    // Initialize cache
    this.cache = options.cacheEnabled === false
      ? createMemoryCache({ enabled: false })
      : defaultCache;
    
    // Register providers
    if (options.providers) {
      Object.entries(options.providers).forEach(([name, provider]) => {
        this.registerProvider(name, provider);
      });
    }
    
    // Register plugins (will be fully initialized in init method)
    if (options.plugins) {
      options.plugins.forEach(plugin => {
        if (!plugin.id) {
          throw new ConfigurationError(`Plugin ${plugin.name || 'unknown'} is missing id property`);
        }
        this.pluginManager.registerPlugin(plugin);
      });
    }
  }

  /**
   * Initialize the SDK with configuration options
   */
  async init(options: Partial<CoreOptions> = {}): Promise<void> {
    const span = this.metricRegistry.startSpan('sdk_init');
    
    try {
      if (this.initialized) {
        throw new ConfigurationError('SDK already initialized');
      }
      
      // Apply default and user options
      this.options = {
        ...this.options,
        ...options,
        strict: options.strict ?? true,
        cacheEnabled: options.cacheEnabled ?? true,
        metricsEnabled: options.metricsEnabled ?? true,
      };
      
      // Configure metrics based on options
      if (options.metrics) {
        this.metricRegistry = createMetricRegistry(options.metrics);
      }
      
      // Configure cache based on options
      if (options.cache) {
        this.cache = createMemoryCache({
          maxSize: options.cache.maxSize,
          ttl: options.cache.ttl,
          lruEviction: options.cache.lruEviction,
          staleWhileRevalidate: options.cache.staleWhileRevalidate,
          enabled: options.cache.enabled ?? this.options.cacheEnabled ?? true
        });
      }
      
      // Initialize all registered plugins
      await this.pluginManager.initializeAllPlugins({
        autoEnable: true,
        throwOnError: this.options.strict
      });
      
      // Register additional plugins if provided in init options
      if (options.plugins) {
        for (const plugin of options.plugins) {
          if (!plugin.id) {
            throw new ConfigurationError(`Plugin ${plugin.name || 'unknown'} is missing id property`);
          }
          await this.registerPlugin(plugin);
        }
      }
      
      // Call SDK initialization lifecycle hooks on plugins
      await this.initializePlugins();
      
      this.initialized = true;
    } catch (error) {
      throw new SDKError(
        `Failed to initialize SDK: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    } finally {
      span.end();
    }
  }
  
  /**
   * Register a prompt provider
   */
  registerProvider(name: string, provider: PromptProvider): void {
    if (this.providers.has(name)) {
      throw new ConfigurationError(`Provider with name "${name}" is already registered`);
    }
    
    this.providers.set(name, provider);
  }
  
  /**
   * Get a registered provider by name
   */
  getProvider(name: string): PromptProvider | undefined {
    return this.providers.get(name);
  }
  
  /**
   * Register a plugin
   */
  async registerPlugin(plugin: Plugin): Promise<void> {
    try {
      await this.pluginManager.registerPlugin(plugin, {
        autoEnable: true,
        throwOnError: this.options.strict
      });
    } catch (error) {
      throw new ConfigurationError(
        `Failed to register plugin ${plugin.id}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }
  }
  
  /**
   * Execute a prompt with the specified provider
   */
  async executePrompt<T>(
    prompt: PromptBuilder,
    options: ExecutionOptions = {}
  ): Promise<T> {
    if (!this.initialized) {
      throw new SDKError('SDK must be initialized before executing prompts');
    }
    
    const span = this.metricRegistry.startSpan('prompt_execution');
    const providerName = options.provider || 'default';
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new ConfigurationError(`Provider "${providerName}" not found`);
    }
    
    try {
      // Apply transformer plugins to the prompt
      const transformerPlugins = this.pluginManager.getPluginsByType<PromptTransformerPlugin>('transformer');
      let modifiedPrompt = prompt;
      
      for (const plugin of transformerPlugins) {
        if (typeof plugin.transformPrompt === 'function') {
          modifiedPrompt = await plugin.transformPrompt(modifiedPrompt);
        }
      }
      
      // Generate cache key from prompt
      const cacheKey = `prompt_${providerName}_${modifiedPrompt.serialize()}`;
      
      // Check cache if enabled
      if (this.options.cacheEnabled && options.cache !== false) {
        const cached = await this.cache.get<T>(cacheKey);
        
        if (cached) {
          this.metricRegistry.counter('prompt_cache_hits').inc();
          return cached;
        }
      }
      
      // Execute the prompt with the provider
      this.metricRegistry.counter('prompt_executions').inc();
      const timer = this.metricRegistry.startTimer('prompt_execution_time');
      
      const result = await provider.executePrompt<T>(modifiedPrompt, options);
      
      timer.end();
      
      // Store in cache if enabled
      if (this.options.cacheEnabled && options.cache !== false) {
        const ttl = options.cacheTTL || this.options.cache?.ttl;
        await this.cache.set(cacheKey, result, { ttl });
      }
      
      // Apply hooks from plugins after execution
      let processedResult: unknown = result;
      const hookPlugins = this.pluginManager.getPluginsByType<PromptHookPlugin>('hook');
      
      for (const plugin of hookPlugins) {
        if (typeof plugin.afterPromptExecution === 'function') {
          processedResult = await plugin.afterPromptExecution(processedResult);
        }
      }
      
      return processedResult as T;
    } catch (error) {
      this.metricRegistry.counter('prompt_execution_errors').inc();
      
      // Apply error hooks from plugins
      const hookPlugins = this.pluginManager.getPluginsByType<PromptHookPlugin>('hook');
      
      for (const plugin of hookPlugins) {
        if (typeof plugin.onPromptExecutionError === 'function' && error instanceof Error) {
          await plugin.onPromptExecutionError(error);
        }
      }
      
      throw new SDKError(
        `Failed to execute prompt with provider "${providerName}": ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    } finally {
      span.end();
    }
  }
  
  /**
   * Get all registered providers
   */
  getAllProviders(): Record<string, PromptProvider> {
    const providersObject: Record<string, PromptProvider> = {};
    this.providers.forEach((provider, name) => {
      providersObject[name] = provider;
    });
    return providersObject;
  }
  
  /**
   * Get the current SDK options
   */
  getOptions(): CoreOptions {
    return { ...this.options };
  }
  
  /**
   * Get the plugin manager instance
   */
  getPluginManager(): PluginManager {
    return this.pluginManager;
  }
  
  /**
   * Get the metric registry instance
   */
  getMetricRegistry(): MetricRegistry {
    return this.metricRegistry;
  }
  
  /**
   * Get the cache instance
   */
  getCache(): Cache {
    return this.cache;
  }
  
  /**
   * Check if the SDK is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Call lifecycle hooks on all registered plugins
   * @private
   */
  private async initializePlugins(): Promise<void> {
    // Call SDK init lifecycle hook on all plugins
    const plugins = this.pluginManager.getAllPlugins();
    
    for (const plugin of plugins) {
      if (typeof (plugin as PluginLifecycle).onSDKInit === 'function') {
        await (plugin as PluginLifecycle).onSDKInit();
      }
    }
  }
  
  /**
   * Shut down the SDK and clean up resources
   */
  async destroy(): Promise<void> {
    if (!this.initialized) {
      return;
    }
    
    try {
      const span = this.metricRegistry.startSpan('sdk_destroy');
      
      try {
        // Call SDK destroy lifecycle hook on all plugins
        const plugins = this.pluginManager.getAllPlugins();
        
        for (const plugin of plugins) {
          if (typeof (plugin as PluginLifecycle).onSDKDestroy === 'function') {
            await (plugin as PluginLifecycle).onSDKDestroy();
          }
        }
        
        // Disable and destroy all plugins
        await this.pluginManager.disableAllPlugins();
        
        // Clear cache
        await this.cache.clear();
        
        this.initialized = false;
      } catch (error) {
        throw error;
      } finally {
        span.end();
      }
    } catch (error) {
      throw new SDKError(
        `Failed to destroy SDK: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }
  }
  
  /**
   * Create a new prompt builder
   */
  createPromptBuilder(): PromptBuilder {
    return new PromptBuilder();
  }
}

// Create and export SDK singleton instance
export const sdk = new CoreSDK();
