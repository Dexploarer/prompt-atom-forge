import { describe, expect, it } from '@jest/globals';
import * as fc from 'fast-check';
import { z } from 'zod';
import { PromptBuilder, createBlock, updateBlockContent } from '../prompt';
import { PromptBlock } from '../types';

describe('Prompt Builder', () => {
  describe('createBlock', () => {
    it('should create a valid block with correct metadata', () => {
      const content = 'Test content';
      const type = 'text';
      const tags = ['test'];
      
      const block = createBlock(type, content, tags);
      
      expect(block).toHaveProperty('metadata');
      expect(block).toHaveProperty('content');
      expect(block.metadata.type).toBe(type);
      expect(block.metadata.tags).toEqual(tags);
      expect(block.content).toBe(content);
      expect(typeof block.metadata.id).toBe('string');
      expect(block.metadata.id.length).toBeGreaterThan(0);
    });
    
    it('should generate unique IDs for each block', () => {
      const blockA = createBlock('text', 'Content A');
      const blockB = createBlock('text', 'Content B');
      
      expect(blockA.metadata.id).not.toBe(blockB.metadata.id);
    });
  });
  
  describe('updateBlockContent', () => {
    it('should update content while preserving metadata', () => {
      const originalBlock = createBlock('text', 'Original content');
      const originalId = originalBlock.metadata.id;
      const originalCreated = originalBlock.metadata.created;
      
      const updatedBlock = updateBlockContent(originalBlock, (content) => `${content} - Updated`);
      
      expect(updatedBlock.content).toBe('Original content - Updated');
      expect(updatedBlock.metadata.id).toBe(originalId);
      expect(updatedBlock.metadata.created).toBe(originalCreated);
      expect(updatedBlock.metadata.modified).not.toBe(originalBlock.metadata.modified);
    });
  });
  
  describe('PromptBuilder', () => {
    it('should add blocks immutably', () => {
      const builder = new PromptBuilder();
      const textBlock = createBlock('text', 'Text content');
      
      const newBuilder = builder.add(textBlock);
      
      // Original builder should be unchanged
      expect(builder.getBlocks().length).toBe(0);
      // New builder should have the block
      expect(newBuilder.getBlocks().length).toBe(1);
      expect(newBuilder.getBlocks()[0]).toBe(textBlock);
    });
    
    it('should provide convenience methods for common block types', () => {
      const builder = new PromptBuilder()
        .addText('Text content')
        .addSystemInstruction('System instruction')
        .addUserMessage('User message')
        .addAssistantMessage('Assistant message');
      
      const blocks = builder.getBlocks();
      expect(blocks.length).toBe(4);
      expect(blocks[0].metadata.type).toBe('text');
      expect(blocks[1].metadata.type).toBe('system');
      expect(blocks[2].metadata.type).toBe('user');
      expect(blocks[3].metadata.type).toBe('assistant');
    });
    
    it('should serialize and deserialize properly', () => {
      const originalBuilder = new PromptBuilder()
        .addText('Text content')
        .addSystemInstruction('System instruction');
      
      const serialized = originalBuilder.serialize();
      const deserializedBuilder = PromptBuilder.deserialize(serialized);
      
      expect(deserializedBuilder.getBlocks().length).toBe(2);
      expect(deserializedBuilder.getBlocks()[0].content).toBe('Text content');
      expect(deserializedBuilder.getBlocks()[1].content).toBe('System instruction');
    });
    
    it('should implement map and filter operations', () => {
      const builder = new PromptBuilder()
        .addText('Text 1')
        .addText('Text 2')
        .addSystemInstruction('System');
      
      const filteredBuilder = builder.filter(b => b.metadata.type === 'text');
      expect(filteredBuilder.getBlocks().length).toBe(2);
      
      const mappedBuilder = builder.map(b => ({
        ...b,
        content: typeof b.content === 'string' ? b.content.toUpperCase() : b.content
      }));
      
      expect(mappedBuilder.getBlocks()[0].content).toBe('TEXT 1');
    });
    
    it('should correctly diff two prompt builders', () => {
      // Create initial builder
      const original = new PromptBuilder()
        .addText('Common block')
        .addSystemInstruction('Original system');
      
      // Create new blocks
      const textBlock = createBlock('text', 'New block');
      
      // Get original blocks for modification
      const originalBlocks = original.getBlocks();
      const commonBlockId = originalBlocks[0].metadata.id;
      
      // Create modified builder
      const modified = new PromptBuilder([
        // Reuse block with ID but different content
        {
          metadata: {
            ...originalBlocks[0].metadata,
            modified: new Date()
          },
          content: 'Modified common block'
        } as PromptBlock,
        // Add new block
        textBlock
      ]);
      
      const diff = modified.diff(original);
      
      expect(diff.added.length).toBe(1);
      expect(diff.added[0]).toBe(textBlock);
      
      expect(diff.removed.length).toBe(1);
      expect(diff.removed[0].metadata.type).toBe('system');
      
      expect(diff.changed.length).toBe(1);
      expect(diff.changed[0].from.metadata.id).toBe(commonBlockId);
      expect(diff.changed[0].from.content).toBe('Common block');
      expect(diff.changed[0].to.content).toBe('Modified common block');
    });
  });
  
  describe('Property-based tests', () => {
    it('should maintain immutability across operations', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(
            fc.constantFrom('text', 'system', 'user', 'assistant'),
            fc.string()
          ), { minLength: 1, maxLength: 10 }),
          (blockSpecs) => {
            // Create a builder with the blocks
            let builder = new PromptBuilder();
            
            // Add all blocks
            for (const [type, content] of blockSpecs) {
              builder = builder.add(createBlock(type, content));
            }
            
            const originalBlocks = builder.getBlocks();
            
            // Apply various operations
            const mappedBuilder = builder.map(b => b);
            const filteredBuilder = builder.filter(() => true);
            
            // The original blocks array should be unchanged and frozen
            expect(Object.isFrozen(originalBlocks)).toBe(true);
            expect(mappedBuilder.getBlocks()).not.toBe(originalBlocks);
            expect(filteredBuilder.getBlocks()).not.toBe(originalBlocks);
            
            return true;
          }
        )
      );
    });
    
    it('should correctly create templates with parameter validation', () => {
      const paramSchema = z.object({
        name: z.string(),
        age: z.number().positive()
      });
      
      const templateBuilder = (params: z.infer<typeof paramSchema>) => {
        return new PromptBuilder()
          .addText(`Name: ${params.name}`)
          .addText(`Age: ${params.age}`);
      };
      
      const executor = async (blocks: ReadonlyArray<PromptBlock>, params: z.infer<typeof paramSchema>) => {
        return {
          result: `Processed ${params.name} who is ${params.age} years old`,
          metadata: {
            timestamp: new Date(),
            duration: 100,
            model: 'test-model',
            tokens: {
              prompt: 10,
              completion: 10,
              total: 20
            },
            cost: 0.01
          }
        };
      };
      
      const template = PromptBuilder.createTemplate(paramSchema, templateBuilder, executor);
      
      expect(template).toHaveProperty('metadata');
      expect(typeof template).toBe('function');
      
      // Test execution
      return template({ name: 'John', age: 30 }).then(result => {
        expect(result.result).toBe('Processed John who is 30 years old');
      });
    });
  });
});
