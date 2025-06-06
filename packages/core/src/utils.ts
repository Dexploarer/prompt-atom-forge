/**
 * @fileoverview Core utility functions
 * @module @prompt-or-die/core/utils
 */

import { BLOCK_TYPES, MODES, PromptBlock, BlockType, InjectMode } from './constants';

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