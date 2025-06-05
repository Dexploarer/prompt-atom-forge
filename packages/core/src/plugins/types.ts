/**
 * Plugin system type definitions
 * @module @prompt-or-die/core/plugins
 */

import { PromptBlock } from '../types';
import { PromptBuilder } from '../prompt';
import { ValidationErrorDetail } from '../types';

/**
 * Base plugin interface
 */
export interface Plugin {
  /** Unique identifier for the plugin */
  id: string;
  /** Display name for the plugin */
  name: string;
  /** Plugin version following semantic versioning */
  version: string;
  /** Plugin initialization function */
  init(): Promise<void>;
  /** Plugin cleanup function */
  destroy?(): Promise<void>;
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginLifecycle {
  /** Called when plugin is registered with the SDK */
  onRegister?(): Promise<void>;
  /** Called when plugin is unregistered from the SDK */
  onUnregister?(): Promise<void>;
  /** Called when SDK is initialized */
  onSDKInit?(): Promise<void>;
  /** Called when SDK is shut down */
  onSDKDestroy?(): Promise<void>;
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /** Plugin identifier */
  id: string;
  /** Display name */
  name: string;
  /** Plugin version */
  version: string;
  /** Plugin description */
  description?: string;
  /** Plugin author information */
  author?: {
    name: string;
    email?: string;
    url?: string;
  };
  /** Plugin homepage */
  homepage?: string;
  /** Plugin repository */
  repository?: string;
  /** Plugin license */
  license?: string;
  /** Plugin dependencies */
  dependencies?: Record<string, string>;
  /** Plugin tags for categorization */
  tags?: string[];
}

/**
 * Plugin registration options
 */
export interface PluginRegistrationOptions {
  /** Whether to enable the plugin immediately after registration */
  autoEnable?: boolean;
  /** Whether to throw on initialization error or just log it */
  throwOnError?: boolean;
  /** Plugin-specific configuration */
  config?: Record<string, unknown>;
}

/**
 * Plugin registration result
 */
export interface PluginRegistrationResult {
  /** Whether the plugin was registered successfully */
  success: boolean;
  /** Plugin instance if registration was successful */
  plugin?: Plugin;
  /** Error information if registration failed */
  error?: Error;
  /** Validation errors if configuration was invalid */
  validationErrors?: ValidationErrorDetail[];
}

/**
 * Plugin that can transform prompt blocks
 */
export interface PromptTransformerPlugin extends Plugin, PluginLifecycle {
  /** Transform a prompt block */
  transformBlock(block: PromptBlock): Promise<PromptBlock>;
  /** Transform a full prompt */
  transformPrompt?(prompt: PromptBuilder): Promise<PromptBuilder>;
}

/**
 * Plugin that can validate prompt blocks
 */
export interface PromptValidatorPlugin extends Plugin, PluginLifecycle {
  /** Validate a prompt block */
  validateBlock(block: PromptBlock): Promise<ValidationErrorDetail[]>;
  /** Validate a full prompt */
  validatePrompt?(prompt: PromptBuilder): Promise<ValidationErrorDetail[]>;
}

/**
 * Plugin that can provide hooks into the prompt execution pipeline
 */
export interface PromptHookPlugin extends Plugin, PluginLifecycle {
  /** Called before a prompt is executed */
  beforePromptExecution?(prompt: PromptBuilder): Promise<PromptBuilder>;
  /** Called after a prompt is executed successfully */
  afterPromptExecution?(result: unknown): Promise<unknown>;
  /** Called if prompt execution throws an error */
  onPromptExecutionError?(error: Error): Promise<void>;
}

/**
 * Plugin registration status
 */
export enum PluginStatus {
  REGISTERED = 'registered',
  INITIALIZED = 'initialized',
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  FAILED = 'failed',
  UNREGISTERED = 'unregistered'
}
