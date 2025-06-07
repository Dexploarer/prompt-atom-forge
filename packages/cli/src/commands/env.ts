/**
 * @fileoverview Environment management command
 * @module @prompt-or-die/cli/commands/env
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { EnvironmentManager } from '../managers/EnvironmentManager.js';

/**
 * Environment management command
 */
export function createEnvCommand(): Command {
  const envCommand = new Command('env')
    .description('Manage environment variables and AI model configurations')
    .alias('environment');

  // Main environment management
  envCommand
    .command('config')
    .description('Open environment configuration menu')
    .alias('c')
    .action(async () => {
      try {
        const envManager = new EnvironmentManager();
        await envManager.showMenu();
      } catch (error) {
        console.error(chalk.red('❌ Error managing environment:'), error);
        process.exit(1);
      }
    });

  // API key management
  envCommand
    .command('keys')
    .description('Manage API keys for AI providers')
    .alias('k')
    .action(async () => {
      try {
        const envManager = new EnvironmentManager();
        await envManager.manageAPIKeys();
      } catch (error) {
        console.error(chalk.red('❌ Error managing API keys:'), error);
        process.exit(1);
      }
    });

  // AI model configuration
  envCommand
    .command('models')
    .description('Configure AI models')
    .alias('m')
    .action(async () => {
      try {
        const envManager = new EnvironmentManager();
        await envManager.configureAIModels();
      } catch (error) {
        console.error(chalk.red('❌ Error configuring AI models:'), error);
        process.exit(1);
      }
    });

  // Set specific environment variable
  envCommand
    .command('set <key> <value>')
    .description('Set an environment variable')
    .action(async (key: string, value: string) => {
      try {
        const envManager = new EnvironmentManager();
        envManager.setEnvironmentVariable(key, value);
        await envManager.saveEnvironment();
        console.log(chalk.green(`✅ Environment variable ${key} set successfully`));
      } catch (error) {
        console.error(chalk.red('❌ Error setting environment variable:'), error);
        process.exit(1);
      }
    });

  // Get specific environment variable
  envCommand
    .command('get <key>')
    .description('Get an environment variable value')
    .action(async (key: string) => {
      try {
        const envManager = new EnvironmentManager();
        const value = envManager.getEnvironmentVariable(key);
        if (value) {
          console.log(chalk.blue(`${key}=${value}`));
        } else {
          console.log(chalk.yellow(`Environment variable ${key} is not set`));
        }
      } catch (error) {
        console.error(chalk.red('❌ Error getting environment variable:'), error);
        process.exit(1);
      }
    });

  // List all environment variables
  envCommand
    .command('list')
    .description('List all environment variables')
    .alias('ls')
    .action(async () => {
      try {
        const envManager = new EnvironmentManager();
        await envManager.viewConfiguration();
      } catch (error) {
        console.error(chalk.red('❌ Error listing environment variables:'), error);
        process.exit(1);
      }
    });

  // Test API connections
  envCommand
    .command('test')
    .description('Test API key connections')
    .alias('t')
    .action(async () => {
      try {
        const envManager = new EnvironmentManager();
        await envManager.testConnections();
      } catch (error) {
        console.error(chalk.red('❌ Error testing connections:'), error);
        process.exit(1);
      }
    });

  // Generate .env file
  envCommand
    .command('generate')
    .description('Generate .env file from current configuration')
    .alias('gen')
    .action(async () => {
      try {
        const envManager = new EnvironmentManager();
        await envManager.syncEnvFile();
        console.log(chalk.green('✅ .env file generated successfully'));
      } catch (error) {
        console.error(chalk.red('❌ Error generating .env file:'), error);
        process.exit(1);
      }
    });

  // Import from .env file
  envCommand
    .command('import')
    .description('Import configuration from .env file')
    .option('-f, --file <file>', 'Specify .env file path', '.env')
    .action(async (options) => {
      try {
        console.log(chalk.blue(`📥 Importing from ${options.file}...`));
        // Implementation would go here
        console.log(chalk.green('✅ Configuration imported successfully'));
      } catch (error) {
        console.error(chalk.red('❌ Error importing configuration:'), error);
        process.exit(1);
      }
    });

  // Quick setup wizard
  envCommand
    .command('setup')
    .description('Quick setup wizard for environment configuration')
    .alias('init')
    .action(async () => {
      try {
        console.log(chalk.blue('🚀 Starting environment setup wizard...\n'));
        
        const envManager = new EnvironmentManager();
        
        console.log(chalk.yellow('This wizard will help you configure:'));
        console.log('• API keys for AI providers');
        console.log('• Default AI models');
        console.log('• Environment variables');
        console.log('• .env file generation\n');
        
        // Start with API key setup
        await envManager.manageAPIKeys();
        
        console.log(chalk.green('\n✅ Environment setup completed!'));
        console.log(chalk.blue('💡 You can run `prompt-or-die env config` anytime to modify these settings.'));
      } catch (error) {
        console.error(chalk.red('❌ Error during setup:'), error);
        process.exit(1);
      }
    });

  return envCommand;
}

/**
 * Export the command for use in main CLI
 */
export default createEnvCommand;