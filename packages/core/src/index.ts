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
import {
  ConfigurationError,
  SDKError,
  PromptExecutionError,
  NetworkError,
  ApiError,
  TimeoutError,
  RateLimitError,
  AuthenticationError,
  ErrorRecovery,
  ErrorClassification,
  enrichError
} from './errors';
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
    
    // Set default execution options
    const executionOptions: ExecutionOptions = {
      retryConfig: {
        maxRetries: 3,
        initialDelay: 500,
        maxDelay: 5000,
      },
      timeout: 30000, // 30 seconds default timeout
      ...options
    };
    
    // Execution context for enriching error details
    const executionContext = {
      provider: providerName,
      timestamp: new Date().toISOString(),
      promptId: options.promptId || Math.random().toString(36).substring(2, 15),
      options: { ...executionOptions }
    };
    
    try {
      // Apply transformer plugins to the prompt
      const transformerPlugins = this.pluginManager.getPluginsByType<PromptTransformerPlugin>('transformer');
      let modifiedPrompt = prompt;
      
      for (const plugin of transformerPlugins) {
        if (typeof plugin.transformPrompt === 'function') {
          try {
            modifiedPrompt = await plugin.transformPrompt(modifiedPrompt);
          } catch (error) {
            throw enrichError(
              new PromptExecutionError(`Transform plugin '${plugin.id}' failed: ${error instanceof Error ? error.message : String(error)}`),
              { pluginId: plugin.id, pluginName: plugin.name, phase: 'transform' }
            );
          }
        }
      }
      
      // Generate cache key from prompt
      const cacheKey = `prompt_${providerName}_${modifiedPrompt.serialize()}`;
      
      // Check cache if enabled (with error recovery)
      if (this.options.cacheEnabled && executionOptions.cache !== false) {
        try {
          const cached = await ErrorRecovery.withFallback(
            async () => await this.cache.get<T>(cacheKey),
            undefined as T | undefined,
            (err) => this.metricRegistry.counter('cache_errors').inc()
          );
          
          if (cached) {
            this.metricRegistry.counter('prompt_cache_hits').inc();
            return cached;
          }
        } catch (error) {
          // Cache errors should not prevent execution, just log them
          this.metricRegistry.counter('cache_errors').inc();
          
          if (this.options.debug) {
            console.warn('Cache retrieval failed:', error);
          }
        }
      }
      
      // Execute the prompt with the provider and handle timeouts/retries
      this.metricRegistry.counter('prompt_executions').inc();
      const timer = this.metricRegistry.startTimer('prompt_execution_time');
      
      // Create execution function with proper error mapping
      const executeWithProvider = async (): Promise<T> => {
        try {
          return await provider.executePrompt<T>(modifiedPrompt, executionOptions);
        } catch (error) {
          // Map provider errors to our error types for consistent handling
          if (error instanceof Error) {
            const errorMsg = error.message.toLowerCase();
            
            if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
              throw new TimeoutError(
                `Prompt execution timed out with provider "${providerName}"`,
                { timeoutMs: executionOptions.timeout, provider: providerName }
              );
            }
            
            if (errorMsg.includes('rate limit') || errorMsg.includes('too many requests') || 
                (error instanceof ApiError && error.status === 429)) {
              // Extract reset time if available
              const resetInMs = error instanceof ApiError && 
                typeof error.response === 'object' && 
                error.response && 'reset_in' in error.response ? 
                Number((error.response as any).reset_in) * 1000 : undefined;
              
              throw new RateLimitError(
                `Rate limit exceeded with provider "${providerName}"`,
                resetInMs,
                { provider: providerName }
              );
            }
            
            if (errorMsg.includes('auth') || errorMsg.includes('key') || errorMsg.includes('token') || 
                errorMsg.includes('credential') || 
                (error instanceof ApiError && error.status === 401)) {
              throw new AuthenticationError(
                `Authentication failed with provider "${providerName}"`,
                { provider: providerName }
              );
            }
            
            if (errorMsg.includes('network') || errorMsg.includes('connection') || 
                errorMsg.includes('unreachable') || 
                (error instanceof ApiError && error.status >= 500)) {
              throw new NetworkError(
                `Network error with provider "${providerName}"`,
                { provider: providerName }
              );
            }
          }
          
          // If no specific error type matched, wrap in PromptExecutionError
          throw new PromptExecutionError(
            `Failed to execute prompt with provider "${providerName}": ${error instanceof Error ? error.message : String(error)}`,
            { cause: error, provider: providerName }
          );
        }
      };
      
      // Apply timeout if specified
      const executeWithTimeout = executionOptions.timeout ? 
        () => ErrorRecovery.withTimeout(
          executeWithProvider,
          executionOptions.timeout as number,
          `Prompt execution with provider "${providerName}" timed out after ${executionOptions.timeout}ms`
        ) : executeWithProvider;
      
      // Apply retries if configured
      const retryConfig = executionOptions.retryConfig || {};
      const executeWithRetries = retryConfig.maxRetries ? 
        () => ErrorRecovery.retry(
          executeWithTimeout,
          {
            maxRetries: retryConfig.maxRetries,
            initialDelay: retryConfig.initialDelay,
            maxDelay: retryConfig.maxDelay,
            factor: retryConfig.factor || 2,
            // Only retry on network errors, timeouts, rate limits, and 5xx errors
            retryableErrors: [NetworkError.name, TimeoutError.name, RateLimitError.name, /5\d\d/],
            onRetry: (error, attempt, delay) => {
              this.metricRegistry.counter('prompt_execution_retries').inc();
              if (this.options.debug) {
                console.warn(`Retrying prompt execution (${attempt}/${retryConfig.maxRetries}) after ${delay}ms:`, error);
              }
            }
          }
        ) : executeWithTimeout;
      
      // Execute with all error handling mechanisms
      const result = await executeWithRetries();
      timer.end();
      
      // Store in cache if enabled (with error handling)
      if (this.options.cacheEnabled && executionOptions.cache !== false) {
        const ttl = executionOptions.cacheTTL || this.options.cache?.ttl;
        
        // Use withFallback so cache errors don't affect the result
        await ErrorRecovery.withFallback(
          async () => await this.cache.set(cacheKey, result, { ttl }),
          undefined,
          (err) => this.metricRegistry.counter('cache_errors').inc()
        );
      }
      
      // Apply hooks from plugins after execution
      let processedResult: unknown = result;
      const hookPlugins = this.pluginManager.getPluginsByType<PromptHookPlugin>('hook');
      
      for (const plugin of hookPlugins) {
        if (typeof plugin.afterPromptExecution === 'function') {
          try {
            processedResult = await plugin.afterPromptExecution(processedResult);
          } catch (error) {
            // Log but continue with other hooks
            this.metricRegistry.counter('plugin_errors').inc();
            if (this.options.debug) {
              console.warn(`Hook plugin '${plugin.id}' afterPromptExecution failed:`, error);
            }
          }
        }
      }
      
      return processedResult as T;
    } catch (error) {
      this.metricRegistry.counter('prompt_execution_errors').inc();
      
      // Apply error hooks from plugins
      const hookPlugins = this.pluginManager.getPluginsByType<PromptHookPlugin>('hook');
      
      // Try to execute all error hooks, but don't fail if they fail
      for (const plugin of hookPlugins) {
        if (typeof plugin.onPromptExecutionError === 'function' && error instanceof Error) {
          try {
            await plugin.onPromptExecutionError(error);
          } catch (hookError) {
            // Just log the hook error but continue with other hooks
            this.metricRegistry.counter('plugin_errors').inc();
            if (this.options.debug) {
              console.warn(`Error hook in plugin '${plugin.id}' failed:`, hookError);
            }
          }
        }
      }
      
      // Enrich the error with execution context
      if (error instanceof PromptError) {
        enrichError(error, executionContext);
        throw error;
      } else {
        // Wrap unknown errors
        throw new PromptExecutionError(
          `Unhandled error during prompt execution with provider "${providerName}": ${error instanceof Error ? error.message : String(error)}`,
          { cause: error, ...executionContext }
        );
      }
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
