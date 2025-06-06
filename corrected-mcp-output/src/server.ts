import { createMCPServer, PromptOrDieMCPServer, createTransport } from '@prompt-or-die/core';
import { createStorage } from './storage.js';
import { config } from './config.js';

async function main() {
  try {
    // Create storage instance
    const storage = createStorage(config.storage);
    
    // Create MCP server
    const server = createMCPServer(config.server, storage);
    
    // Create transport
    const transport = createTransport(server);
    
    // Start server
    await server.start();
    await transport.start();
    
    console.error('\u{1F680} corrected-mcp-server MCP Server is running!');
    console.error('Transport:', config.server.transport);
    
    if (config.server.transport !== 'stdio') {
      console.error('Port:', config.server.port || 3000);
    }
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.error('\nShutting down server...');
      await transport.stop();
      await server.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch(console.error);
