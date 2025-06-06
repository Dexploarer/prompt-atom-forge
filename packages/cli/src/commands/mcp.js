/**
 * @fileoverview MCP Server Generation Command
 * @module @prompt-or-die/cli/commands/mcp
 */

import { Command } from 'commander';
import { writeFileSync, mkdirSync, existsSync, chmodSync } from 'fs';
import { join, dirname } from 'path';



/**
 * Create MCP command
 */
export async function createMCPCommand() {
  // Load MCPServerGenerator dynamically
  let MCPServerGenerator;
  try {
    const coreModule = await import('../../../core/dist/index.cjs');
    MCPServerGenerator = coreModule.MCPServerGenerator;
  } catch (error) {
    console.error('Failed to load MCPServerGenerator:', error);
    throw error;
  }
  const mcp = new Command('mcp');
  mcp.description('Generate MCP (Model Context Protocol) servers');

  // Generate subcommand
  mcp
    .command('generate')
    .alias('gen')
    .description('Generate a new MCP server project')
    .option('-n, --name <name>', 'Project name')
    .option('-d, --dir <directory>', 'Output directory')
    .option('-t, --transport <transport>', 'Transport type (stdio|sse|streamable-http)', 'stdio')
    .option('-s, --storage <storage>', 'Storage type (memory|file|database)', 'memory')
    .option('--no-interactive', 'Skip interactive prompts')
    .action(async (options) => {
      try {
        const projectOptions = await gatherProjectOptions(options);
        const outputDir = options.dir || projectOptions.name;
        
        await generateMCPProject(projectOptions, outputDir, MCPServerGenerator);
        
        console.log(`\n✅ MCP server project '${projectOptions.name}' generated successfully!`);
        console.log(`\n📁 Project location: ${outputDir}`);
        console.log(`\n🚀 Next steps:`);
        console.log(`   cd ${outputDir}`);
        console.log(`   npm install`);
        console.log(`   npm run build`);
        console.log(`   npm start`);
        
      } catch (error) {
        console.error('❌ Failed to generate MCP server:', error.message);
        process.exit(1);
      }
    });

  // List templates subcommand
  mcp
    .command('templates')
    .description('List available MCP server templates')
    .action(() => {
      console.log('📋 Available MCP Server Templates:\n');
      
      const templates = [
        {
          name: 'Basic STDIO Server',
          description: 'Simple MCP server with STDIO transport for local use',
          transport: 'stdio',
          storage: 'memory'
        },
        {
          name: 'HTTP Server with File Storage',
          description: 'HTTP-based MCP server with persistent file storage',
          transport: 'sse',
          storage: 'file'
        },
        {
          name: 'Production Server with Database',
          description: 'Full-featured server with database storage and authentication',
          transport: 'streamable-http',
          storage: 'database'
        },
        {
          name: 'Cloudflare Worker',
          description: 'Serverless MCP server for Cloudflare Workers',
          transport: 'streamable-http',
          storage: 'memory'
        }
      ];
      
      templates.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name}`);
        console.log(`   ${template.description}`);
        console.log(`   Transport: ${template.transport}, Storage: ${template.storage}\n`);
      });
    });

  return mcp;
}



/**
 * Gather project options through interactive prompts or CLI options
 */
async function gatherProjectOptions(cliOptions) {
  const options = {
    name: '',
    transport: 'stdio',
    storage: 'memory'
  };

  if (cliOptions.interactive === false) {
    // Non-interactive mode - use CLI options
    if (!cliOptions.name) {
      throw new Error('Project name is required in non-interactive mode');
    }
    
    options.name = cliOptions.name;
    options.transport = cliOptions.transport || 'stdio';
    options.storage = cliOptions.storage || 'memory';
    
    return options;
  }

  // For now, use simple prompts without inquirer
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => {
    rl.question(prompt, resolve);
  });

  console.log('🎯 Let\'s create your MCP server!\n');

  // Project name
  if (!cliOptions.name) {
    options.name = await question('Project name (my-mcp-server): ') || 'my-mcp-server';
  } else {
    options.name = cliOptions.name;
  }

  // Description
  options.description = await question('Project description (optional): ') || `MCP Server for ${options.name}`;

  // Transport type
  console.log('\nTransport types:');
  console.log('1. stdio - For local MCP clients (recommended for development)');
  console.log('2. sse - For web-based MCP clients');
  console.log('3. streamable-http - For production web servers');
  const transportChoice = await question('Choose transport (1-3, default: 1): ') || '1';
  
  switch (transportChoice) {
    case '2': options.transport = 'sse'; break;
    case '3': options.transport = 'streamable-http'; break;
    default: options.transport = 'stdio'; break;
  }

  // Storage type
  console.log('\nStorage types:');
  console.log('1. memory - Fast, but data is lost on restart');
  console.log('2. file - Persistent file-based storage');
  console.log('3. database - SQLite database storage');
  const storageChoice = await question('Choose storage (1-3, default: 1): ') || '1';
  
  switch (storageChoice) {
    case '2': options.storage = 'file'; break;
    case '3': options.storage = 'database'; break;
    default: options.storage = 'memory'; break;
  }

  rl.close();
  return options;
}

/**
 * Generate MCP project files
 */
async function generateMCPProject(options, outputDir, MCPServerGenerator) {
  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Generate project files
  const files = MCPServerGenerator.generateProject(options);

  // Write files
  for (const file of files) {
    const filePath = join(outputDir, file.path);
    const fileDir = dirname(filePath);

    // Ensure directory exists
    if (!existsSync(fileDir)) {
      mkdirSync(fileDir, { recursive: true });
    }

    // Write file
    writeFileSync(filePath, file.content, 'utf8');

    // Make executable if needed
    if (file.executable) {
      try {
        chmodSync(filePath, 0o755);
      } catch (error) {
        // Ignore chmod errors on Windows
      }
    }

    console.log(`📄 Created ${file.path}`);
  }

  // Create data directory for file/database storage
  if (['file', 'database'].includes(options.storage)) {
    const dataDir = join(outputDir, 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
      console.log(`📁 Created data/`);
    }
  }
}