// Prompt or Die SDK
// Helper functions for building and injecting prompt text

/**
 * Valid block type strings.
 * @type {ReadonlyArray<PromptBlock['type']>}
 */
export const BLOCK_TYPES = ['intent', 'tone', 'format', 'context', 'persona'];

/**
 * Valid modes for {@link injectPrompt}.
 * @type {ReadonlyArray<'prepend' | 'append' | 'replace'>}
 */
export const MODES = ['prepend', 'append', 'replace'];

/**
 * @typedef {Object} PromptBlock
 * @property {string} id
 * @property {"intent"|"tone"|"format"|"context"|"persona"} type
 * @property {string} label
 * @property {string} value
 */

/**
 * Build a prompt string from ordered blocks.
 * @param {PromptBlock[]} blocks
 * @returns {string}
 */
export function buildPrompt(blocks) {
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
 * @param {string} base
 * @param {string} injection
 * @param {'prepend'|'append'|'replace'} [mode='append']
 * @returns {string}
 */
export function injectPrompt(base, injection, mode = 'append') {
  if (!MODES.includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  if (mode === 'prepend') return `${injection}\n${base}`;
  if (mode === 'replace') return injection;
  return `${base}\n${injection}`;
}

export { buildPrompt as build };
