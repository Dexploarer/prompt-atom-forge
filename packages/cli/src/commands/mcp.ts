/**
 * @fileoverview MCP Server Generation Command
 * @module @prompt-or-die/cli/commands/mcp
 */

import { Command } from 'commander';
import { MCPServerGenerator, MCPProjectOptions } from 'prompt-or-die-core';
import { writeFileSync, mkdirSync, existsSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { input, select, confirm, checkbox } from '@inquirer/prompts';

/**
 * Create MCP command
 */
export function createMCPCommand(): Command {
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
        
        await generateMCPProject(projectOptions, outputDir);
        
        console.log(`\n✅ MCP server project '${projectOptions.name}' generated successfully!`);
        console.log(`\n📁 Project location: ${outputDir}`);
        console.log(`\n🚀 Next steps:`);
        console.log(`   cd ${outputDir}`);
        console.log(`   npm install`);
        console.log(`   npm run build`);
        console.log(`   npm start`);
        
      } catch (error) {
        console.error('❌ Failed to generate MCP server:', error instanceof Error ? error.message : String(error));
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
async function gatherProjectOptions(cliOptions: any): Promise<MCPProjectOptions> {
  const options: Partial<MCPProjectOptions> & { name: string; transport: MCPProjectOptions['transport']; storage: MCPProjectOptions['storage'] } = {
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
    
    return options as MCPProjectOptions;
  }

  // Interactive mode
  console.log('🎯 Let\'s create your MCP server!\n');

  // Project name
  options.name = cliOptions.name || await input({
    message: 'What is your project name?',
    default: 'my-mcp-server',
    validate: (value) => {
      if (!value.trim()) return 'Project name is required';
      if (!/^[a-z0-9-]+$/.test(value)) {
        return 'Project name must contain only lowercase letters, numbers, and hyphens';
      }
      return true;
    }
  });

  // Description
  options.description = await input({
    message: 'Project description (optional):',
    default: `MCP Server for ${options.name}`
  });

  // Transport type
  options.transport = await select({
    message: 'Choose transport type:',
    choices: [
      {
        name: 'STDIO - For local MCP clients (recommended for development)',
        value: 'stdio'
      },
      {
        name: 'Server-Sent Events - For web-based MCP clients',
        value: 'sse'
      },
      {
        name: 'Streamable HTTP - For production web servers',
        value: 'streamable-http'
      }
    ],
    default: 'stdio'
  });

  // Storage type
  options.storage = await select({
    message: 'Choose storage type:',
    choices: [
      {
        name: 'Memory - Fast, but data is lost on restart',
        value: 'memory'
      },
      {
        name: 'File - Persistent file-based storage',
        value: 'file'
      },
      {
        name: 'Database - SQLite database storage',
        value: 'database'
      }
    ],
    default: 'memory'
  });

  // Authentication (only for HTTP transports)
  if (options.transport !== 'stdio') {
    const needsAuth = await confirm({
      message: 'Do you need authentication?',
      default: false
    });

    if (needsAuth) {
      const authType = await select({
        message: 'Choose authentication type:',
        choices: [
          { name: 'OAuth (GitHub, Google, etc.)', value: 'oauth' },
          { name: 'API Key', value: 'api-key' },
          { name: 'None', value: 'none' }
        ],
        default: 'oauth'
      });

      options.auth = { type: authType as 'oauth' | 'api-key' | 'none' };

      if (authType === 'oauth') {
        options.auth.provider = await select({
          message: 'Choose OAuth provider:',
          choices: [
            { name: 'GitHub', value: 'github' },
            { name: 'Google', value: 'google' },
            { name: 'Custom', value: 'custom' }
          ],
          default: 'github'
        });
      }
    }
  }

  // Deployment platform
  const needsDeployment = await confirm({
    message: 'Do you plan to deploy this server?',
    default: false
  });

  if (needsDeployment) {
    const platform = await select({
      message: 'Choose deployment platform:',
      choices: [
        { name: 'Local (development only)', value: 'local' },
        { name: 'Cloudflare Workers', value: 'cloudflare' },
        { name: 'Vercel', value: 'vercel' },
        { name: 'AWS (Docker)', value: 'aws' },
        { name: 'Azure (Docker)', value: 'azure' }
      ],
      default: 'local'
    });

    options.deployment = { platform: platform as 'local' | 'cloudflare' | 'vercel' | 'aws' | 'azure' };

    if (['cloudflare', 'vercel'].includes(platform)) {
      const domain = await input({
        message: 'Custom domain (optional):',
        validate: (value) => {
          if (value && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(value)) {
            return 'Please enter a valid domain name';
          }
          return true;
        }
      });
      
      if (domain && options.deployment) {
        options.deployment.domain = domain;
      }
    }
  }

  // Features
  const features = await checkbox({
    message: 'Select additional features:',
    choices: [
      { name: 'Prompt templates', value: 'templates' },
      { name: 'Prompt sharing', value: 'sharing' },
      { name: 'Usage analytics', value: 'analytics' },
      { name: 'Collaboration tools', value: 'collaboration' }
    ]
  });

  if (features.length > 0) {
    options.features = {};
    features.forEach(feature => {
      if (feature === 'templates' || feature === 'sharing' || feature === 'analytics' || feature === 'collaboration') {
        options.features![feature] = true;
      }
    });
  }

  return options as MCPProjectOptions;
}

/**
 * Generate MCP project files
 */
async function generateMCPProject(options: MCPProjectOptions, outputDir: string): Promise<void> {
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