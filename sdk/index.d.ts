export type PromptBlockType = 'intent' | 'tone' | 'format' | 'context' | 'persona';
export interface PromptBlock {
  id: string;
  type: PromptBlockType;
  label: string;
  value: string;
}

export declare const BLOCK_TYPES: readonly PromptBlockType[];
export type InjectMode = 'prepend' | 'append' | 'replace';
export declare const MODES: readonly InjectMode[];

export declare function buildPrompt(blocks: PromptBlock[]): string;
export declare function injectPrompt(base: string, injection: string, mode?: InjectMode): string;
export { buildPrompt as build };
