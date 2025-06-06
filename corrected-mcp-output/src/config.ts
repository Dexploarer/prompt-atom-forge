import { MCPServerConfig } from '@prompt-or-die/core';

// Parse command line arguments
const args = process.argv.slice(2);
const transportArg = args.find(arg => arg.startsWith('--transport='));
const transport = transportArg ? transportArg.split('=')[1] as any : 'stdio';

export const config = {
  server: {
  "name": "corrected-mcp-server",
  "version": "1.0.0",
  "description": "MCP Server for corrected-mcp-server",
  transport: "stdio"
} as MCPServerConfig,
  storage: {
  "type": "memory"
},
  features: {}
};
