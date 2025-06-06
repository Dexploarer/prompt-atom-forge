/**
 * @fileoverview Core constants and types
 * @module @prompt-or-die/core/constants
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