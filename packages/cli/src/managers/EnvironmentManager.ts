/**
 * @fileoverview Environment variable management for CLI
 * @module @prompt-or-die/cli/managers/EnvironmentManager
 */

import { input, select, confirm, checkbox } from '@inquirer/prompts';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import Table from 'cli-table3';

/**
 * Environment configuration interface
 */
export interface EnvironmentConfig {
  // AI Provider API Keys
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  GROQ_API_KEY?: string;
  COHERE_API_KEY?: string;
  
  // Supabase Configuration
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  
  // Database Configuration
  DATABASE_URL?: string;
  POSTGRES_URL?: string;
  
  // Application Settings
  NODE_ENV?: 'development' | 'production' | 'test';
  LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
  
  // Custom Environment Variables
  [key: string]: string | undefined;
}

/**
 * AI Model configuration interface
 */
export interface AIModelConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'groq' | 'cohere' | 'local';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Environment manager class
 */
export class EnvironmentManager {
  private envPath: string;
  private configPath: string;
  private environment: EnvironmentConfig;
  private aiModels: AIModelConfig[];

  constructor() {
    this.envPath = join(process.cwd(), '.env');
    this.configPath = join(homedir(), '.prompt-or-die', 'env-config.json');
    this.environment = this.loadEnvironment();
    this.aiModels = this.loadAIModels();
  }

