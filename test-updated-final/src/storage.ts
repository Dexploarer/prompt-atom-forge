import { createRequire } from 'module';
import type { PromptStorage } from 'prompt-or-die-core';

const require = createRequire(import.meta.url);

export function createStorage(config: any): PromptStorage {
    const { MemoryPromptStorage, FilePromptStorage } = require('prompt-or-die-core');
  switch (config.type) {
    case 'memory':
      return new MemoryPromptStorage();
    case 'file':
      return new FilePromptStorage(config.path || './data/prompts');
    default:
      throw new Error(`Unsupported storage type: ${config.type}. Available types: memory, file`);
  }
}
