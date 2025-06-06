import { PromptStorage, MemoryPromptStorage, FilePromptStorage, DatabasePromptStorage } from '@prompt-or-die/core';

export function createStorage(config: any): PromptStorage {
  switch (config.type) {
    case 'memory':
      return new MemoryPromptStorage();
    case 'file':
      return new FilePromptStorage(config.path || './data/prompts');
    case 'database':
      return new DatabasePromptStorage(config.database || './data/prompts.db', config.table);
    default:
      throw new Error(`Unsupported storage type: ${config.type}`);
  }
}