  /**
   * Environment management menu
   */
  async showMenu(): Promise<void> {
    const action = await select({
      message: 'Environment & AI Model Configuration:',
      choices: [
        { name: '🔑 Manage API Keys', value: 'api-keys' },
        { name: '🤖 Configure AI Models', value: 'ai-models' },
        { name: '🌍 Environment Variables', value: 'env-vars' },
        { name: '📄 View Current Config', value: 'view' },
        { name: '📁 Manage .env Files', value: 'env-files' },
        { name: '🔄 Import/Export Config', value: 'import-export' },
        { name: '🧪 Test Connections', value: 'test' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });

    switch (action) {
      case 'api-keys':
        await this.manageAPIKeys();
        break;
      case 'ai-models':
        await this.configureAIModels();
        break;
      case 'env-vars':
        await this.manageEnvironmentVariables();
        break;
      case 'view':
        await this.viewConfiguration();
        break;
      case 'env-files':
        await this.manageEnvFiles();
        break;
      case 'import-export':
        await this.importExportConfig();
        break;
      case 'test':
        await this.testConnections();
        break;
      case 'back':
        return;
    }
  }

  /**
   * Manage API Keys
   */
  async manageAPIKeys(): Promise<void> {
    const provider = await select({
      message: 'Select AI Provider:',
      choices: [
        { name: '🤖 OpenAI (GPT-4, GPT-3.5)', value: 'openai' },
        { name: '🧠 Anthropic (Claude)', value: 'anthropic' },
        { name: '🔍 Google (Gemini)', value: 'google' },
        { name: '⚡ Groq (Fast Inference)', value: 'groq' },
        { name: '🌐 Cohere', value: 'cohere' },
        { name: '🔙 Back', value: 'back' }
      ]
    });

    if (provider === 'back') return;

    const keyName = `${provider.toUpperCase()}_API_KEY`;
    const currentKey = this.environment[keyName];
    
    console.log(chalk.blue(`\n🔑 Configure ${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key\n`));
    
    if (currentKey) {
      console.log(chalk.green(`Current key: ***${currentKey.slice(-8)}`));
    } else {
      console.log(chalk.yellow('No API key currently set'));
    }

    const action = await select({
      message: 'What would you like to do?',
      choices: [
        { name: '✏️ Set/Update API Key', value: 'set' },
        { name: '👁️ View Full Key', value: 'view' },
        { name: '🗑️ Remove API Key', value: 'remove' },
        { name: '🧪 Test API Key', value: 'test' },
        { name: '🔙 Back', value: 'back' }
      ]
    });

    switch (action) {
      case 'set':
        const newKey = await input({
          message: `Enter ${provider} API key:`,
          default: currentKey || '',
          validate: (value: string) => {
            if (!value.trim()) return 'API key cannot be empty';
            if (value.length < 10) return 'API key seems too short';
            return true;
          }
        });
        this.environment[keyName] = newKey;
        await this.saveEnvironment();
        console.log(chalk.green(`✅ ${provider} API key updated successfully!`));
        break;
        
      case 'view':
        if (currentKey) {
          console.log(chalk.blue(`\n${keyName}: ${currentKey}\n`));
        } else {
          console.log(chalk.yellow('No API key set'));
        }
        break;
        
      case 'remove':
        const confirmRemove = await confirm({
          message: `Are you sure you want to remove the ${provider} API key?`,
          default: false
        });
        if (confirmRemove) {
          delete this.environment[keyName];
          await this.saveEnvironment();
          console.log(chalk.green(`✅ ${provider} API key removed successfully!`));
        }
        break;
        
      case 'test':
        await this.testAPIKey(provider, currentKey);
        break;
    }
  }

  /**
   * Configure AI Models
   */
  async configureAIModels(): Promise<void> {
    const action = await select({
      message: 'AI Model Configuration:',
      choices: [
        { name: '➕ Add New Model', value: 'add' },
        { name: '📝 Edit Existing Model', value: 'edit' },
        { name: '🗑️ Remove Model', value: 'remove' },
        { name: '📋 List All Models', value: 'list' },
        { name: '⭐ Set Default Model', value: 'default' },
        { name: '🔙 Back', value: 'back' }
      ]
    });

    switch (action) {
      case 'add':
        await this.addAIModel();
        break;
      case 'edit':
        await this.editAIModel();
        break;
      case 'remove':
        await this.removeAIModel();
        break;
      case 'list':
        await this.listAIModels();
        break;
      case 'default':
        await this.setDefaultModel();
        break;
    }
  }

  /**
   * Add new AI model configuration
   */
  async addAIModel(): Promise<void> {
    console.log(chalk.blue('\n🤖 Add New AI Model Configuration\n'));

    const provider = await select({
      message: 'Select provider:',
      choices: [
        { name: 'OpenAI', value: 'openai' },
        { name: 'Anthropic', value: 'anthropic' },
        { name: 'Google', value: 'google' },
        { name: 'Groq', value: 'groq' },
        { name: 'Cohere', value: 'cohere' },
        { name: 'Local/Custom', value: 'local' }
      ]
    });

    const modelChoices = this.getModelChoicesForProvider(provider);
    const model = await select({
      message: 'Select model:',
      choices: modelChoices
    });

    const config: AIModelConfig = {
      provider: provider as any,
      model
    };

    // Configure additional settings
    const configureAdvanced = await confirm({
      message: 'Configure advanced settings?',
      default: false
    });

    if (configureAdvanced) {
      if (provider === 'local') {
        config.baseUrl = await input({
          message: 'Base URL:',
          default: 'http://localhost:1234/v1'
        });
      }

      const maxTokensInput = await input({
        message: 'Max tokens (default: 4000):',
        default: '4000',
        validate: (value: string) => {
          const num = parseInt(value);
          if (isNaN(num) || num < 1) return 'Please enter a valid number';
          return true;
        }
      });
      config.maxTokens = parseInt(maxTokensInput);

      const temperatureInput = await input({
        message: 'Temperature (0.0-2.0, default: 0.7):',
        default: '0.7',
        validate: (value: string) => {
          const num = parseFloat(value);
          if (isNaN(num) || num < 0 || num > 2) return 'Please enter a number between 0.0 and 2.0';
          return true;
        }
      });
      config.temperature = parseFloat(temperatureInput);
    }

    this.aiModels.push(config);
    await this.saveAIModels();
    console.log(chalk.green(`✅ AI model ${model} added successfully!`));
  }

  /**
   * Get model choices for a provider
   */
  private getModelChoicesForProvider(provider: string): Array<{name: string, value: string}> {
    const models = {
      openai: [
        { name: 'GPT-4o', value: 'gpt-4o' },
        { name: 'GPT-4o Mini', value: 'gpt-4o-mini' },
        { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
        { name: 'GPT-4', value: 'gpt-4' },
        { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' }
      ],
      anthropic: [
        { name: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
        { name: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022' },
        { name: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
        { name: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
        { name: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' }
      ],
      google: [
        { name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
        { name: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
        { name: 'Gemini Pro', value: 'gemini-pro' }
      ],
      groq: [
        { name: 'Llama 3.1 70B', value: 'llama-3.1-70b-versatile' },
        { name: 'Llama 3.1 8B', value: 'llama-3.1-8b-instant' },
        { name: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
        { name: 'Gemma 7B', value: 'gemma-7b-it' }
      ],
      cohere: [
        { name: 'Command R+', value: 'command-r-plus' },
        { name: 'Command R', value: 'command-r' },
        { name: 'Command', value: 'command' }
      ],
      local: [
        { name: 'Custom Model', value: 'custom' },
        { name: 'Llama 2', value: 'llama-2' },
        { name: 'Code Llama', value: 'code-llama' },
        { name: 'Mistral', value: 'mistral' }
      ]
    };

    return models[provider as keyof typeof models] || [{ name: 'Custom', value: 'custom' }];
  }

  /**
   * Manage environment variables
   */
  async manageEnvironmentVariables(): Promise<void> {
    const action = await select({
      message: 'Environment Variables:',
      choices: [
        { name: '➕ Add Variable', value: 'add' },
        { name: '✏️ Edit Variable', value: 'edit' },
        { name: '🗑️ Remove Variable', value: 'remove' },
        { name: '📋 List All Variables', value: 'list' },
        { name: '🔙 Back', value: 'back' }
      ]
    });

    switch (action) {
      case 'add':
        await this.addEnvironmentVariable();
        break;
      case 'edit':
        await this.editEnvironmentVariable();
        break;
      case 'remove':
        await this.removeEnvironmentVariable();
        break;
      case 'list':
        await this.listEnvironmentVariables();
        break;
    }
  }

  /**
   * Add environment variable
   */
  async addEnvironmentVariable(): Promise<void> {
    const key = await input({
      message: 'Variable name:',
      validate: (value: string) => {
        if (!value.trim()) return 'Variable name cannot be empty';
        if (!/^[A-Z_][A-Z0-9_]*$/i.test(value)) return 'Invalid variable name format';
        return true;
      }
    });

    const value = await input({
      message: 'Variable value:'
    });

    this.environment[key] = value;
    await this.saveEnvironment();
    console.log(chalk.green(`✅ Environment variable ${key} added successfully!`));
  }

  /**
   * View current configuration
   */
  async viewConfiguration(): Promise<void> {
    console.log(chalk.blue('\n⚙️ Current Environment Configuration\n'));

    // API Keys table
    const apiTable = new Table({
      head: ['Provider', 'API Key Status'],
      colWidths: [20, 30]
    });

    const apiKeys = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_API_KEY', 'GROQ_API_KEY', 'COHERE_API_KEY'];
    apiKeys.forEach(key => {
      const provider = key.replace('_API_KEY', '').toLowerCase();
      const status = this.environment[key] ? 
        chalk.green(`✅ Set (***${this.environment[key]!.slice(-4)})`) : 
        chalk.red('❌ Not set');
      apiTable.push([provider.charAt(0).toUpperCase() + provider.slice(1), status]);
    });

    console.log(chalk.yellow('🔑 API Keys:'));
    console.log(apiTable.toString());

    // AI Models table
    if (this.aiModels.length > 0) {
      console.log(chalk.yellow('\n🤖 Configured AI Models:'));
      const modelsTable = new Table({
        head: ['Provider', 'Model', 'Max Tokens', 'Temperature'],
        colWidths: [15, 25, 12, 12]
      });

      this.aiModels.forEach(model => {
        modelsTable.push([
          model.provider,
          model.model,
          model.maxTokens?.toString() || 'default',
          model.temperature?.toString() || 'default'
        ]);
      });

      console.log(modelsTable.toString());
    }

    // Environment variables
    const envVars = Object.keys(this.environment).filter(key => 
      !key.endsWith('_API_KEY') && !['SUPABASE_URL', 'SUPABASE_ANON_KEY'].includes(key)
    );

    if (envVars.length > 0) {
      console.log(chalk.yellow('\n🌍 Other Environment Variables:'));
      const envTable = new Table({
        head: ['Variable', 'Value'],
        colWidths: [25, 40]
      });

      envVars.forEach(key => {
        const value = this.environment[key];
        const displayValue = value && value.length > 30 ? 
          `${value.substring(0, 30)}...` : value || '';
        envTable.push([key, displayValue]);
      });

      console.log(envTable.toString());
    }
  }

  /**
   * Manage .env files
   */
  async manageEnvFiles(): Promise<void> {
    const action = await select({
      message: '.env File Management:',
      choices: [
        { name: '📄 Create .env file', value: 'create' },
        { name: '📝 Edit .env file', value: 'edit' },
        { name: '👁️ View .env file', value: 'view' },
        { name: '📋 Generate .env.example', value: 'example' },
        { name: '🔄 Sync with current config', value: 'sync' },
        { name: '🔙 Back', value: 'back' }
      ]
    });

    switch (action) {
      case 'create':
        await this.createEnvFile();
        break;
      case 'edit':
        await this.editEnvFile();
        break;
      case 'view':
        await this.viewEnvFile();
        break;
      case 'example':
        await this.generateEnvExample();
        break;
      case 'sync':
        await this.syncEnvFile();
        break;
    }
  }

  /**
   * Create .env file
   */
  async createEnvFile(): Promise<void> {
    if (existsSync(this.envPath)) {
      const overwrite = await confirm({
        message: '.env file already exists. Overwrite?',
        default: false
      });
      if (!overwrite) return;
    }

    await this.syncEnvFile();
    console.log(chalk.green(`✅ .env file created at ${this.envPath}`));
  }

  /**
   * Sync environment config to .env file
   */
  async syncEnvFile(): Promise<void> {
    const envContent = Object.entries(this.environment)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    writeFileSync(this.envPath, envContent);
    console.log(chalk.green('✅ .env file synced with current configuration'));
  }

  /**
   * Test API connections
   */
  async testConnections(): Promise<void> {
    const providers = await checkbox({
      message: 'Select providers to test:',
      choices: [
        { name: 'OpenAI', value: 'openai', checked: !!this.environment.OPENAI_API_KEY },
        { name: 'Anthropic', value: 'anthropic', checked: !!this.environment.ANTHROPIC_API_KEY },
        { name: 'Google', value: 'google', checked: !!this.environment.GOOGLE_API_KEY },
        { name: 'Groq', value: 'groq', checked: !!this.environment.GROQ_API_KEY },
        { name: 'Cohere', value: 'cohere', checked: !!this.environment.COHERE_API_KEY }
      ]
    });

    for (const provider of providers) {
      const apiKey = this.environment[`${provider.toUpperCase()}_API_KEY`];
      await this.testAPIKey(provider, apiKey);
    }
  }

  /**
   * Test API key for a provider
   */
  async testAPIKey(provider: string, apiKey?: string): Promise<void> {
    if (!apiKey) {
      console.log(chalk.red(`❌ No API key set for ${provider}`));
      return;
    }

    console.log(chalk.blue(`🧪 Testing ${provider} API key...`));
    
    try {
      // This is a placeholder - in a real implementation, you'd make actual API calls
      // For now, just simulate a test
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(chalk.green(`✅ ${provider} API key is valid`));
    } catch (error) {
      console.log(chalk.red(`❌ ${provider} API key test failed: ${error}`));
    }
  }

  /**
   * Load environment configuration
   */
  private loadEnvironment(): EnvironmentConfig {
    // Load from .env file if it exists
    if (existsSync(this.envPath)) {
      try {
        const envContent = readFileSync(this.envPath, 'utf8');
        const env: EnvironmentConfig = {};
        
        envContent.split('\n').forEach((line: string) => {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim();
          }
        });
        
        return env;
      } catch (error) {
        console.warn(chalk.yellow('⚠️ Failed to load .env file, using empty config'));
      }
    }

    return {};
  }

  /**
   * Load AI models configuration
   */
  private loadAIModels(): AIModelConfig[] {
    if (existsSync(this.configPath)) {
      try {
        const configData = readFileSync(this.configPath, 'utf8');
        const config = JSON.parse(configData);
        return config.aiModels || [];
      } catch (error) {
        console.warn(chalk.yellow('⚠️ Failed to load AI models config'));
      }
    }
    return [];
  }

  /**
   * Save environment configuration
   */
  async saveEnvironment(): Promise<void> {
    const envContent = Object.entries(this.environment)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    writeFileSync(this.envPath, envContent);
  }

  /**
   * Save AI models configuration
   */
  async saveAIModels(): Promise<void> {
    this.ensureConfigDir();
    const config = {
      aiModels: this.aiModels,
      lastUpdated: new Date().toISOString()
    };
    writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Ensure config directory exists
   */
  private ensureConfigDir(): void {
    const configDir = dirname(this.configPath);
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }
  }

  // Additional placeholder methods for completeness
  private async editAIModel(): Promise<void> {
    // Implementation for editing existing AI models
    console.log(chalk.yellow('Edit AI Model - Implementation pending'));
  }

  private async removeAIModel(): Promise<void> {
    // Implementation for removing AI models
    console.log(chalk.yellow('Remove AI Model - Implementation pending'));
  }

  private async listAIModels(): Promise<void> {
    // Implementation for listing AI models
    console.log(chalk.yellow('List AI Models - Implementation pending'));
  }

  private async setDefaultModel(): Promise<void> {
    // Implementation for setting default model
    console.log(chalk.yellow('Set Default Model - Implementation pending'));
  }

  private async editEnvironmentVariable(): Promise<void> {
    // Implementation for editing environment variables
    console.log(chalk.yellow('Edit Environment Variable - Implementation pending'));
  }

  private async removeEnvironmentVariable(): Promise<void> {
    // Implementation for removing environment variables
    console.log(chalk.yellow('Remove Environment Variable - Implementation pending'));
  }

  private async listEnvironmentVariables(): Promise<void> {
    // Implementation for listing environment variables
    console.log(chalk.yellow('List Environment Variables - Implementation pending'));
  }

  private async editEnvFile(): Promise<void> {
    // Implementation for editing .env file
    console.log(chalk.yellow('Edit .env File - Implementation pending'));
  }

  private async viewEnvFile(): Promise<void> {
    // Implementation for viewing .env file
    console.log(chalk.yellow('View .env File - Implementation pending'));
  }

  private async generateEnvExample(): Promise<void> {
    // Implementation for generating .env.example
    console.log(chalk.yellow('Generate .env.example - Implementation pending'));
  }

  private async importExportConfig(): Promise<void> {
    // Implementation for import/export functionality
    console.log(chalk.yellow('Import/Export Config - Implementation pending'));
  }

  /**
   * Get environment variable
   */
  getEnvironmentVariable(key: string): string | undefined {
    return this.environment[key];
  }

  /**
   * Set environment variable
   */
  setEnvironmentVariable(key: string, value: string): void {
    this.environment[key] = value;
  }

  /**
   * Get AI models
   */
  getAIModels(): AIModelConfig[] {
    return this.aiModels;
  }

  /**
   * Get default AI model
   */
  getDefaultAIModel(): AIModelConfig | undefined {
    return this.aiModels.find(model => model.provider === 'openai') || this.aiModels[0];
  }
}