/**
 * @fileoverview Model Context Protocol (MCP) Server implementation
 * @module @prompt-or-die/core/mcp
 * Provides MCP server capabilities for prompt generation and management
 */

import { BLOCK_TYPES, MODES, PromptBlock, BlockType, InjectMode } from '../constants';
import { buildPrompt, injectPrompt } from '../utils';

/**
 * MCP Server configuration options
 */
export interface MCPServerConfig {
  name: string;
  version: string;
  description?: string;
  transport: 'stdio' | 'sse' | 'streamable-http';
  host?: string;
  port?: number;
  auth?: {
    type: 'oauth' | 'api-key' | 'none';
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
  };
}

/**
 * MCP Tool definition for prompt operations
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * MCP Resource for prompt storage
 */
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/**
 * Prompt storage interface
 */
export interface PromptStorage {
  save(id: string, blocks: PromptBlock[]): Promise<void>;
  load(id: string): Promise<PromptBlock[]>;
  list(): Promise<string[]>;
  delete(id: string): Promise<void>;
}

/**
 * In-memory prompt storage implementation
 */
export class MemoryPromptStorage implements PromptStorage {
  private prompts = new Map<string, PromptBlock[]>();

  async save(id: string, blocks: PromptBlock[]): Promise<void> {
    this.prompts.set(id, JSON.parse(JSON.stringify(blocks)));
  }

  async load(id: string): Promise<PromptBlock[]> {
    const blocks = this.prompts.get(id);
    if (!blocks) {
      throw new Error(`Prompt with id '${id}' not found`);
    }
    return JSON.parse(JSON.stringify(blocks));
  }

  async list(): Promise<string[]> {
    return Array.from(this.prompts.keys());
  }

  async delete(id: string): Promise<void> {
    if (!this.prompts.has(id)) {
      throw new Error(`Prompt with id '${id}' not found`);
    }
    this.prompts.delete(id);
  }
}

/**
 * File-based prompt storage implementation
 */
export class FilePromptStorage implements PromptStorage {
  constructor(private basePath: string) {}

