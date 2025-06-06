/**
 * @fileoverview Configuration management for CLI
 * @module @prompt-or-die/cli/managers/ConfigManager
 */

import { input, select, confirm } from '@inquirer/prompts';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import Table from 'cli-table3';
import { CLIConfig } from '../types.js';

/**
 * Configuration manager class
 */
export class ConfigManager {
  private configPath: string;
  private config: CLIConfig;

  constructor() {
    this.configPath = join(homedir(), '.prompt-or-die', 'config.json');
    this.config = this.loadConfig();
  }

  /**
   * Configuration management menu
   */
  async showMenu(): Promise<void> {
    const action = await select({
      message: 'Configuration Options:',
      choices: [
        { name: '⚙️ View Current Config', value: 'view' },
        { name: '✏️ Edit Settings', value: 'edit' },
        { name: '🔄 Reset to Defaults', value: 'reset' },
        { name: '📤 Export Config', value: 'export' },
        { name: '📥 Import Config', value: 'import' },
        { name: '🔧 Advanced Settings', value: 'advanced' },
        { name: '🎨 Theme Settings', value: 'theme' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });

    switch (action) {
      case 'view':
        await this.viewConfig();
        break;
      case 'edit':
        await this.editSettings();
        break;
      case 'reset':
        await this.resetConfig();
        break;
      case 'export':
        await this.exportConfig();
        break;
      case 'import':
        await this.importConfig();
        break;
      case 'advanced':
        await this.advancedSettings();
        break;
      case 'theme':
        await this.themeSettings();
        break;
      case 'back':
        return;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): CLIConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CLIConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  /**
   * Load configuration from file
   */
  private loadConfig(): CLIConfig {
    const defaultConfig: CLIConfig = {
      dataDir: join(homedir(), '.prompt-or-die', 'data'),
      apiKeys: {
        openai: '',
        anthropic: '',
        google: ''
      },
      defaultSettings: {
        theme: 'light',
        autoSave: true,
        verboseOutput: false
      },
      plugins: [],
      apiKey: '',
      defaultModel: 'gpt-4',
      maxTokens: 4000,
      temperature: 0.7,
      outputFormat: 'markdown',
      autoSave: true,
      backupCount: 5,
      theme: 'default',
      language: 'en',
      timezone: 'UTC',
      editor: 'nano',
      pager: 'less',
      analytics: {
        enabled: true,
        trackUsage: true,
        trackErrors: true,
        shareAnonymous: false
      },
      ui: {
        showIcons: true,
        showProgress: true,
        colorOutput: true,
        animateSpinners: true,
        compactMode: false,
        showTimestamps: true
      },
      performance: {
        cacheEnabled: true,
        cacheSize: 100,
        cacheTTL: 3600,
        parallelRequests: 3,
        requestTimeout: 30000
      },
      security: {
        encryptData: false,
        requireAuth: false,
        sessionTimeout: 3600,
        logSensitiveData: false
      },
      webAppUrl: 'http://localhost:3000'
    };

    if (!existsSync(this.configPath)) {
      this.ensureConfigDir();
      this.saveConfigToFile(defaultConfig);
      return defaultConfig;
    }

    try {
      const configData = readFileSync(this.configPath, 'utf8');
      const loadedConfig = JSON.parse(configData);
      return { ...defaultConfig, ...loadedConfig };
    } catch (error) {
      console.warn(chalk.yellow('⚠️ Failed to load config, using defaults'));
      return defaultConfig;
    }
  }

  /**
   * Save configuration to file
   */
  private saveConfig(): void {
    this.saveConfigToFile(this.config);
  }

  /**
   * Save configuration data to file
   */
  private saveConfigToFile(config: CLIConfig): void {
    this.ensureConfigDir();
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

  /**
   * View current configuration
   */
  async viewConfig(): Promise<void> {
    console.log(chalk.blue('\n⚙️ Current Configuration\n'));

    const table = new Table({
      head: ['Setting', 'Value'],
      colWidths: [30, 50]
    });

    // Basic settings
    table.push(
      ['API Key', this.config.apiKey ? '***' + this.config.apiKey.slice(-4) : 'Not set'],
      ['Default Model', this.config.defaultModel],
      ['Max Tokens', this.config.maxTokens.toString()],
      ['Temperature', this.config.temperature.toString()],
      ['Output Format', this.config.outputFormat],
      ['Auto Save', this.config.autoSave ? 'Enabled' : 'Disabled'],
      ['Backup Count', this.config.backupCount.toString()],
      ['Theme', this.config.theme],
      ['Language', this.config.language],
      ['Timezone', this.config.timezone],
      ['Editor', this.config.editor],
      ['Pager', this.config.pager]
    );

    console.log(table.toString());

    // Analytics settings
    console.log(chalk.blue('\n📊 Analytics Settings\n'));
    const analyticsTable = new Table({
      head: ['Setting', 'Value'],
      colWidths: [30, 20]
    });

    analyticsTable.push(
      ['Enabled', this.config.analytics.enabled ? 'Yes' : 'No'],
      ['Track Usage', this.config.analytics.trackUsage ? 'Yes' : 'No'],
      ['Track Errors', this.config.analytics.trackErrors ? 'Yes' : 'No'],
      ['Share Anonymous', this.config.analytics.shareAnonymous ? 'Yes' : 'No']
    );

    console.log(analyticsTable.toString());

    // UI settings
    console.log(chalk.blue('\n🎨 UI Settings\n'));
    const uiTable = new Table({
      head: ['Setting', 'Value'],
      colWidths: [30, 20]
    });

    uiTable.push(
      ['Show Icons', this.config.ui.showIcons ? 'Yes' : 'No'],
      ['Color Output', this.config.ui.colorOutput ? 'Yes' : 'No'],
      ['Animate Spinners', this.config.ui.animateSpinners ? 'Yes' : 'No'],
      ['Compact Mode', this.config.ui.compactMode ? 'Yes' : 'No'],
      ['Show Timestamps', this.config.ui.showTimestamps ? 'Yes' : 'No']
    );

    console.log(uiTable.toString());

    await this.pressAnyKey();
  }

  /**
   * Edit basic settings
   */
  async editSettings(): Promise<void> {
    const setting = await select({
      message: 'Which setting would you like to edit?',
      choices: [
        { name: '🔑 API Key', value: 'apiKey' },
        { name: '🤖 Default Model', value: 'defaultModel' },
        { name: '📏 Max Tokens', value: 'maxTokens' },
        { name: '🌡️ Temperature', value: 'temperature' },
        { name: '📄 Output Format', value: 'outputFormat' },
        { name: '💾 Auto Save', value: 'autoSave' },
        { name: '🔄 Backup Count', value: 'backupCount' },
        { name: '🌍 Language', value: 'language' },
        { name: '🕐 Timezone', value: 'timezone' },
        { name: '✏️ Editor', value: 'editor' },
        { name: '📖 Pager', value: 'pager' }
      ]
    });

    switch (setting) {
      case 'apiKey':
        const apiKey = await input({
          message: 'Enter API key:',
          default: this.config.apiKey
        });
        this.config.apiKey = apiKey;
        break;

      case 'defaultModel':
        this.config.defaultModel = await select({
          message: 'Select default model:',
          choices: [
            // OpenAI Models (2025)
            { name: 'GPT-4.1', value: 'gpt-4.1' },
            { name: 'GPT-4.1 mini', value: 'gpt-4.1-mini' },
            { name: 'GPT-4.1 nano', value: 'gpt-4.1-nano' },
            { name: 'GPT-4o', value: 'gpt-4o' },
            
            // Anthropic Claude Models (2025)
            { name: 'Claude Opus 4', value: 'claude-opus-4' },
            { name: 'Claude Sonnet 4', value: 'claude-sonnet-4' },
            { name: 'Claude 3.5 Sonnet', value: 'claude-3.5-sonnet' },
            { name: 'Claude 3 Haiku', value: 'claude-3-haiku' },
            
            // Google Gemini Models (2025)
            { name: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
            { name: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
            { name: 'Gemini 2.0 Flash-Lite', value: 'gemini-2.0-flash-lite' },
            { name: 'Gemini 2.0 Pro Experimental', value: 'gemini-2.0-pro-experimental' },
            
            // Kluster.ai Models (2025)
            { name: 'Qwen3-235B-A22B', value: 'qwen3-235b-a22b' },
            { name: 'Llama 4 Maverick', value: 'llama-4-maverick' },
            { name: 'Llama 4 Scout', value: 'llama-4-scout' },
            { name: 'DeepSeek-V3-0324', value: 'deepseek-v3-0324' },
            { name: 'DeepSeek-R1-0528', value: 'deepseek-r1-0528' },
            { name: 'DeepSeek-R1', value: 'deepseek-r1' },
            { name: 'Qwen2.5-VL-7B-Instruct', value: 'qwen2.5-vl-7b-instruct' },
            { name: 'Gemma 3', value: 'gemma-3' },
            { name: 'Llama 8B Instruct Turbo', value: 'llama-8b-instruct-turbo' },
            { name: 'Llama 70B Instruct Turbo', value: 'llama-70b-instruct-turbo' },
            { name: 'Mistral NeMo', value: 'mistral-nemo' }
          ],
          default: this.config.defaultModel
        });
        break;

      case 'maxTokens':
        const maxTokensInput = await input({
          message: 'Max tokens:',
          default: this.config.maxTokens.toString(),
          validate: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 100 || num > 32000) return 'Please enter a number between 100 and 32000';
            return true;
          }
        });
        this.config.maxTokens = parseInt(maxTokensInput);
        break;

      case 'temperature':
        const temperatureInput = await input({
          message: 'Temperature (0.0 - 2.0):',
          default: this.config.temperature.toString(),
          validate: (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 2) return 'Please enter a number between 0.0 and 2.0';
            return true;
          }
        });
        this.config.temperature = parseFloat(temperatureInput);
        break;

      case 'outputFormat':
        this.config.outputFormat = await select({
          message: 'Output format:',
          choices: [
            { name: 'Markdown', value: 'markdown' },
            { name: 'Plain Text', value: 'text' },
            { name: 'JSON', value: 'json' },
            { name: 'HTML', value: 'html' }
          ],
          default: this.config.outputFormat
        });
        break;

      case 'autoSave':
        this.config.autoSave = await confirm({
          message: 'Enable auto save?',
          default: this.config.autoSave
        });
        break;

      case 'backupCount':
        const backupCountInput = await input({
          message: 'Number of backups to keep:',
          default: this.config.backupCount.toString(),
          validate: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 0 || num > 50) return 'Please enter a number between 0 and 50';
            return true;
          }
        });
        this.config.backupCount = parseInt(backupCountInput);
        break;

      case 'language':
        this.config.language = await select({
          message: 'Language:',
          choices: [
            { name: 'English', value: 'en' },
            { name: 'Spanish', value: 'es' },
            { name: 'French', value: 'fr' },
            { name: 'German', value: 'de' },
            { name: 'Chinese', value: 'zh' },
            { name: 'Japanese', value: 'ja' }
          ],
          default: this.config.language
        });
        break;

      case 'timezone':
        const timezone = await input({
          message: 'Timezone (e.g., America/New_York):',
          default: this.config.timezone
        });
        this.config.timezone = timezone;
        break;

      case 'editor':
        this.config.editor = await select({
          message: 'Default editor:',
          choices: [
            { name: 'Nano', value: 'nano' },
            { name: 'Vim', value: 'vim' },
            { name: 'Emacs', value: 'emacs' },
            { name: 'VS Code', value: 'code' },
            { name: 'Notepad', value: 'notepad' }
          ],
          default: this.config.editor
        });
        break;

      case 'pager':
        this.config.pager = await select({
          message: 'Default pager:',
          choices: [
            { name: 'Less', value: 'less' },
            { name: 'More', value: 'more' },
            { name: 'Cat', value: 'cat' }
          ],
          default: this.config.pager
        });
        break;
    }

    this.saveConfig();
    console.log(chalk.green('\n✅ Setting updated successfully!'));
    await this.pressAnyKey();
  }

  /**
   * Reset configuration to defaults
   */
  async resetConfig(): Promise<void> {
    const confirmed = await confirm({
      message: 'Are you sure you want to reset all settings to defaults?'
    });

    if (confirmed) {
      const apiKey = this.config.apiKey; // Preserve API key
      this.config = this.loadConfig();
      this.config.apiKey = apiKey;
      this.saveConfig();
      console.log(chalk.green('\n✅ Configuration reset to defaults!'));
    } else {
      console.log(chalk.yellow('\n❌ Reset cancelled.'));
    }

    await this.pressAnyKey();
  }

  /**
   * Export configuration
   */
  async exportConfig(): Promise<void> {
    const filename = await input({
      message: 'Export filename:',
      default: `config-${new Date().toISOString().split('T')[0]}.json`
    });

    const includeApiKey = await confirm({
      message: 'Include API key in export? (Not recommended for sharing)'
    });

    try {
      const exportConfig = { ...this.config };
      if (!includeApiKey) {
        exportConfig.apiKey = '';
      }

      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        config: exportConfig
      };

      writeFileSync(filename, JSON.stringify(exportData, null, 2));
      console.log(chalk.green(`\n✅ Configuration exported to '${filename}'`));
    } catch (error) {
      console.error(chalk.red('\n❌ Export failed:'), error instanceof Error ? error.message : String(error));
    }

    await this.pressAnyKey();
  }

