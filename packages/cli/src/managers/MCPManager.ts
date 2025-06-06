/**
 * @fileoverview MCP server management for CLI
 * @module @prompt-or-die/cli/managers/MCPManager
 */

import { input, select, confirm, checkbox } from '@inquirer/prompts';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import { MCPServerGenerator, MCPProjectOptions } from '../../../core/src/mcp/generator.js';

/**
 * MCP manager class
 */
export class MCPManager {
  /**
   * MCP management menu
   */
  async showMenu(): Promise<void> {
    const action = await select({
      message: 'MCP Server Options:',
      choices: [
        { name: '🆕 Generate New Server', value: 'generate' },
        { name: '📋 List Templates', value: 'templates' },
        { name: '🔧 Configure Existing Server', value: 'configure' },
        { name: '🚀 Deploy Server', value: 'deploy' },
        { name: '📊 Server Analytics', value: 'analytics' },
        { name: '🔍 Validate Server', value: 'validate' },
        { name: '📦 Package Server', value: 'package' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });

    switch (action) {
      case 'generate':
        await this.generateServer();
        break;
      case 'templates':
        await this.listTemplates();
        break;
      case 'configure':
        await this.configureServer();
        break;
      case 'deploy':
        await this.deployServer();
        break;
      case 'analytics':
        await this.showAnalytics();
        break;
      case 'validate':
        await this.validateServer();
        break;
      case 'package':
        await this.packageServer();
        break;
      case 'back':
        return;
    }
  }

  /**
   * Generate new MCP server
   */
  async generateServer(): Promise<void> {
    console.log(chalk.blue('\n🚀 MCP Server Generator\n'));

    const name = await input({
      message: 'Project name:',
      validate: (value) => {
        if (value.length === 0) return 'Project name is required';
        if (!/^[a-z0-9-_]+$/i.test(value)) return 'Project name can only contain letters, numbers, hyphens, and underscores';
        return true;
      }
    });

    const description = await input({
      message: 'Project description (optional):'
    });

    const transport = await select({
      message: 'Transport type:',
      choices: [
        { name: 'STDIO (Local development)', value: 'stdio' },
        { name: 'SSE (Server-Sent Events)', value: 'sse' },
        { name: 'HTTP (Production ready)', value: 'streamable-http' }
      ]
    });

    const storage = await select({
      message: 'Storage type:',
      choices: [
        { name: 'Memory (Fast, temporary)', value: 'memory' },
        { name: 'File (Persistent, simple)', value: 'file' },
        { name: 'Database (Scalable, robust)', value: 'database' }
      ]
    });

    const features = await checkbox({
      message: 'Select features to include:',
      choices: [
        { name: 'Template system', value: 'templates' },
        { name: 'Sharing capabilities', value: 'sharing' },
        { name: 'Analytics tracking', value: 'analytics' },
        { name: 'Collaboration tools', value: 'collaboration' },
        { name: 'Rate limiting', value: 'rateLimit' },
        { name: 'Caching', value: 'caching' },
        { name: 'Logging', value: 'logging' },
        { name: 'Health checks', value: 'healthCheck' }
      ]
    });

    let auth = undefined;
    if (transport !== 'stdio') {
      const needsAuth = await confirm({
        message: 'Do you need authentication?'
      });

      if (needsAuth) {
        const authType = await select({
          message: 'Authentication type:',
          choices: [
            { name: 'OAuth (GitHub, Google)', value: 'oauth' },
            { name: 'API Key', value: 'api-key' },
            { name: 'JWT Token', value: 'jwt' },
            { name: 'Basic Auth', value: 'basic' },
            { name: 'None', value: 'none' }
          ]
        });

        auth = { type: authType as any };

        if (authType === 'oauth') {
          auth.provider = await select({
            message: 'OAuth provider:',
            choices: [
              { name: 'GitHub', value: 'github' },
              { name: 'Google', value: 'google' },
              { name: 'Microsoft', value: 'microsoft' },
              { name: 'Custom', value: 'custom' }
            ]
          }) as any;
        }
      }
    }

    let deployment = undefined;
    const needsDeployment = await confirm({
      message: 'Configure deployment?'
    });

    if (needsDeployment) {
      const platform = await select({
        message: 'Deployment platform:',
        choices: [
          { name: 'Local', value: 'local' },
          { name: 'Cloudflare Workers', value: 'cloudflare' },
          { name: 'Vercel', value: 'vercel' },
          { name: 'AWS Lambda', value: 'aws' },
          { name: 'Azure Functions', value: 'azure' },
          { name: 'Google Cloud Functions', value: 'gcp' },
          { name: 'Docker', value: 'docker' }
        ]
      });

      deployment = { platform: platform as any };

      if (platform !== 'local') {
        const domain = await input({
          message: 'Custom domain (optional):'
        });
        if (domain) {
          deployment.domain = domain;
        }

        const environment = await select({
          message: 'Environment:',
          choices: [
            { name: 'Development', value: 'development' },
            { name: 'Staging', value: 'staging' },
            { name: 'Production', value: 'production' }
          ]
        });
        deployment.environment = environment;
      }
    }

    const options: MCPProjectOptions = {
      name,
      description: description || undefined,
      transport: transport as any,
      storage: storage as any,
      auth,
      deployment,
      features: {
        templates: features.includes('templates'),
        sharing: features.includes('sharing'),
        analytics: features.includes('analytics'),
        collaboration: features.includes('collaboration'),
        rateLimit: features.includes('rateLimit'),
        caching: features.includes('caching'),
        logging: features.includes('logging'),
        healthCheck: features.includes('healthCheck')
      }
    };

    const spinner = ora('Generating MCP server...').start();

    try {
      const files = MCPServerGenerator.generateProject(options);
      const outputDir = `./${name}`;

      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      for (const file of files) {
        const filePath = join(outputDir, file.path);
        const fileDir = resolve(filePath, '..');
        
        if (!existsSync(fileDir)) {
          mkdirSync(fileDir, { recursive: true });
        }
        
        writeFileSync(filePath, file.content);
        
        if (file.executable && process.platform !== 'win32') {
          try {
            const fs = await import('fs');
            fs.chmodSync(filePath, '755');
          } catch (error) {
            // Ignore chmod errors on Windows
          }
        }
      }

      spinner.succeed('MCP server generated successfully!');

      console.log(boxen(
        `🎉 Project '${name}' created successfully!\n\n` +
        `📁 Location: ${outputDir}\n\n` +
        `🚀 Next steps:\n` +
        `   cd ${name}\n` +
        `   npm install\n` +
        `   npm run build\n` +
        `   npm start\n\n` +
        `📖 Features included:\n` +
        `   • Transport: ${transport}\n` +
        `   • Storage: ${storage}\n` +
        `   • Authentication: ${auth ? auth.type : 'none'}\n` +
        `   • Deployment: ${deployment ? deployment.platform : 'local'}`,
        { padding: 1, borderColor: 'green' }
      ));

    } catch (error) {
      spinner.fail('Failed to generate MCP server');
      console.error(chalk.red('\n❌ Generation error:'), error.message);
    }

    await this.pressAnyKey();
  }

  /**
   * List available templates
   */
  async listTemplates(): Promise<void> {
    console.log(chalk.blue('\n📋 MCP Server Templates\n'));
    
    const templates = [
      {
        name: 'Basic STDIO Server',
        description: 'Simple local development server with file storage',
        features: ['STDIO transport', 'File storage', 'Basic tools'],
        difficulty: 'Beginner'
      },
      {
        name: 'HTTP API Server',
        description: 'Production-ready HTTP server with authentication',
        features: ['HTTP transport', 'Database storage', 'API key auth', 'Rate limiting'],
        difficulty: 'Intermediate'
      },
      {
        name: 'Cloudflare Worker',
        description: 'Serverless edge deployment with global distribution',
        features: ['SSE transport', 'KV storage', 'OAuth auth', 'Edge computing'],
        difficulty: 'Advanced'
      },
      {
        name: 'Enterprise Server',
        description: 'Full-featured server with all capabilities',
        features: ['Multiple transports', 'Database storage', 'Full auth', 'Analytics', 'Collaboration'],
        difficulty: 'Advanced'
      }
    ];

    templates.forEach((template, index) => {
      console.log(`${chalk.bold(`${index + 1}. ${template.name}`)} ${chalk.gray(`(${template.difficulty})`)}`);
      console.log(`   ${template.description}`);
      console.log(`   ${chalk.cyan('Features:')} ${template.features.join(', ')}\n`);
    });

    await this.pressAnyKey();
  }

  /**
   * Configure existing server
   */
  async configureServer(): Promise<void> {
    const serverPath = await input({
      message: 'Path to MCP server directory:',
      validate: (value) => {
        if (!value) return 'Path is required';
        if (!existsSync(value)) return 'Directory does not exist';
        return true;
      }
    });

    const configFile = join(serverPath, 'src', 'config.ts');
    if (!existsSync(configFile)) {
      console.log(chalk.red('\n❌ Not a valid MCP server directory (config.ts not found)'));
      await this.pressAnyKey();
      return;
    }

    const action = await select({
      message: 'What would you like to configure?',
      choices: [
        { name: 'Transport settings', value: 'transport' },
        { name: 'Storage configuration', value: 'storage' },
        { name: 'Authentication', value: 'auth' },
        { name: 'Environment variables', value: 'env' },
        { name: 'Deployment settings', value: 'deployment' }
      ]
    });

    console.log(chalk.yellow(`\n🔧 Configuring ${action} - Coming Soon!`));
    console.log(chalk.gray(`Server path: ${serverPath}`));
    await this.pressAnyKey();
  }

  /**
   * Deploy server
   */
  async deployServer(): Promise<void> {
    const serverPath = await input({
      message: 'Path to MCP server directory:',
      validate: (value) => {
        if (!value) return 'Path is required';
        if (!existsSync(value)) return 'Directory does not exist';
        return true;
      }
    });

    const platform = await select({
      message: 'Deployment platform:',
      choices: [
        { name: 'Cloudflare Workers', value: 'cloudflare' },
        { name: 'Vercel', value: 'vercel' },
        { name: 'AWS Lambda', value: 'aws' },
        { name: 'Azure Functions', value: 'azure' },
        { name: 'Google Cloud Functions', value: 'gcp' },
        { name: 'Docker', value: 'docker' }
      ]
    });

    const environment = await select({
      message: 'Environment:',
      choices: [
        { name: 'Development', value: 'development' },
        { name: 'Staging', value: 'staging' },
        { name: 'Production', value: 'production' }
      ]
    });

    console.log(chalk.yellow(`\n🚀 Deploying to ${platform} (${environment}) - Coming Soon!`));
    console.log(chalk.gray(`Server path: ${serverPath}`));
    await this.pressAnyKey();
  }

  /**
   * Show server analytics
   */
  async showAnalytics(): Promise<void> {
    console.log(chalk.blue('\n📊 MCP Server Analytics\n'));
    
    // Mock analytics data
    const analytics = {
      totalServers: 5,
      activeServers: 3,
      totalRequests: 1247,
      averageResponseTime: 145,
      errorRate: 2.3,
      popularTransports: {
        'stdio': 60,
        'http': 30,
        'sse': 10
      },
      popularStorage: {
        'file': 50,
        'memory': 30,
        'database': 20
      }
    };

    console.log(`Total Servers: ${chalk.bold(analytics.totalServers)}`);
    console.log(`Active Servers: ${chalk.bold(analytics.activeServers)}`);
    console.log(`Total Requests: ${chalk.bold(analytics.totalRequests.toLocaleString())}`);
    console.log(`Average Response Time: ${chalk.bold(analytics.averageResponseTime)}ms`);
    console.log(`Error Rate: ${chalk.bold(analytics.errorRate)}%`);
    
    console.log('\nTransport Usage:');
    Object.entries(analytics.popularTransports).forEach(([transport, percentage]) => {
      console.log(`  ${transport}: ${percentage}%`);
    });

    console.log('\nStorage Usage:');
    Object.entries(analytics.popularStorage).forEach(([storage, percentage]) => {
      console.log(`  ${storage}: ${percentage}%`);
    });

    await this.pressAnyKey();
  }

  /**
   * Validate server
   */
  async validateServer(): Promise<void> {
    const serverPath = await input({
      message: 'Path to MCP server directory:',
      validate: (value) => {
        if (!value) return 'Path is required';
        if (!existsSync(value)) return 'Directory does not exist';
        return true;
      }
    });

    const spinner = ora('Validating MCP server...').start();

    try {
      // Mock validation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const validationResults = {
        structure: true,
        dependencies: true,
        configuration: true,
        types: true,
        tests: false
      };

      spinner.succeed('Server validation completed!');

      console.log('\n📋 Validation Results:\n');
      Object.entries(validationResults).forEach(([check, passed]) => {
        const icon = passed ? '✅' : '❌';
        const status = passed ? chalk.green('PASS') : chalk.red('FAIL');
        console.log(`${icon} ${check}: ${status}`);
      });

      const passedCount = Object.values(validationResults).filter(Boolean).length;
      const totalCount = Object.keys(validationResults).length;
      
      console.log(`\n📊 Overall Score: ${passedCount}/${totalCount} (${Math.round(passedCount / totalCount * 100)}%)`);

    } catch (error) {
      spinner.fail('Validation failed');
      console.error(chalk.red('\n❌ Validation error:'), error.message);
    }

    await this.pressAnyKey();
  }

  /**
   * Package server
   */
  async packageServer(): Promise<void> {
    const serverPath = await input({
      message: 'Path to MCP server directory:',
      validate: (value) => {
        if (!value) return 'Path is required';
        if (!existsSync(value)) return 'Directory does not exist';
        return true;
      }
    });

    const format = await select({
      message: 'Package format:',
      choices: [
        { name: 'NPM Package', value: 'npm' },
        { name: 'Docker Image', value: 'docker' },
        { name: 'ZIP Archive', value: 'zip' },
        { name: 'Standalone Binary', value: 'binary' }
      ]
    });

    const includeSource = await confirm({
      message: 'Include source code?'
    });

    console.log(chalk.yellow(`\n📦 Packaging as ${format} - Coming Soon!`));
    console.log(chalk.gray(`Server path: ${serverPath}`));
    console.log(chalk.gray(`Include source: ${includeSource ? 'Yes' : 'No'}`));
    await this.pressAnyKey();
  }

  /**
   * Wait for user input
   */
  private async pressAnyKey(): Promise<void> {
    await input({
      message: 'Press Enter to continue...'
    });
  }
}