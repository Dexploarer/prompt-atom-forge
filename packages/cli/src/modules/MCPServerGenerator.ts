/**
 * @fileoverview MCP Server Generator module
 * @module @prompt-or-die/cli/modules/MCPServerGenerator
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { MCPProjectOptions } from './types.js';
import ora from 'ora';
import chalk from 'chalk';
import boxen from 'boxen';
import { input, select, confirm, checkbox } from '@inquirer/prompts';

/**
 * MCP Server Generator class
 */
export class MCPServerGenerator {
  /**
   * Generate MCP server project files
   */
  static generateProject(options: MCPProjectOptions): {path: string; content: string; executable?: boolean}[] {
    // Implementation would be here - mock implementation for now
    return [
      { path: 'package.json', content: JSON.stringify({name: options.name, version: '1.0.0'}, null, 2) },
      { path: 'index.js', content: '// Generated MCP Server', executable: true }
    ];
  }

  /**
   * Interactive method to collect MCP server options and generate project
   */
  static async generateInteractive(): Promise<void> {
    console.log(chalk.blue('\n🚀 MCP Server Generator'));
    console.log(chalk.gray('Generate a new MCP server project\n'));
    
    const name = await input({
      message: 'Project name:',
      validate: (value) => value.length > 0 || 'Project name is required'
    });
    
    const description = await input({
      message: 'Project description (optional):'
    });
    
    const transport = await select({
      message: 'Transport layer:',
      choices: [
        { name: 'HTTP/REST API', value: 'http' },
        { name: 'WebSockets', value: 'websocket' },
        { name: 'Standard I/O', value: 'stdio' },
        { name: 'gRPC', value: 'grpc' }
      ]
    });
    
    const storage = await select({
      message: 'Storage backend:',
      choices: [
        { name: 'Local JSON files', value: 'json' },
        { name: 'SQLite', value: 'sqlite' },
        { name: 'MongoDB', value: 'mongodb' },
        { name: 'PostgreSQL', value: 'postgres' }
      ]
    });

    const features = await checkbox({
      message: 'Select features to include:',
      choices: [
        { name: 'Template system', value: 'templates' },
        { name: 'Sharing capabilities', value: 'sharing' },
        { name: 'Analytics tracking', value: 'analytics' },
        { name: 'Collaboration tools', value: 'collaboration' }
      ]
    });

    let auth: { type: string; provider?: string } | undefined = undefined;
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
            { name: 'None', value: 'none' }
          ]
        });

        auth = { type: authType, provider: undefined };

        if (authType === 'oauth') {
          auth.provider = await select({
            message: 'OAuth provider:',
            choices: [
              { name: 'GitHub', value: 'github' },
              { name: 'Google', value: 'google' },
              { name: 'Custom', value: 'custom' }
            ]
          });
        }
      }
    }

    let deployment: { platform: string; domain?: string } | undefined = undefined;
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
          { name: 'AWS', value: 'aws' },
          { name: 'Azure', value: 'azure' }
        ]
      });

      deployment = { platform, domain: undefined };

      if (platform !== 'local') {
        const domain = await input({
          message: 'Custom domain (optional):'
        });
        if (domain) {
          deployment.domain = domain;
        }
      }
    }

    const options: MCPProjectOptions = {
      name,
      description: description || undefined,
      transport,
      storage,
      auth,
      deployment,
      features: {
        templates: features.includes('templates'),
        sharing: features.includes('sharing'),
        analytics: features.includes('analytics'),
        collaboration: features.includes('collaboration')
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
          // Make file executable on Unix systems
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
        `   npm start`,
        { padding: 1, borderColor: 'green' }
      ));

    } catch (error) {
      spinner.fail('Failed to generate MCP server');
      console.error((error as Error).message);
    }

    // Wait for user to press Enter
    await input({
      message: 'Press Enter to continue...'
    });
  }
}