  /**
   * Import configuration
   */
  async importConfig(): Promise<void> {
    const filename = await input({
      message: 'Import filename:',
      validate: (value) => {
        if (!value) return 'Filename is required';
        if (!existsSync(value)) return 'File does not exist';
        return true;
      }
    });

    try {
      const data = JSON.parse(readFileSync(filename, 'utf8'));
      
      if (!data.config) {
        throw new Error('Invalid configuration file format');
      }

      const preserveApiKey = await confirm({
        message: 'Preserve current API key?'
      });

      const currentApiKey = this.config.apiKey;
      this.config = { ...this.config, ...data.config };
      
      if (preserveApiKey) {
        this.config.apiKey = currentApiKey;
      }

      this.saveConfig();
      console.log(chalk.green('\n✅ Configuration imported successfully!'));
    } catch (error) {
      console.error(chalk.red('\n❌ Import failed:'), error instanceof Error ? error.message : String(error));
    }

    await this.pressAnyKey();
  }

  /**
   * Advanced settings
   */
  async advancedSettings(): Promise<void> {
    const category = await select({
      message: 'Advanced settings category:',
      choices: [
        { name: '📊 Analytics', value: 'analytics' },
        { name: '🎨 UI Settings', value: 'ui' },
        { name: '⚡ Performance', value: 'performance' },
        { name: '🔒 Security', value: 'security' }
      ]
    });

    switch (category) {
      case 'analytics':
        await this.editAnalyticsSettings();
        break;
      case 'ui':
        await this.editUISettings();
        break;
      case 'performance':
        await this.editPerformanceSettings();
        break;
      case 'security':
        await this.editSecuritySettings();
        break;
    }
  }

