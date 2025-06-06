/**
 * @fileoverview MCP Transport implementations
 * @module @prompt-or-die/core/mcp/transports
 * Provides transport layer implementations for MCP servers
 */

import { PromptOrDieMCPServer, MCPServerConfig } from './index';

/**
 * Base transport interface
 */
export interface MCPTransport {
  start(): Promise<void>;
  stop(): Promise<void>;
  send(message: any): Promise<void>;
}

/**
 * MCP Message types
 */
export interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number | null;
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * STDIO Transport for local MCP connections
 */
export class StdioTransport implements MCPTransport {
  private server: PromptOrDieMCPServer;
  private isRunning = false;

  constructor(server: PromptOrDieMCPServer) {
    this.server = server;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.error('MCP Server started on stdio');
    
    // Set up stdin/stdout communication
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', this.handleInput.bind(this));
    process.stdin.on('end', () => {
      this.stop();
    });
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.error('MCP Server stopped');
    process.exit(0);
  }

  async send(message: MCPMessage): Promise<void> {
    process.stdout.write(JSON.stringify(message) + '\n');
  }

  private async handleInput(data: string): Promise<void> {
    const lines = data.trim().split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const message: MCPMessage = JSON.parse(line);
        await this.handleMessage(message);
      } catch (error) {
        await this.send({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error',
            data: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }
  }

  private async handleMessage(message: MCPMessage): Promise<void> {
    try {
      if (message.method === 'initialize') {
        await this.handleInitialize(message);
      } else if (message.method === 'tools/list') {
        await this.handleToolsList(message);
      } else if (message.method === 'tools/call') {
        await this.handleToolCall(message);
      } else if (message.method === 'resources/list') {
        await this.handleResourcesList(message);
      } else {
        await this.send({
          jsonrpc: '2.0',
          id: message.id ?? null,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        });
      }
    } catch (error) {
      await this.send({
        jsonrpc: '2.0',
        id: message.id ?? null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  private async handleInitialize(message: MCPMessage): Promise<void> {
    const config = this.server.getConfig();
    await this.send({
      jsonrpc: '2.0',
      id: message.id ?? null,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {}
        },
        serverInfo: {
          name: config.name,
          version: config.version
        }
      }
    });
  }

  private async handleToolsList(message: MCPMessage): Promise<void> {
    const tools = this.server.getTools();
    await this.send({
      jsonrpc: '2.0',
      id: message.id ?? null,
      result: {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      }
    });
  }

  private async handleToolCall(message: MCPMessage): Promise<void> {
    const { name, arguments: args } = message.params;
    const result = await this.server.handleToolCall(name, args);
    
    await this.send({
      jsonrpc: '2.0',
      id: message.id ?? null,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      }
    });
  }

  private async handleResourcesList(message: MCPMessage): Promise<void> {
    const resources = this.server.getResources();
    await this.send({
      jsonrpc: '2.0',
      id: message.id ?? null,
      result: {
        resources: resources.map(resource => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType
        }))
      }
    });
  }
}

/**
 * HTTP + SSE Transport for remote MCP connections (legacy)
 */
export class HttpSseTransport implements MCPTransport {
  private server: PromptOrDieMCPServer;
  private config: MCPServerConfig;
  private httpServer?: any;
  private clients = new Set<any>();

  constructor(server: PromptOrDieMCPServer) {
    this.server = server;
    this.config = server.getConfig();
  }

  async start(): Promise<void> {
    let express, cors;
    try {
      express = await eval('import("express")');
      cors = await eval('import("cors")');
    } catch (error) {
      throw new Error('StreamableHttpTransport requires express and cors packages to be installed');
    }
    
    const app = express.default();
    app.use(cors.default());
    app.use(express.json());

    // SSE endpoint for receiving messages
    app.get('/mcp', (req: any, res: any) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      this.clients.add(res);
      
      req.on('close', () => {
        this.clients.delete(res);
      });
    });

    // POST endpoint for sending messages
    app.post('/messages', async (req: any, res: any) => {
      try {
        const message: MCPMessage = req.body;
        const response = await this.handleMessage(message);
        res.json(response);
      } catch (error) {
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body.id,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    });

    const port = this.config.port || 3000;
    this.httpServer = app.listen(port, () => {
      console.error(`MCP Server started on HTTP+SSE at port ${port}`);
    });
  }

  async stop(): Promise<void> {
    if (this.httpServer) {
      this.httpServer.close();
    }
    this.clients.clear();
  }

  async send(message: MCPMessage): Promise<void> {
    const data = `data: ${JSON.stringify(message)}\n\n`;
    for (const client of this.clients) {
      client.write(data);
    }
  }

