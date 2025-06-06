/**
 * @fileoverview Core SDK entry point
 * @module @prompt-or-die/core
 * Core functionality for prompt-or-die SDK
 * @version 0.1.0
 */

/**
 * Valid block type strings.
 */
export const BLOCK_TYPES = ['intent', 'tone', 'format', 'context', 'persona'] as const;

/**
 * Valid modes for injectPrompt.
 */
export const MODES = ['prepend', 'append', 'replace'] as const;

/**
 * Type for valid block types
 */
export type BlockType = typeof BLOCK_TYPES[number];

/**
 * Type for valid injection modes
 */
export type InjectMode = typeof MODES[number];

/**
 * Represents a prompt block with structured content
 */
export interface PromptBlock {
  id: string;
  type: BlockType;
  label: string;
  value: string;
}

/**
 * Build a prompt string from ordered blocks.
 * @param blocks Array of prompt blocks to build from
 * @returns Formatted prompt string
 */
export function buildPrompt(blocks: PromptBlock[]): string {
  if (!Array.isArray(blocks)) {
    throw new TypeError('blocks must be an array');
  }

  return blocks
    .map((b, i) => {
      if (!BLOCK_TYPES.includes(b.type)) {
        throw new Error(`Invalid block type at index ${i}: ${b.type}`);
      }
      if (typeof b.label !== 'string' || typeof b.value !== 'string') {
        throw new Error(`Invalid block at index ${i}`);
      }
      return `## ${b.type.toUpperCase()}: ${b.label}\n${b.value}`;
    })
    .join('\n\n');
}

/**
 * Inject additional text into an existing prompt.
 * @param base The base prompt text
 * @param injection The text to inject
 * @param mode How to inject the text (prepend, append, or replace)
 * @returns The modified prompt string
 */
export function injectPrompt(base: string, injection: string, mode: InjectMode = 'append'): string {
  if (!MODES.includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  if (mode === 'prepend') return `${injection}\n${base}`;
  if (mode === 'replace') return injection;
  return `${base}\n${injection}`;
}

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

export { BLOCK_TYPES, MODES, buildPrompt, injectPrompt, version, CoreSDK };

// MCP exports
export * from './mcp/index.js';
export * from './mcp/transports.js';
export * from './mcp/generator.js';

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
