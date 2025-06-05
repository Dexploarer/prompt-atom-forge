# prompt-or-die SDK

Small helper library used by the Prompt or Die CLI and webapp.

## Usage

```ts
import { buildPrompt, injectPrompt } from 'prompt-or-die/sdk'

const prompt = buildPrompt([
  { id: '1', type: 'intent', label: 'Summarize', value: 'Give me a summary.' },
  { id: '2', type: 'tone', label: 'Professional', value: 'Use a business tone.' }
])

const final = injectPrompt(prompt, 'Keep it short', 'append')
```