  private async handleMessage(message: MCPMessage): Promise<MCPMessage> {
    // Similar to StdioTransport but returns response directly
    if (message.method === 'initialize') {
      const config = this.server.getConfig();
      return {
        jsonrpc: '2.0',
        id: message.id ?? null,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {}
          },
          serverInfo: {
            name: config.name,
            version: config.version
          }
        }
      };
    }
    
    if (message.method === 'tools/list') {
      const tools = this.server.getTools();
      return {
        jsonrpc: '2.0',
        id: message.id ?? null,
        result: {
          tools: tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
          }))
        }
      };
    }
    
    if (message.method === 'tools/call') {
      const { name, arguments: args } = message.params;
      const result = await this.server.handleToolCall(name, args);
      
      return {
        jsonrpc: '2.0',
        id: message.id ?? null,
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        }
      } as MCPMessage;
    }
    
    throw new Error('Method not found');
  }
}

/**
 * Streamable HTTP Transport for modern remote MCP connections
 */
export class StreamableHttpTransport implements MCPTransport {
  private server: PromptOrDieMCPServer;
  private config: MCPServerConfig;
  private httpServer?: any;

  constructor(server: PromptOrDieMCPServer) {
    this.server = server;
    this.config = server.getConfig();
  }

  async start(): Promise<void> {
    let express, cors;
    try {
      express = await eval('import("express")');
      cors = await eval('import("cors")');
    } catch (error) {
      throw new Error('StreamableHttpTransport requires express and cors packages to be installed');
    }
    
    const app = express.default();
    app.use(cors.default());
    app.use(express.json());

    // Single endpoint for streamable HTTP
    app.post('/mcp', async (req: any, res: any) => {
      try {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked',
          'Access-Control-Allow-Origin': '*'
        });

        const message: MCPMessage = req.body;
        const response = await this.handleMessage(message);
        
        // Stream the response
        res.write(JSON.stringify(response));
        res.end();
      } catch (error) {
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body.id,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    });

    // OAuth endpoints if authentication is enabled
    if (this.config.auth?.type === 'oauth') {
      this.setupOAuthEndpoints(app);
    }

    const port = this.config.port || 3000;
    this.httpServer = app.listen(port, () => {
      console.error(`MCP Server started on Streamable HTTP at port ${port}`);
    });
  }

  async stop(): Promise<void> {
    if (this.httpServer) {
      this.httpServer.close();
    }
  }

  async send(message: MCPMessage): Promise<void> {
    // For streamable HTTP, sending is handled in the request/response cycle
    console.log('Streamable HTTP send:', message);
  }

  private setupOAuthEndpoints(app: any): void {
    // OAuth authorization endpoint
    app.get('/oauth/authorize', (req: any, res: any) => {
      const { client_id, redirect_uri, state } = req.query;
      
      // Simple authorization page
      res.send(`
        <html>
          <body>
            <h2>Authorize Prompt-or-Die MCP Server</h2>
            <p>Grant access to your prompts?</p>
            <form method="post" action="/oauth/authorize">
              <input type="hidden" name="client_id" value="${client_id}" />
              <input type="hidden" name="redirect_uri" value="${redirect_uri}" />
              <input type="hidden" name="state" value="${state}" />
              <button type="submit" name="action" value="allow">Allow</button>
              <button type="submit" name="action" value="deny">Deny</button>
            </form>
          </body>
        </html>
      `);
    });

    // OAuth token endpoint
    app.post('/oauth/token', (req: any, res: any) => {
      const { grant_type, code, client_id, client_secret } = req.body;
      
      if (grant_type === 'authorization_code') {
        // Generate access token
        const accessToken = this.generateToken();
        
        res.json({
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: 3600
        });
      } else {
        res.status(400).json({
          error: 'unsupported_grant_type'
        });
      }
    });
  }

  private generateToken(): string {
    return `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private async handleMessage(message: MCPMessage): Promise<MCPMessage> {
    // Similar to other transports but optimized for streaming
    if (message.method === 'initialize') {
      const config = this.server.getConfig();
      return {
        jsonrpc: '2.0',
        id: message.id ?? null,
        result: {
          protocolVersion: '2025-03-26',
          capabilities: {
            tools: {},
            resources: {}
          },
          serverInfo: {
            name: config.name,
            version: config.version
          }
        }
      };
    }
    
    if (message.method === 'tools/list') {
      const tools = this.server.getTools();
      return {
        jsonrpc: '2.0',
        id: message.id ?? null,
        result: {
          tools: tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
          }))
        }
      };
    }
    
    if (message.method === 'tools/call') {
      const { name, arguments: args } = message.params;
      const result = await this.server.handleToolCall(name, args);
      
      return {
        jsonrpc: '2.0',
        id: message.id ?? null,
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        }
      } as MCPMessage;
    }
    
    throw new Error('Method not found');
  }
}

/**
 * Create transport based on configuration
 */
export function createTransport(server: PromptOrDieMCPServer): MCPTransport {
  const config = server.getConfig();
  
  switch (config.transport) {
    case 'stdio':
      return new StdioTransport(server);
    case 'sse':
      return new HttpSseTransport(server);
    case 'streamable-http':
      return new StreamableHttpTransport(server);
    default:
      throw new Error(`Unsupported transport: ${config.transport}`);
  }
}