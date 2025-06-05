/**
 * Plugin system tests
 */

import { 
  BasePlugin, 
  BaseTransformerPlugin, 
  BaseValidatorPlugin, 
  PluginManager,
  Plugin,
  PromptTransformerPlugin,
  PluginStatus
} from '../plugins';
import { PromptBlock, ValidationErrorDetail } from '../types';
import { PromptBuilder } from '../prompt';

// Mock plugin implementation for testing
class MockPlugin extends BasePlugin {
  protected initCalled = false;
  protected cleanupCalled = false;

  constructor(id: string, name: string, version: string) {
    super({
      id,
      name,
      version,
      description: 'A mock plugin for testing'
    });
  }

  async initialize(): Promise<void> {
    this.initCalled = true;
  }

  async cleanup(): Promise<void> {
    this.cleanupCalled = true;
  }

  wasInitialized(): boolean {
    return this.initCalled;
  }

  wasCleanedUp(): boolean {
    return this.cleanupCalled;
  }
}

// Mock transformer plugin for testing
class MockTransformerPlugin extends BaseTransformerPlugin {
  protected initCalled = false;

  constructor(id: string, name: string) {
    super({
      id,
      name,
      version: '1.0.0',
      description: 'A mock transformer plugin for testing'
    });
  }

  async initialize(): Promise<void> {
    this.initCalled = true;
  }

  async transformBlock(block: PromptBlock): Promise<PromptBlock> {
    // Add a tag to the block to indicate it was transformed
    const newTags = [...block.metadata.tags, 'transformed-by-' + this.id];
    
    return {
      ...block,
      metadata: {
        ...block.metadata,
        tags: newTags
      }
    };
  }
}

// Mock validator plugin for testing
class MockValidatorPlugin extends BaseValidatorPlugin {
  protected initCalled = false;
  protected validationRule: (block: PromptBlock) => boolean;

  constructor(
    id: string, 
    name: string, 
    validationRule: (block: PromptBlock) => boolean
  ) {
    super({
      id,
      name,
      version: '1.0.0',
      description: 'A mock validator plugin for testing'
    });
    
    this.validationRule = validationRule;
  }

  async initialize(): Promise<void> {
    this.initCalled = true;
  }

  async validateBlock(block: PromptBlock): Promise<ValidationErrorDetail[]> {
    if (this.validationRule(block)) {
      return [];
    }
    
    return [{
      code: 'MOCK_VALIDATION_ERROR',
      message: `Block failed validation rule in ${this.name}`,
      path: []
    }];
  }
}

