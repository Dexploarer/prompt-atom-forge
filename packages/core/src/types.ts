/**
 * Represents metadata about a prompt block
 */
export interface PromptBlockMetadata {
  id: string;
  type: string;
  version: string;
  created: Date;
  modified: Date;
  tags: string[];
}

/**
 * Represents a block of content in a prompt
 */
export interface PromptBlock<T = unknown> {
  metadata: PromptBlockMetadata;
  content: T;
}

/**
 * Represents the output of a prompt with rich metadata
 */
export interface PromptOutput<T = unknown> {
  result: T;
  metadata: {
    timestamp: Date;
    duration: number;
    model: string;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    cost: number;
  };
}

/**
 * Represents validation options for prompt blocks
 */
export interface ValidationOptions {
  strict: boolean;
  allowUnknownKeys: boolean;
  customValidators?: Array<(block: PromptBlock) => boolean>;
}

/**
 * Represents error details for prompt validation
 */
export interface ValidationErrorDetail {
  code: string;
  message: string;
  path: string[];
  block?: PromptBlock;
}

/**
 * Represents a prompt template with typed parameters
 */
export type PromptTemplate<P = Record<string, unknown>, R = unknown> = {
  (params: P): Promise<PromptOutput<R>>;
  metadata: PromptBlockMetadata;
};

/**
 * Represents a provider for prompt execution
 */
export interface PromptProvider {
  name: string;
  executePrompt<T>(prompt: any, options?: ExecutionOptions): Promise<T>;
  execute<T>(prompt: string | Record<string, unknown>, options?: ExecutionOptions): Promise<T>;
  validateOptions(options: ExecutionOptions): boolean;
}

/**
 * Configuration options for the prompt-or-die core
 */
export interface CoreOptions {
  defaultProvider?: PromptProvider;
  providers?: Record<string, PromptProvider>;
  plugins?: Array<{
    id: string;
    name: string;
    version: string;
    init(): Promise<void>;
  }>;
  executionDefaults?: Partial<ExecutionOptions>;
  debug?: boolean;
  strict?: boolean;
  cacheEnabled?: boolean;
  metricsEnabled?: boolean;
  cache?: {
    enabled?: boolean;
    maxSize?: number;
    ttl?: number;
  };
  metrics?: {
    /** Enable or disable metrics collection globally */
    enabled?: boolean;
    /** Enable collection of default SDK metrics */
    enableDefaultMetrics?: boolean;
    /** Default labels to apply to all metrics */
    defaultLabels?: Record<string, string | number | boolean>;
    /** Maximum number of values to store in histograms */
    maxHistogramValues?: number;
  };
}

/**
 * Retry configuration for prompt execution
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;

  /**
   * Initial delay in ms before the first retry
   */
  initialDelay?: number;

  /**
   * Maximum delay in ms between retries
   */
  maxDelay?: number;

  /**
   * Exponential backoff factor
   */
  factor?: number;

  /**
   * List of error patterns to retry on (strings or regex patterns)
   */
  retryableErrors?: Array<string | RegExp>;

  /**
   * Callback fired on each retry attempt
   */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

/**
 * Circuit breaker configuration for prompt execution
 */
export interface CircuitBreakerConfig {
  /**
   * Number of failures before opening the circuit
   */
  failureThreshold?: number;

  /**
   * Time in ms before attempting to close the circuit again
   */
  resetTimeout?: number;

  /**
   * Callback when circuit state changes
   */
  onStateChange?: (state: 'open' | 'closed' | 'half-open') => void;
}

/**
 * Represents configuration options for prompt execution
 */
export interface ExecutionOptions {
  /**
   * Provider ID to use for execution
   */
  provider?: string;

  /**
   * Unique ID for this prompt execution
   */
  promptId?: string;

  /**
   * Execution timeout in milliseconds
   */
  timeout?: number;

  /**
   * Advanced retry configuration
   */
  retryConfig?: RetryConfig;

  /**
   * Circuit breaker configuration
   */
  circuitBreaker?: CircuitBreakerConfig;

  /**
   * Simple retry count (deprecated, use retryConfig instead)
   * @deprecated
   */
  retries?: number;

  /**
   * Enable/disable cache for this execution
   */
  cache?: boolean;

  /**
   * Custom cache key
   */
  cacheKey?: string;

  /**
   * Cache TTL in milliseconds
   */
  cacheTTL?: number;

  /**
   * Model to use for execution (provider-specific)
   */
  model?: string;

  /**
   * Temperature for model generation (0-1)
   */
  temperature?: number;

  /**
   * Maximum tokens to generate
   */
  maxTokens?: number;

  /**
   * Additional provider-specific parameters
   */
  params?: Record<string, unknown>;
}
