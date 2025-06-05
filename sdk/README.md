# prompt-or-die SDK

Small helper library used by the Prompt or Die CLI and webapp.

## Installation

```bash
npm install prompt-or-die
```

## Usage

```ts
import { buildPrompt, injectPrompt, BLOCK_TYPES } from 'prompt-or-die/sdk'
import type { PromptBlock } from 'prompt-or-die/sdk'

const blocks: PromptBlock[] = [
  { id: '1', type: 'intent', label: 'Summarize', value: 'Give me a summary.' },
  { id: '2', type: 'tone', label: 'Professional', value: 'Use a business tone.' }
]

const prompt = buildPrompt(blocks)
const final = injectPrompt(prompt, 'Keep it short', 'append')
```

`BLOCK_TYPES` provides the list of valid block type strings, useful for validation or UI helpers.