  async save(id: string, blocks: PromptBlock[]): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const filePath = path.join(this.basePath, `${id}.json`);
    await fs.mkdir(this.basePath, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(blocks, null, 2));
  }

  async load(id: string): Promise<PromptBlock[]> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const filePath = path.join(this.basePath, `${id}.json`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Prompt with id '${id}' not found`);
    }
  }

  async list(): Promise<string[]> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const files = await fs.readdir(this.basePath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.basename(file, '.json'));
    } catch (error) {
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const filePath = path.join(this.basePath, `${id}.json`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      throw new Error(`Prompt with id '${id}' not found`);
    }
  }
}

/**
 * MCP Server for prompt-or-die functionality
 */
export class PromptOrDieMCPServer {
  private config: MCPServerConfig;
  private storage: PromptStorage;
  private tools: MCPTool[];
  private resources: MCPResource[];

  constructor(config: MCPServerConfig, storage?: PromptStorage) {
    this.config = config;
    this.storage = storage || new MemoryPromptStorage();
    this.tools = this.initializeTools();
    this.resources = this.initializeResources();
  }

  /**
   * Initialize MCP tools for prompt operations
   */
  private initializeTools(): MCPTool[] {
    return [
      {
        name: 'create_prompt_block',
        description: 'Create a new prompt block with specified type, label, and content',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: [...BLOCK_TYPES],
              description: 'The type of prompt block'
            },
            label: {
              type: 'string',
              description: 'A descriptive label for the block'
            },
            value: {
              type: 'string',
              description: 'The content/value of the block'
            }
          },
          required: ['type', 'label', 'value']
        }
      },
      {
        name: 'build_prompt',
        description: 'Build a complete prompt from an array of prompt blocks',
        inputSchema: {
          type: 'object',
          properties: {
            blocks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string', enum: [...BLOCK_TYPES] },
                  label: { type: 'string' },
                  value: { type: 'string' }
                },
                required: ['id', 'type', 'label', 'value']
              },
              description: 'Array of prompt blocks to build from'
            }
          },
          required: ['blocks']
        }
      },
      {
        name: 'inject_prompt',
        description: 'Inject additional text into an existing prompt',
        inputSchema: {
          type: 'object',
          properties: {
            base: {
              type: 'string',
              description: 'The base prompt text'
            },
            injection: {
              type: 'string',
              description: 'The text to inject'
            },
            mode: {
              type: 'string',
              enum: [...MODES],
              description: 'How to inject the text (prepend, append, or replace)',
              default: 'append'
            }
          },
          required: ['base', 'injection']
        }
      },
      {
        name: 'save_prompt',
        description: 'Save a prompt (array of blocks) with a unique identifier',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the prompt'
            },
            blocks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string', enum: [...BLOCK_TYPES] },
                  label: { type: 'string' },
                  value: { type: 'string' }
                },
                required: ['id', 'type', 'label', 'value']
              },
              description: 'Array of prompt blocks to save'
            }
          },
          required: ['id', 'blocks']
        }
      },
      {
        name: 'load_prompt',
        description: 'Load a saved prompt by its identifier',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier of the prompt to load'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'list_prompts',
        description: 'List all saved prompt identifiers',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'delete_prompt',
        description: 'Delete a saved prompt by its identifier',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier of the prompt to delete'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'get_block_types',
        description: 'Get all available prompt block types',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'get_inject_modes',
        description: 'Get all available injection modes',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    ];
  }

  /**
   * Initialize MCP resources for prompt access
   */
  private initializeResources(): MCPResource[] {
    return [
      {
        uri: 'prompt://saved',
        name: 'Saved Prompts',
        description: 'Access to all saved prompts',
        mimeType: 'application/json'
      },
      {
        uri: 'prompt://templates',
        name: 'Prompt Templates',
        description: 'Pre-built prompt templates',
        mimeType: 'application/json'
      }
    ];
  }

  /**
   * Handle MCP tool calls
   */
  async handleToolCall(name: string, arguments_: any): Promise<any> {
    switch (name) {
      case 'create_prompt_block':
        return this.createPromptBlock(arguments_.type, arguments_.label, arguments_.value);
      
      case 'build_prompt':
        return this.buildPrompt(arguments_.blocks);
      
      case 'inject_prompt':
        return this.injectPrompt(arguments_.base, arguments_.injection, arguments_.mode);
      
      case 'save_prompt':
        await this.storage.save(arguments_.id, arguments_.blocks);
        return { success: true, message: `Prompt '${arguments_.id}' saved successfully` };
      
      case 'load_prompt':
        const blocks = await this.storage.load(arguments_.id);
        return { blocks };
      
      case 'list_prompts':
        const ids = await this.storage.list();
        return { prompts: ids };
      
      case 'delete_prompt':
        await this.storage.delete(arguments_.id);
        return { success: true, message: `Prompt '${arguments_.id}' deleted successfully` };
      
      case 'get_block_types':
        return { blockTypes: BLOCK_TYPES };
      
      case 'get_inject_modes':
        return { injectModes: MODES };
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Create a new prompt block
   */
  private createPromptBlock(type: BlockType, label: string, value: string): PromptBlock {
    return {
      id: this.generateId(),
      type,
      label,
      value
    };
  }

  /**
   * Build prompt from blocks
   */
  private buildPrompt(blocks: PromptBlock[]): { prompt: string } {
    const prompt = buildPrompt(blocks);
    return { prompt };
  }

  /**
   * Inject text into prompt
   */
  private injectPrompt(base: string, injection: string, mode: InjectMode = 'append'): { prompt: string } {
    const prompt = injectPrompt(base, injection, mode);
    return { prompt };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get server configuration
   */
  getConfig(): MCPServerConfig {
    return { ...this.config };
  }

  /**
   * Get available tools
   */
  getTools(): MCPTool[] {
    return [...this.tools];
  }

  /**
   * Get available resources
   */
  getResources(): MCPResource[] {
    return [...this.resources];
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    console.log(`Starting Prompt-or-Die MCP Server: ${this.config.name}`);
    console.log(`Transport: ${this.config.transport}`);
    console.log(`Available tools: ${this.tools.length}`);
    console.log(`Available resources: ${this.resources.length}`);
    
    // Implementation would depend on the transport type
    // This is a placeholder for the actual server startup logic
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    console.log(`Stopping Prompt-or-Die MCP Server: ${this.config.name}`);
  }
}

/**
 * Create a new MCP server instance
 */
export function createMCPServer(config: MCPServerConfig, storage?: PromptStorage): PromptOrDieMCPServer {
  return new PromptOrDieMCPServer(config, storage);
}

/**
 * Default MCP server configuration
 */
export const defaultMCPConfig: MCPServerConfig = {
  name: 'prompt-or-die-server',
  version: '0.1.0',
  description: 'MCP Server for prompt generation and management',
  transport: 'stdio',
  auth: {
    type: 'none'
  }
};

export { BLOCK_TYPES, MODES, buildPrompt, injectPrompt };