  /**
   * Edit analytics settings
   */
  async editAnalyticsSettings(): Promise<void> {
    const setting = await select({
      message: 'Analytics setting to edit:',
      choices: [
        { name: 'Enable Analytics', value: 'enabled' },
        { name: 'Track Usage', value: 'trackUsage' },
        { name: 'Track Errors', value: 'trackErrors' },
        { name: 'Share Anonymous Data', value: 'shareAnonymous' }
      ]
    });

    switch (setting) {
      case 'enabled':
        this.config.analytics.enabled = await confirm({
          message: 'Enable analytics?',
          default: this.config.analytics.enabled
        });
        break;
      case 'trackUsage':
        this.config.analytics.trackUsage = await confirm({
          message: 'Track usage statistics?',
          default: this.config.analytics.trackUsage
        });
        break;
      case 'trackErrors':
        this.config.analytics.trackErrors = await confirm({
          message: 'Track error reports?',
          default: this.config.analytics.trackErrors
        });
        break;
      case 'shareAnonymous':
        this.config.analytics.shareAnonymous = await confirm({
          message: 'Share anonymous usage data?',
          default: this.config.analytics.shareAnonymous
        });
        break;
    }

    this.saveConfig();
    console.log(chalk.green('\n✅ Analytics setting updated!'));
    await this.pressAnyKey();
  }

