export type PromptBlock = {
  id: string;
  type: 'intent' | 'tone' | 'format' | 'context' | 'persona';
  label: string;
  value: string;
};

/** Build a prompt string from ordered blocks */
export function buildPrompt(blocks: PromptBlock[]): string {
  return blocks
    .map(b => `## ${b.type.toUpperCase()}: ${b.label}\n${b.value}`)
    .join('\n\n');
}

/** Inject additional text into an existing prompt */
export function injectPrompt(base: string, injection: string, mode: 'prepend' | 'append' | 'replace' = 'append'): string {
  if (mode === 'prepend') return `${injection}\n${base}`;
  if (mode === 'replace') return injection;
  return `${base}\n${injection}`;
}

export { buildPrompt as build };
