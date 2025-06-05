/**
 * Base plugin implementations
 * @module @prompt-or-die/core/plugins
 */

import { 
  Plugin, 
  PluginLifecycle, 
  PluginMetadata,
  PromptTransformerPlugin,
  PromptValidatorPlugin,
  PromptHookPlugin
} from './types';
import { PromptBuilder } from '../prompt';
import { PromptBlock, ValidationErrorDetail } from '../types';

/**
 * Abstract base plugin implementation
 */
export abstract class BasePlugin implements Plugin, PluginLifecycle {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;
  private initialized = false;
  protected metadata: PluginMetadata;
  
  constructor(metadata: PluginMetadata) {
    this.id = metadata.id;
    this.name = metadata.name;
    this.version = metadata.version;
    this.metadata = metadata;
  }
  
  /**
   * Initialize the plugin
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    await this.initialize();
    this.initialized = true;
  }
  
  /**
   * Plugin-specific initialization logic
   */
  protected abstract initialize(): Promise<void>;
  
  /**
   * Clean up plugin resources
   */
  async destroy(): Promise<void> {
    if (!this.initialized) {
      return;
    }
    
    await this.cleanup();
    this.initialized = false;
  }
  
  /**
   * Plugin-specific cleanup logic
   */
  protected async cleanup(): Promise<void> {
    // Default implementation does nothing
  }
  
  /**
   * Called when plugin is registered with the SDK
   */
  async onRegister(): Promise<void> {
    // Default implementation does nothing
  }
  
  /**
   * Called when plugin is unregistered from the SDK
   */
  async onUnregister(): Promise<void> {
    // Default implementation does nothing
  }
  
  /**
   * Called when SDK is initialized
   */
  async onSDKInit(): Promise<void> {
    // Default implementation does nothing
  }
  
  /**
   * Called when SDK is shut down
   */
  async onSDKDestroy(): Promise<void> {
    // Default implementation does nothing
  }
  
  /**
   * Get plugin metadata
   */
  getMetadata(): PluginMetadata {
    return { ...this.metadata };
  }
  
  /**
   * Check if plugin is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * Base implementation of a prompt transformer plugin
 */
export abstract class BaseTransformerPlugin extends BasePlugin implements PromptTransformerPlugin {
  /**
   * Transform a prompt block
   */
  abstract transformBlock(block: PromptBlock): Promise<PromptBlock>;
  
  /**
   * Transform a full prompt by applying transformBlock to each block
   */
  async transformPrompt(prompt: PromptBuilder): Promise<PromptBuilder> {
    const blocks = prompt.getBlocks();
    const transformedBlocks: PromptBlock[] = [];
    
    for (const block of blocks) {
      transformedBlocks.push(await this.transformBlock(block));
    }
    
    return new PromptBuilder(transformedBlocks);
  }
}

/**
 * Base implementation of a prompt validator plugin
 */
export abstract class BaseValidatorPlugin extends BasePlugin implements PromptValidatorPlugin {
  /**
   * Validate a prompt block
   */
  abstract validateBlock(block: PromptBlock): Promise<ValidationErrorDetail[]>;
  
  /**
   * Validate a full prompt by validating each block
   */
  async validatePrompt(prompt: PromptBuilder): Promise<ValidationErrorDetail[]> {
    const blocks = prompt.getBlocks();
    const errors: ValidationErrorDetail[] = [];
    
    for (const block of blocks) {
      errors.push(...await this.validateBlock(block));
    }
    
    return errors;
  }
}

/**
 * Base implementation of a prompt hook plugin
 */
export abstract class BaseHookPlugin extends BasePlugin implements PromptHookPlugin {
  /**
   * Called before a prompt is executed
   */
  async beforePromptExecution?(prompt: PromptBuilder): Promise<PromptBuilder>;
  
  /**
   * Called after a prompt is executed successfully
   */
  async afterPromptExecution?(result: unknown): Promise<unknown>;
  
  /**
   * Called if prompt execution throws an error
   */
  async onPromptExecutionError?(error: Error): Promise<void>;
}