  /**
   * Edit UI settings
   */
  async editUISettings(): Promise<void> {
    const setting = await select({
      message: 'UI setting to edit:',
      choices: [
        { name: 'Show Icons', value: 'showIcons' },
        { name: 'Color Output', value: 'colorOutput' },
        { name: 'Animate Spinners', value: 'animateSpinners' },
        { name: 'Compact Mode', value: 'compactMode' },
        { name: 'Show Timestamps', value: 'showTimestamps' }
      ]
    });

    switch (setting) {
      case 'showIcons':
        this.config.ui.showIcons = await confirm({
          message: 'Show icons in output?',
          default: this.config.ui.showIcons
        });
        break;
      case 'colorOutput':
        this.config.ui.colorOutput = await confirm({
          message: 'Enable colored output?',
          default: this.config.ui.colorOutput
        });
        break;
      case 'animateSpinners':
        this.config.ui.animateSpinners = await confirm({
          message: 'Animate loading spinners?',
          default: this.config.ui.animateSpinners
        });
        break;
      case 'compactMode':
        this.config.ui.compactMode = await confirm({
          message: 'Enable compact mode?',
          default: this.config.ui.compactMode
        });
        break;
      case 'showTimestamps':
        this.config.ui.showTimestamps = await confirm({
          message: 'Show timestamps?',
          default: this.config.ui.showTimestamps
        });
        break;
    }

    this.saveConfig();
    console.log(chalk.green('\n✅ UI setting updated!'));
    await this.pressAnyKey();
  }

