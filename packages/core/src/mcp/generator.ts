/**
 * @fileoverview MCP Server Generator
 * @module @prompt-or-die/core/mcp/generator
 * Generates MCP server projects with prompt-or-die functionality
 */

import { MCPServerConfig } from './index';

/**
 * MCP Server project template options
 */
export interface MCPProjectOptions {
  name: string;
  description?: string;
  transport: 'stdio' | 'sse' | 'streamable-http';
  storage: 'memory' | 'file' | 'database';
  auth?: {
    type: 'oauth' | 'api-key' | 'none';
    provider?: 'github' | 'google' | 'custom';
  };
  deployment?: {
    platform: 'local' | 'cloudflare' | 'vercel' | 'aws' | 'azure';
    domain?: string;
  };
  features?: {
    templates?: boolean;
    sharing?: boolean;
    analytics?: boolean;
    collaboration?: boolean;
  };
}

/**
 * Generated file structure
 */
export interface GeneratedFile {
  path: string;
  content: string;
  executable?: boolean;
}

/**
 * MCP Server project generator
 */
export class MCPServerGenerator {
  /**
   * Generate a complete MCP server project
   */
  static generateProject(options: MCPProjectOptions): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // Package.json
    files.push({
      path: 'package.json',
      content: this.generatePackageJson(options)
    });

    // Main server file
    files.push({
      path: 'src/server.ts',
      content: this.generateServerFile(options)
    });

    // Configuration file
    files.push({
      path: 'src/config.ts',
      content: this.generateConfigFile(options)
    });

    // Storage implementation
    files.push({
      path: 'src/storage.ts',
      content: this.generateStorageFile(options)
    });

    // TypeScript configuration
    files.push({
      path: 'tsconfig.json',
      content: this.generateTsConfig()
    });

    // README
    files.push({
      path: 'README.md',
      content: this.generateReadme(options)
    });

    // Environment file
    files.push({
      path: '.env.example',
      content: this.generateEnvExample(options)
    });

    // Build script
    files.push({
      path: 'build.js',
      content: this.generateBuildScript(options),
      executable: true
    });

    // Start script
    files.push({
      path: 'start.js',
      content: this.generateStartScript(options),
      executable: true
    });

    // Deployment files based on platform
    if (options.deployment?.platform === 'cloudflare') {
      files.push({
        path: 'wrangler.toml',
        content: this.generateWranglerConfig(options)
      });
    } else if (options.deployment?.platform === 'vercel') {
      files.push({
        path: 'vercel.json',
        content: this.generateVercelConfig(options)
      });
    }

    // Docker files for containerized deployment
    if (['aws', 'azure'].includes(options.deployment?.platform || '')) {
      files.push({
        path: 'Dockerfile',
        content: this.generateDockerfile(options)
      });
      files.push({
        path: '.dockerignore',
        content: this.generateDockerIgnore()
      });
    }

