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
    enableDefaultMetrics?: boolean;
    defaultLabels?: Record<string, string | number | boolean>;
  };
}

/**
 * Represents configuration options for prompt execution
 */
export interface ExecutionOptions {
  provider?: string;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  params?: Record<string, unknown>;
}