  /**
   * Edit performance settings
   */
  async editPerformanceSettings(): Promise<void> {
    const setting = await select({
      message: 'Performance setting to edit:',
      choices: [
        { name: 'Cache Enabled', value: 'cacheEnabled' },
        { name: 'Cache Size', value: 'cacheSize' },
        { name: 'Cache TTL', value: 'cacheTTL' },
        { name: 'Parallel Requests', value: 'parallelRequests' },
        { name: 'Request Timeout', value: 'requestTimeout' }
      ]
    });

    switch (setting) {
      case 'cacheEnabled':
        this.config.performance.cacheEnabled = await confirm({
          message: 'Enable caching?',
          default: this.config.performance.cacheEnabled
        });
        break;
      case 'cacheSize':
        const cacheSizeInput = await input({
          message: 'Cache size (number of items):',
          default: this.config.performance.cacheSize.toString(),
          validate: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 10 || num > 1000) return 'Please enter a number between 10 and 1000';
            return true;
          }
        });
        this.config.performance.cacheSize = parseInt(cacheSizeInput);
        break;
      case 'cacheTTL':
        const cacheTTLInput = await input({
          message: 'Cache TTL (seconds):',
          default: this.config.performance.cacheTTL.toString(),
          validate: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 60 || num > 86400) return 'Please enter a number between 60 and 86400';
            return true;
          }
        });
        this.config.performance.cacheTTL = parseInt(cacheTTLInput);
        break;
      case 'parallelRequests':
        const parallelRequestsInput = await input({
          message: 'Max parallel requests:',
          default: this.config.performance.parallelRequests.toString(),
          validate: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 1 || num > 10) return 'Please enter a number between 1 and 10';
            return true;
          }
        });
        this.config.performance.parallelRequests = parseInt(parallelRequestsInput);
        break;
      case 'requestTimeout':
        const requestTimeoutInput = await input({
          message: 'Request timeout (milliseconds):',
          default: this.config.performance.requestTimeout.toString(),
          validate: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 5000 || num > 120000) return 'Please enter a number between 5000 and 120000';
            return true;
          }
        });
        this.config.performance.requestTimeout = parseInt(requestTimeoutInput);
        break;
    }

    this.saveConfig();
    console.log(chalk.green('\n✅ Performance setting updated!'));
    await this.pressAnyKey();
  }

  /**
   * Edit security settings
   */
  async editSecuritySettings(): Promise<void> {
    const setting = await select({
      message: 'Security setting to edit:',
      choices: [
        { name: 'Encrypt Data', value: 'encryptData' },
        { name: 'Require Auth', value: 'requireAuth' },
        { name: 'Session Timeout', value: 'sessionTimeout' },
        { name: 'Log Sensitive Data', value: 'logSensitiveData' }
      ]
    });

    switch (setting) {
      case 'encryptData':
        this.config.security.encryptData = await confirm({
          message: 'Encrypt stored data?',
          default: this.config.security.encryptData
        });
        break;
      case 'requireAuth':
        this.config.security.requireAuth = await confirm({
          message: 'Require authentication?',
          default: this.config.security.requireAuth
        });
        break;
      case 'sessionTimeout':
        const sessionTimeoutInput = await input({
          message: 'Session timeout (seconds):',
          default: this.config.security.sessionTimeout.toString(),
          validate: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 300 || num > 86400) return 'Please enter a number between 300 and 86400';
            return true;
          }
        });
        this.config.security.sessionTimeout = parseInt(sessionTimeoutInput);
        break;
      case 'logSensitiveData':
        this.config.security.logSensitiveData = await confirm({
          message: 'Log sensitive data? (Not recommended)',
          default: this.config.security.logSensitiveData
        });
        break;
    }

    this.saveConfig();
    console.log(chalk.green('\n✅ Security setting updated!'));
    await this.pressAnyKey();
  }

  /**
   * Theme settings
   */
  async themeSettings(): Promise<void> {
    this.config.theme = await select({
      message: 'Select theme:',
      choices: [
        { name: '🌟 Default', value: 'default' },
        { name: '🌙 Dark', value: 'dark' },
        { name: '☀️ Light', value: 'light' },
        { name: '🌈 Colorful', value: 'colorful' },
        { name: '💼 Professional', value: 'professional' },
        { name: '🎮 Gaming', value: 'gaming' },
        { name: '🌸 Minimal', value: 'minimal' }
      ],
      default: this.config.theme
    });

    this.saveConfig();
    console.log(chalk.green('\n✅ Theme updated successfully!'));
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