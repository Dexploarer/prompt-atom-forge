/**
 * @fileoverview Core SDK entry point
 * @module @prompt-or-die/core
 * Core functionality for prompt-or-die SDK
 * @version 0.1.0
 */

// Re-export constants and types
export { BLOCK_TYPES, MODES } from './constants';
export type { BlockType, InjectMode, PromptBlock } from './constants';
import { BLOCK_TYPES, MODES, BlockType, InjectMode, PromptBlock } from './constants';

// Re-export utility functions
export { buildPrompt, injectPrompt } from './utils';
import { buildPrompt, injectPrompt } from './utils';

/**
 * Alias for buildPrompt for backward compatibility
 */
export { buildPrompt as build };

/**
 * SDK version
 */
export const version = '0.1.0';

/**
 * Core SDK options interface
 */
export interface CoreOptions {
  debug?: boolean;
}

/**
 * Core SDK class for advanced usage
 */
export class CoreSDK {
  private options: CoreOptions;

  constructor(options: CoreOptions = {}) {
    this.options = options;
  }

  getVersion(): string {
    return version;
  }

  buildPrompt(blocks: PromptBlock[]): string {
    return buildPrompt(blocks);
  }

  injectPrompt(base: string, injection: string, mode: InjectMode = 'append'): string {
    return injectPrompt(base, injection, mode);
  }
}



// MCP exports
export * from './mcp/index';
export * from './mcp/transports';
export * from './mcp/generator';

// Export everything
export const index = {
  BLOCK_TYPES,
  MODES,
  buildPrompt,
  injectPrompt,
  version,
  CoreSDK
};

export default index;
