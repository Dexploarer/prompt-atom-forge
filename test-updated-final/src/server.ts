import { createRequire } from 'module';
import { createStorage } from './storage.js';
import { config } from './config.js';

const require = createRequire(import.meta.url);

async function main() {
    try {
    const { createMCPServer, createTransport } = require('prompt-or-die-core');
    
    // Create storage instance
    const storage = createStorage(config.storage);
    
    // Create MCP server
    const server = createMCPServer(config.server, storage);
    
    // Create transport
    const transport = createTransport(server);
    
    // Start server
    await server.start();
    await transport.start();
    
    console.log('MCP Server started successfully');
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Start the server
main();
