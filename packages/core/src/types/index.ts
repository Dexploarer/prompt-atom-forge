/**
 * Comprehensive type definitions for the prompt-or-die core library
 */

// Re-export core types
export * from '../types';

// Re-export utility types
export * from './utility-types';

/**
 * Represents configuration options for prompt execution
 */
export interface ExecutionOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheKey?: string;
  cacheExpiry?: number;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  params?: Record<string, unknown>;
}

/**
 * Represents a provider for prompt execution
 */
export interface PromptProvider {
  name: string;
  execute<T>(
    prompt: string | Record<string, unknown>,
    options?: ExecutionOptions
  ): Promise<T>;
  validateOptions(options: ExecutionOptions): boolean;
}

/**
 * Represents a plugin that can extend the core functionality
 */
export interface Plugin {
  name: string;
  version: string;
  init(): Promise<void>;
  hooks: Record<string, (...args: any[]) => any>;
}

/**
 * Configuration options for the prompt-or-die core
 */
export interface CoreOptions {
  defaultProvider?: PromptProvider;
  providers?: Record<string, PromptProvider>;
  plugins?: Plugin[];
  executionDefaults?: Partial<ExecutionOptions>;
  debug?: boolean;
  cache?: {
    enabled: boolean;
    maxSize?: number;
    ttl?: number;
  };
}