describe('Plugin System', () => {
  describe('PluginManager', () => {
    let pluginManager: PluginManager;
    let mockPlugin: MockPlugin;
    
    beforeEach(() => {
      pluginManager = new PluginManager();
      mockPlugin = new MockPlugin('test-plugin', 'Test Plugin', '1.0.0');
    });
    
    it('should register a plugin', async () => {
      const result = await pluginManager.registerPlugin(mockPlugin);
      
      expect(result.success).toBe(true);
      expect(result.plugin).toBe(mockPlugin);
      expect(pluginManager.hasPlugin('test-plugin')).toBe(true);
      expect(pluginManager.getPlugin('test-plugin')).toBe(mockPlugin);
      expect(pluginManager.getPluginStatus('test-plugin')).toBe(PluginStatus.REGISTERED);
    });
    
    it('should initialize a plugin', async () => {
      await pluginManager.registerPlugin(mockPlugin);
      await pluginManager.initializePlugin('test-plugin');
      
      expect(mockPlugin.wasInitialized()).toBe(true);
      expect(pluginManager.getPluginStatus('test-plugin')).toBe(PluginStatus.INITIALIZED);
    });
    
    it('should auto-initialize a plugin when autoEnable is true', async () => {
      await pluginManager.registerPlugin(mockPlugin, { autoEnable: true });
      
      expect(mockPlugin.wasInitialized()).toBe(true);
      expect(pluginManager.getPluginStatus('test-plugin')).toBe(PluginStatus.ENABLED);
    });
    
    it('should unregister a plugin', async () => {
      await pluginManager.registerPlugin(mockPlugin);
      const result = await pluginManager.unregisterPlugin('test-plugin');
      
      expect(result).toBe(true);
      expect(pluginManager.hasPlugin('test-plugin')).toBe(false);
      expect(mockPlugin.wasCleanedUp()).toBe(true);
    });
    
    it('should return plugins by type', async () => {
      const transformer = new MockTransformerPlugin('transformer', 'Transformer Plugin');
      const validator = new MockValidatorPlugin(
        'validator', 
        'Validator Plugin', 
        () => true
      );
      
      await pluginManager.registerPlugin(mockPlugin);
      await pluginManager.registerPlugin(transformer);
      await pluginManager.registerPlugin(validator);
      
      const transformers = pluginManager.getTransformerPlugins();
      const validators = pluginManager.getValidatorPlugins();
      
      expect(transformers).toHaveLength(1);
      expect(transformers[0].id).toBe('transformer');
      
      expect(validators).toHaveLength(1);
      expect(validators[0].id).toBe('validator');
      
      expect(pluginManager.getAllPlugins()).toHaveLength(3);
    });
  });
  
  describe('BaseTransformerPlugin', () => {
    let transformerPlugin: MockTransformerPlugin;
    let promptBuilder: PromptBuilder;
    
    beforeEach(() => {
      transformerPlugin = new MockTransformerPlugin('transformer', 'Transformer Plugin');
      promptBuilder = new PromptBuilder()
        .addText('Hello world')
        .addSystemInstruction('Be professional');
    });
    
    it('should transform a single block', async () => {
      const block: PromptBlock = {
        metadata: {
          id: '123',
          type: 'text',
          version: '1.0',
          created: new Date(),
          modified: new Date(),
          tags: ['original']
        },
        content: 'Test content'
      };
      
      const transformed = await transformerPlugin.transformBlock(block);
      
      expect(transformed.metadata.tags).toContain('original');
      expect(transformed.metadata.tags).toContain('transformed-by-transformer');
    });
    
    it('should transform all blocks in a prompt', async () => {
      await transformerPlugin.initialize();
      
      // Transform the entire prompt
      const transformedPrompt = await transformerPlugin.transformPrompt(promptBuilder);
      const blocks = transformedPrompt.getBlocks();
      
      expect(blocks.length).toBe(2);
      expect(blocks[0].metadata.tags).toContain('transformed-by-transformer');
      expect(blocks[1].metadata.tags).toContain('transformed-by-transformer');
    });
  });
  
  describe('BaseValidatorPlugin', () => {
    it('should validate blocks based on rule', async () => {
      // Create a validator that checks if content is a string
      const validator = new MockValidatorPlugin(
        'string-validator', 
        'String Validator', 
        (block) => typeof block.content === 'string'
      );
      
      await validator.initialize();
      
      const validBlock: PromptBlock = {
        metadata: {
          id: '123',
          type: 'text',
          version: '1.0',
          created: new Date(),
          modified: new Date(),
          tags: []
        },
        content: 'This is a string'
      };
      
      const invalidBlock: PromptBlock = {
        metadata: {
          id: '456',
          type: 'data',
          version: '1.0',
          created: new Date(),
          modified: new Date(),
          tags: []
        },
        content: { data: 'Not a string' }
      };
      
      const validResult = await validator.validateBlock(validBlock);
      const invalidResult = await validator.validateBlock(invalidBlock);
      
      expect(validResult).toHaveLength(0);
      expect(invalidResult).toHaveLength(1);
      expect(invalidResult[0].code).toBe('MOCK_VALIDATION_ERROR');
    });
    
    it('should validate an entire prompt', async () => {
      // Create a validator that checks if the block type is text
      const validator = new MockValidatorPlugin(
        'text-validator', 
        'Text Validator', 
        (block) => block.metadata.type === 'text'
      );
      
      await validator.initialize();
      
      // Create a prompt with one text block and one non-text block
      const builder = new PromptBuilder([
        {
          metadata: {
            id: '123',
            type: 'text',
            version: '1.0',
            created: new Date(),
            modified: new Date(),
            tags: []
          },
          content: 'Valid text block'
        },
        {
          metadata: {
            id: '456',
            type: 'system',
            version: '1.0',
            created: new Date(),
            modified: new Date(),
            tags: []
          },
          content: 'System instruction'
        }
      ]);
      
      const results = await validator.validatePrompt(builder);
      
      expect(results).toHaveLength(1);
      expect(results[0].code).toBe('MOCK_VALIDATION_ERROR');
    });
  });
});