    return files;
  }

  /**
   * Generate package.json
   */
  private static generatePackageJson(options: MCPProjectOptions): string {
    const dependencies: Record<string, string> = {
      'prompt-or-die-core': '^1.0.2'
    };

    if (options.transport !== 'stdio') {
      dependencies['express'] = '^4.18.0';
      dependencies['cors'] = '^2.8.5';
    }

    if (options.storage === 'database') {
      dependencies['sqlite3'] = '^5.1.0';
    }

    if (options.auth?.type === 'oauth') {
      dependencies['jsonwebtoken'] = '^9.0.0';
    }

    const devDependencies: Record<string, string> = {
      'typescript': '^5.0.0',
      '@types/node': '^20.0.0',
      'tsx': '^4.0.0'
    };

    if (options.transport !== 'stdio') {
      devDependencies['@types/express'] = '^4.17.0';
      devDependencies['@types/cors'] = '^2.8.0';
    }

    return JSON.stringify({
      name: options.name,
      version: '1.0.0',
      description: options.description || `MCP Server for ${options.name}`,
      main: 'dist/server.js',
      type: 'module',
      scripts: {
        build: 'tsc',
        start: 'node dist/server.js',
        dev: 'tsx src/server.ts',
        'start:stdio': 'node dist/server.js --transport=stdio',
        'start:http': 'node dist/server.js --transport=http'
      },
      dependencies,
      devDependencies,
      keywords: ['mcp', 'model-context-protocol', 'prompt-or-die', 'ai', 'llm'],
      author: '',
      license: 'MIT'
    }, null, 2);
  }

  /**
   * Generate main server file
   */
  private static generateServerFile(options: MCPProjectOptions): string {
    return `import { createMCPServer, PromptOrDieMCPServer, createTransport } from 'prompt-or-die-core';
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
    
    console.error('\\u{1F680} ${options.name} MCP Server is running!');
    console.error('Transport:', config.server.transport);
    
    if (config.server.transport !== 'stdio') {
      console.error('Port:', config.server.port || 3000);
    }
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.error('\\nShutting down server...');
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
`;
  }

  /**
   * Generate configuration file
   */
  private static generateConfigFile(options: MCPProjectOptions): string {
    const serverConfig = {
      name: options.name,
      version: '1.0.0',
      description: options.description || `MCP Server for ${options.name}`,
      transport: options.transport,
      ...(options.transport !== 'stdio' && { port: 3000 }),
      ...(options.auth && { auth: options.auth })
    };

    const storageConfig = {
      type: options.storage,
      ...(options.storage === 'file' && { path: './data/prompts' }),
      ...(options.storage === 'database' && { 
        database: './data/prompts.db',
        table: 'prompts'
      })
    };

    return `import { MCPServerConfig } from 'prompt-or-die-core';

// Parse command line arguments
const args = process.argv.slice(2);
const transportArg = args.find(arg => arg.startsWith('--transport='));
const transport = transportArg ? transportArg.split('=')[1] as any : '${options.transport}';

export const config = {
  server: ${JSON.stringify(serverConfig, null, 2).replace('"transport":', 'transport:')} as MCPServerConfig,
  storage: ${JSON.stringify(storageConfig, null, 2)},
  features: ${JSON.stringify(options.features || {}, null, 2)}
};
`;
  }

  /**
   * Generate storage implementation
   */
  private static generateStorageFile(options: MCPProjectOptions): string {
    let imports = `import { PromptStorage, MemoryPromptStorage, FilePromptStorage, DatabasePromptStorage } from 'prompt-or-die-core';`;
    let createFunction = '';

    if (options.storage === 'database') {
      imports += `\nimport sqlite3 from 'sqlite3';\nimport { promisify } from 'util';`;
      
      createFunction = `
export class DatabasePromptStorage implements PromptStorage {
  private db: sqlite3.Database;
  
  constructor(dbPath: string, tableName: string = 'prompts') {
    this.db = new sqlite3.Database(dbPath);
    this.initializeTable(tableName);
  }
  
  private initializeTable(tableName: string): void {
    this.db.run(\`
      CREATE TABLE IF NOT EXISTS \${tableName} (
        id TEXT PRIMARY KEY,
        blocks TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    \`);
  }
  
  async save(id: string, blocks: PromptBlock[]): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    await run(
      'INSERT OR REPLACE INTO prompts (id, blocks, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [id, JSON.stringify(blocks)]
    );
  }
  
  async load(id: string): Promise<PromptBlock[]> {
    const get = promisify(this.db.get.bind(this.db));
    const row = await get('SELECT blocks FROM prompts WHERE id = ?', [id]) as any;
    
    if (!row) {
      throw new Error(\`Prompt with id '\${id}' not found\`);
    }
    
    return JSON.parse(row.blocks);
  }
  
  async list(): Promise<string[]> {
    const all = promisify(this.db.all.bind(this.db));
    const rows = await all('SELECT id FROM prompts ORDER BY updated_at DESC') as any[];
    return rows.map(row => row.id);
  }
  
  async delete(id: string): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    const result = await run('DELETE FROM prompts WHERE id = ?', [id]) as any;
    
    if (result.changes === 0) {
      throw new Error(\`Prompt with id '\${id}' not found\`);
    }
  }
}`;
    }

    return `${imports}

export function createStorage(config: any): PromptStorage {
  switch (config.type) {
    case 'memory':
      return new MemoryPromptStorage();
    case 'file':
      return new FilePromptStorage(config.path || './data/prompts');
    case 'database':
      return new DatabasePromptStorage(config.database || './data/prompts.db', config.table);
    default:
      throw new Error(\`Unsupported storage type: \${config.type}\`);
  }
}${createFunction}
`;
  }

  /**
   * Generate TypeScript configuration
   */
  private static generateTsConfig(): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'node',
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    }, null, 2);
  }

  /**
   * Generate README
   */
  private static generateReadme(options: MCPProjectOptions): string {
    return `# ${options.name}

${options.description || `MCP Server for ${options.name}`}

## Features

- ✨ Prompt generation and management
- 🔧 Multiple transport protocols (${options.transport})
- 💾 ${options.storage.charAt(0).toUpperCase() + options.storage.slice(1)} storage
${options.auth?.type !== 'none' ? `- 🔐 ${options.auth?.type?.toUpperCase()} authentication\n` : ''}- 🚀 Easy deployment to ${options.deployment?.platform || 'multiple platforms'}

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Usage

### Local Development

\`\`\`bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
\`\`\`

### Transport Modes

\`\`\`bash
# STDIO (for local MCP clients)
npm run start:stdio

# HTTP (for remote MCP clients)
npm run start:http
\`\`\`

## Configuration

Copy \`.env.example\` to \`.env\` and configure your settings:

\`\`\`bash
cp .env.example .env
\`\`\`

## Available Tools

This MCP server provides the following tools:

- **create_prompt_block**: Create a new prompt block
- **build_prompt**: Build a complete prompt from blocks
- **inject_prompt**: Inject text into existing prompts
- **save_prompt**: Save prompts for later use
- **load_prompt**: Load saved prompts
- **list_prompts**: List all saved prompts
- **delete_prompt**: Delete saved prompts
- **get_block_types**: Get available block types
- **get_inject_modes**: Get available injection modes

## Deployment

${this.generateDeploymentInstructions(options)}

## License

MIT
`;
  }

  /**
   * Generate deployment instructions
   */
  private static generateDeploymentInstructions(options: MCPProjectOptions): string {
    switch (options.deployment?.platform) {
      case 'cloudflare':
        return `### Cloudflare Workers

\`\`\`bash
npm install -g wrangler
wrangler login
wrangler deploy
\`\`\``;
      
      case 'vercel':
        return `### Vercel

\`\`\`bash
npm install -g vercel
vercel
\`\`\``;
      
      case 'aws':
        return `### AWS (Docker)

\`\`\`bash
docker build -t ${options.name} .
docker tag ${options.name} your-registry/${options.name}
docker push your-registry/${options.name}
\`\`\``;
      
      default:
        return `### Local Deployment

\`\`\`bash
npm run build
npm start
\`\`\``;
    }
  }

  /**
   * Generate environment example
   */
  private static generateEnvExample(options: MCPProjectOptions): string {
    let content = `# Server Configuration
SERVER_NAME=${options.name}
SERVER_PORT=3000

# Storage Configuration
STORAGE_TYPE=${options.storage}
`;

    if (options.storage === 'file') {
      content += 'STORAGE_PATH=./data/prompts\n';
    } else if (options.storage === 'database') {
      content += 'DATABASE_PATH=./data/prompts.db\n';
    }

    if (options.auth?.type === 'oauth') {
      content += `\n# OAuth Configuration
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
OAUTH_REDIRECT_URI=http://localhost:3000/oauth/callback
`;
    }

    if (options.auth?.type === 'api-key') {
      content += '\n# API Key Configuration\nAPI_KEY=your_api_key\n';
    }

    return content;
  }

  /**
   * Generate build script
   */
  private static generateBuildScript(options: MCPProjectOptions): string {
    return `#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

console.log('🔨 Building ${options.name} MCP Server...');

// Ensure dist directory exists
if (!existsSync('dist')) {
  mkdirSync('dist', { recursive: true });
}

// Build TypeScript
try {
  execSync('tsc', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
`;
  }

  /**
   * Generate start script
   */
  private static generateStartScript(options: MCPProjectOptions): string {
    return `#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';

// Check if built
if (!existsSync('dist/server.js')) {
  console.error('❌ Server not built. Run "npm run build" first.');
  process.exit(1);
}

console.log('🚀 Starting ${options.name} MCP Server...');

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
`;
  }

  /**
   * Generate Wrangler configuration for Cloudflare
   */
  private static generateWranglerConfig(options: MCPProjectOptions): string {
    return `name = "${options.name}"
main = "dist/server.js"
compatibility_date = "2024-01-01"

[env.production]
name = "${options.name}-prod"

[env.staging]
name = "${options.name}-staging"
`;
  }

  /**
   * Generate Vercel configuration
   */
  private static generateVercelConfig(options: MCPProjectOptions): string {
    return JSON.stringify({
      version: 2,
      name: options.name,
      builds: [
        {
          src: 'dist/server.js',
          use: '@vercel/node'
        }
      ],
      routes: [
        {
          src: '/(.*)',
          dest: 'dist/server.js'
        }
      ]
    }, null, 2);
  }

  /**
   * Generate Dockerfile
   */
  private static generateDockerfile(options: MCPProjectOptions): string {
    return `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/

# Create data directory
RUN mkdir -p ./data

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
`;
  }

  /**
   * Generate .dockerignore
   */
  private static generateDockerIgnore(): string {
    return `node_modules
src
*.ts
tsconfig.json
.env
.git
.gitignore
README.md
.dockerignore
Dockerfile
`;
  }
}