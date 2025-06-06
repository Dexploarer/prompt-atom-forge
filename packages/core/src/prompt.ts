/**
 * @module @prompt-or-die/core
 * Core prompt building architecture with immutable patterns and functional utilities
 */

import { z } from 'zod';
import { 
  PromptBlock, 
  PromptBlockMetadata, 
  PromptOutput, 
  PromptTemplate 
} from './types';
import { PromptConstructionError, SerializationError } from './errors';
import { validatePromptBlock } from './validation';

/**
 * Generate a unique ID for prompt blocks
 */
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Create a new prompt block with default metadata
 */
export const createBlock = <T>(
  type: string,
  content: T,
  tags: string[] = []
): PromptBlock<T> => {
  const now = new Date();
  
  const metadata: PromptBlockMetadata = {
    id: generateId(),
    type,
    version: '1.0.0',
    created: now,
    modified: now,
    tags,
  };

  // Validate the block before returning
  const block = { metadata, content };
  const validationErrors = validatePromptBlock(block);
  
  if (validationErrors.length > 0) {
    throw new PromptConstructionError('Invalid prompt block', {
      errors: validationErrors
    });
  }

  return block;
};

/**
 * Utility for safely modifying content of a prompt block
 */
export const updateBlockContent = <T>(
  block: PromptBlock<T>,
  updater: (content: T) => T
): PromptBlock<T> => {
  try {
    const updatedContent = updater(block.content);
    return {
      ...block,
      metadata: {
        ...block.metadata,
        modified: new Date()
      },
      content: updatedContent
    };
  } catch (error) {
    throw new PromptConstructionError(
      `Failed to update block content: ${(error as Error).message}`,
      { blockId: block.metadata.id }
    );
  }
};

/**
 * Represents a builder for immutable prompt chains
 */
export class PromptBuilder<T = unknown> {
  private blocks: PromptBlock[] = [];

  /**
   * Create a new prompt builder
   */
  constructor(initialBlocks: PromptBlock[] = []) {
    this.blocks = [...initialBlocks];
  }

  /**
   * Add a block to the prompt chain
   */
  add<B>(block: PromptBlock<B>): PromptBuilder<T> {
    return new PromptBuilder<T>([...this.blocks, block]);
  }

  /**
   * Add a text block to the prompt chain
   */
  addText(text: string, tags: string[] = []): PromptBuilder<T> {
    const block = createBlock('text', text, tags);
    return this.add(block);
  }

  /**
   * Add a system instruction block to the prompt chain
   */
  addSystemInstruction(instruction: string, tags: string[] = []): PromptBuilder<T> {
    const block = createBlock('system', instruction, tags);
    return this.add(block);
  }

  /**
   * Add a user message block to the prompt chain
   */
  addUserMessage(message: string, tags: string[] = []): PromptBuilder<T> {
    const block = createBlock('user', message, tags);
    return this.add(block);
  }

  /**
   * Add an assistant message block to the prompt chain
   */
  addAssistantMessage(message: string, tags: string[] = []): PromptBuilder<T> {
    const block = createBlock('assistant', message, tags);
    return this.add(block);
  }

  /**
   * Apply functional map operation to each block
   */
  map<R>(fn: (block: PromptBlock) => PromptBlock): PromptBuilder<T> {
    return new PromptBuilder<T>(this.blocks.map(fn));
  }

  /**
   * Apply functional filter operation to blocks
   */
  filter(predicate: (block: PromptBlock) => boolean): PromptBuilder<T> {
    return new PromptBuilder<T>(this.blocks.filter(predicate));
  }

  /**
   * Get all blocks in the chain
   */
  getBlocks(): ReadonlyArray<PromptBlock> {
    return Object.freeze([...this.blocks]);
  }

  /**
   * Serialize the prompt chain to JSON
   */
  serialize(): string {
    try {
      return JSON.stringify({
        version: '1.0',
        blocks: this.blocks,
      });
    } catch (error) {
      throw new SerializationError(`Failed to serialize prompt: ${(error as Error).message}`);
    }
  }

  /**
   * Create a new prompt builder from serialized JSON
   */
  static deserialize(serialized: string): PromptBuilder {
    try {
      const data = JSON.parse(serialized);
      return new PromptBuilder(data.blocks);
    } catch (error) {
      throw new SerializationError(`Failed to deserialize prompt: ${(error as Error).message}`);
    }
  }

  /**
   * Create a typed prompt template with parameter validation
   */
  static createTemplate<P, R>(
    paramSchema: z.ZodType<P>,
    builder: (params: P) => PromptBuilder<R>,
    executor: (blocks: ReadonlyArray<PromptBlock>, params: P) => Promise<PromptOutput<R>>
  ): PromptTemplate<P, R> {
    const template = async (params: P): Promise<PromptOutput<R>> => {
      // Validate parameters
      try {
        paramSchema.parse(params);
      } catch (error) {
        throw new PromptConstructionError('Invalid template parameters', { 
          zodError: error 
        });
      }

      // Build prompt and execute
      const promptBuilder = builder(params);
      return await executor(promptBuilder.getBlocks(), params);
    };

    // Add metadata to the template function
    const metadata: PromptBlockMetadata = {
      id: generateId(),
      type: 'template',
      version: '1.0.0',
      created: new Date(),
      modified: new Date(),
      tags: []
    };

    (template as PromptTemplate<P, R>).metadata = metadata;
    return template as PromptTemplate<P, R>;
  }

  /**
   * Diff two prompts to find differences
   */
  diff(other: PromptBuilder): {
    added: PromptBlock[];
    removed: PromptBlock[];
    changed: { from: PromptBlock; to: PromptBlock }[];
  } {
    const added: PromptBlock[] = [];
    const removed: PromptBlock[] = [];
    const changed: { from: PromptBlock; to: PromptBlock }[] = [];

    // Find blocks in this prompt not in other
    const otherBlockIds = new Set(other.blocks.map(b => b.metadata.id));
    for (const block of this.blocks) {
      if (!otherBlockIds.has(block.metadata.id)) {
        added.push(block);
      }
    }

    // Find blocks in other prompt not in this
    const thisBlockIds = new Set(this.blocks.map(b => b.metadata.id));
    for (const block of other.blocks) {
      if (!thisBlockIds.has(block.metadata.id)) {
        removed.push(block);
      }
    }

    // Find changed blocks (same id but different content)
    const thisBlocksById = new Map(this.blocks.map(b => [b.metadata.id, b]));
    const otherBlocksById = new Map(other.blocks.map(b => [b.metadata.id, b]));
    
    for (const [id, thisBlock] of thisBlocksById.entries()) {
      const otherBlock = otherBlocksById.get(id);
      if (otherBlock && JSON.stringify(thisBlock.content) !== JSON.stringify(otherBlock.content)) {
        changed.push({ from: otherBlock, to: thisBlock });
      }
    }

    return { added, removed, changed };
  }
}
