#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';

// Check if built
if (!existsSync('dist/server.js')) {
  console.error('❌ Server not built. Run "npm run build" first.');
  process.exit(1);
}

console.log('🚀 Starting corrected-mcp-server MCP Server...');

// Start server
const server = spawn('node', ['dist/server.js', ...process.argv.slice(2)], {
  stdio: 'inherit'
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  process.exit(code || 0);
});
