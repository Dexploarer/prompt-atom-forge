#!/usr/bin/env node
/**
 * @fileoverview Command-line interface for Prompt or Die SDK
 * @module @prompt-or-die/cli/cli
 */

const minimist = require('minimist');
const chalk = require('chalk').default || require('chalk');
const figlet = require('figlet');
const boxen = require('boxen').default || require('boxen');
const { CharacterManager } = require('./managers/CharacterManager');
const { EmotionManager } = require('./managers/EmotionManager');
const { ChainManager } = require('./managers/ChainManager');
const { AuthManager } = require('./managers/AuthManager');
const { ConfigManager } = require('./managers/ConfigManager');
const { ContactManager } = require('./managers/ContactManager');
const { MCPManager } = require('./managers/MCPManager');
const { EnvironmentManager } = require('./managers/EnvironmentManager');
const { fileURLToPath } = require('url');
const path = require('path');

// Note: These modules use ES6 exports and will be imported dynamically
// const { PromptBuilder } = require('./modules/PromptBuilder');
// const { AnalyticsHelper } = require('./modules/AnalyticsHelper');
// const { ImportExportManager } = require('./modules/ImportExportManager');

/**
 * CLI class for command-line argument parsing
 */
export class CLI {
  private characterManager: typeof CharacterManager;
  private emotionManager: typeof EmotionManager;
  private chainManager: typeof ChainManager;
  private environmentManager: typeof EnvironmentManager;
  private mcpManager: typeof MCPManager;
  private configManager: typeof ConfigManager;
  private contactManager: typeof ContactManager;
  private authManager: typeof AuthManager;
  private promptBuilder: any;
  private analyticsHelper: any;
  private importExportManager: any;
  

  constructor() {
    // Initialize config and data directory
    this.configManager = new ConfigManager();
    const dataDir = this.configManager.getConfig().dataDir || process.env.HOME + '/.prompt-or-die';
    
    // Initialize managers
    this.characterManager = new CharacterManager(dataDir);
    this.emotionManager = new EmotionManager(dataDir);
    this.chainManager = new ChainManager(dataDir);
    this.mcpManager = new MCPManager();
    this.contactManager = new ContactManager(dataDir);
    this.authManager = new AuthManager(dataDir, this.configManager.getConfig());
    this.environmentManager = new EnvironmentManager(dataDir);
    
    // Module helpers will be initialized dynamically when needed
    this.promptBuilder = null;
    this.analyticsHelper = null;
    this.importExportManager = null;
  }

  /**
   * Initialize ES6 modules dynamically
   */
  private async initializeModules(): Promise<void> {
    if (!this.promptBuilder) {
      const { PromptBuilder } = await import('./modules/PromptBuilder.js');
      this.promptBuilder = new PromptBuilder(this.chainManager);
    }
    if (!this.analyticsHelper) {
      const { AnalyticsHelper } = await import('./modules/AnalyticsHelper.js');
      this.analyticsHelper = new AnalyticsHelper(this.chainManager, this.characterManager, this.emotionManager);
    }
    if (!this.importExportManager) {
      const { ImportExportManager } = await import('./modules/ImportExportManager.js');
      this.importExportManager = new ImportExportManager(
        this.characterManager,
        this.emotionManager,
        this.chainManager,
        this.configManager
      );
    }
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(chalk.bold(figlet.textSync('Prompt or Die', { horizontalLayout: 'full' })));
    console.log(boxen('Command-line SDK for AI prompt engineering', { padding: 1, margin: 1, borderColor: 'blue' }));
    
    console.log(chalk.blue('\n🚀 Usage:'));
    console.log('  prompt-or-die <command> [options]\n');
    
    console.log(chalk.blue('📋 Commands:'));
    console.log('  auth <action>           Authentication management');
    console.log('    login                 Login to your account');
    console.log('    logout                Logout from your account');
    console.log('    status                Show authentication status');
    console.log('');
    console.log('  character <action>      Character sheet management');
    console.log('    create <name>         Create a new character');
    console.log('    list                  List all characters');
    console.log('    show <id>             Show character details');
    console.log('    delete <id>           Delete a character');
    console.log('');
    console.log('  emotion <action>        Emotional state management');
    console.log('    create <name>         Create a new emotion');
    console.log('    list                  List all emotions');
    console.log('    show <id>             Show emotion details');
    console.log('    delete <id>           Delete an emotion');
    console.log('');
    console.log('  chain <action>          Prompt chain management');
    console.log('    create <name>         Create a new chain');
    console.log('    list                  List all chains');
    console.log('    show <id>             Show chain details');
    console.log('    delete <id>           Delete a chain');
    console.log('');
    console.log('  prompt <text>           Quick prompt builder');
    console.log('  scaffold <type>         Scaffold new projects');
    console.log('  mcp <action>            MCP server management');
    console.log('  analytics               Show analytics dashboard');
    console.log('  config <key> [value]    Configuration management');
    console.log('  env <action>            Environment & AI model management');
    console.log('    config                Configure environment settings');
    console.log('    models                Manage AI models');
    console.log('    keys                  Manage API keys');
    console.log('    env                   Manage .env file');
    console.log('    test                  Test API connections');
    console.log('    show                  View current configuration');
    console.log('  import <file>           Import data from file');
    console.log('  export <file>           Export data to file');
    console.log('');
    console.log(chalk.blue('🔧 Options:'));
    console.log('  --help, -h              Show this help message');
    console.log('  --version, -v           Show version information');
    console.log('  --verbose               Enable verbose output');
    console.log('  --config <file>         Use custom config file');
    console.log('');
    console.log(chalk.blue('💡 Examples:'));
    console.log('  prompt-or-die auth login');
    console.log('  prompt-or-die character create "Hero Character"');
    console.log('  prompt-or-die prompt "Generate a creative story"');
    console.log('  prompt-or-die chain list');
    console.log('  prompt-or-die env config');
    console.log('  prompt-or-die scaffold mcp-server');
  }

  /**
   * Show version information
   */
  private showVersion(): void {
    const packageJson = require('../package.json');
    console.log(chalk.blue(`Prompt or Die CLI v${packageJson.version}`));
  }

  /**
   * Show authentication help
   */
  private showAuthHelp(): void {
    console.log(chalk.blue('🔐 Authentication Commands'));
    console.log('');
    console.log(chalk.blue('📋 Usage:'));
    console.log('  prompt-or-die auth <action>');
    console.log('');
    console.log(chalk.blue('🎯 Actions:'));
    console.log('  login                   Login to your account');
    console.log('  logout                  Logout from your account');
    console.log('  status                  Show authentication status');
    console.log('');
    console.log(chalk.blue('💡 Examples:'));
    console.log('  prompt-or-die auth login');
    console.log('  prompt-or-die auth status');
    console.log('  prompt-or-die auth logout');
  }

  /**
   * Parse and execute commands
   */
  async run(argv: string[]): Promise<void> {
    const args = minimist(argv.slice(2), {
      alias: {
        h: 'help',
        v: 'version',
        c: 'config'
      },
      boolean: ['help', 'version', 'verbose']
    });

    // Show version
    if (args.version) {
      this.showVersion();
      return;
    }

    const [command, action, ...params] = args._;

    // Show general help if no command provided
    if (args._.length === 0) {
      this.showHelp();
      return;
    }

    // Show general help if help flag with no command
    if (args.help && !command) {
      this.showHelp();
      return;
    }

    // Initialize modules if needed for commands that require them
    const moduleRequiredCommands = ['prompt', 'analytics', 'import', 'export'];
    if (moduleRequiredCommands.includes(command)) {
      await this.initializeModules();
    }

    try {
      switch (command) {
        case 'auth':
          await this.handleAuthCommand(action, params, args);
          break;
        case 'character':
          await this.handleCharacterCommand(action, params, args);
          break;
        case 'emotion':
          await this.handleEmotionCommand(action, params, args);
          break;
        case 'chain':
          await this.handleChainCommand(action, params, args);
          break;
        case 'prompt':
          await this.handlePromptCommand(action, params, args);
          break;
        case 'scaffold':
          await this.handleScaffoldCommand(action, params, args);
          break;
        case 'mcp':
          await this.handleMCPCommand(action, params, args);
          break;
        case 'analytics':
          await this.handleAnalyticsCommand(action, params, args);
          break;
        case 'config':
          await this.handleConfigCommand(action, params, args);
          break;
        case 'env':
        case 'environment':
          await this.handleEnvCommand(action, params, args);
          break;
        case 'import':
          await this.handleImportCommand(action, params, args);
          break;
        case 'export':
          await this.handleExportCommand(action, params, args);
          break;
        default:
          console.error(chalk.red(`Unknown command: ${command}`));
          console.log(chalk.gray('Use --help to see available commands'));
          process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      if (args.verbose) {
        console.error(error);
      }
      process.exit(1);
    }
  }

  /**
   * Handle authentication commands
   */
  private async handleAuthCommand(action: string, params: string[], args: any): Promise<void> {
    // Show auth help if help flag is present or no action provided
    if (args.help || !action) {
      this.showAuthHelp();
      return;
    }

    switch (action) {
      case 'login':
        await this.authManager.login();
        break;
      case 'logout':
        await this.authManager.logout();
        break;
      case 'status':
        const isAuth = this.authManager.isAuthenticated();
        console.log(chalk.blue('📊 Authentication Status'));
        console.log(isAuth ? chalk.green('✅ Authenticated') : chalk.red('❌ Not authenticated'));
        break;
      default:
        console.error(chalk.red(`Unknown auth action: ${action}`));
        this.showAuthHelp();
    }
  }

  /**
   * Show character help
   */
  private showCharacterHelp(): void {
    console.log(chalk.blue('🎭 Character Commands'));
    console.log('');
    console.log(chalk.blue('📋 Usage:'));
    console.log('  prompt-or-die character <action> [options]');
    console.log('');
    console.log(chalk.blue('🎯 Actions:'));
    console.log('  create <name>           Create a new character');
    console.log('  list                    List all characters');
    console.log('  show <id>               Show character details');
    console.log('  delete <id>             Delete a character');
    console.log('');
    console.log(chalk.blue('💡 Examples:'));
    console.log('  prompt-or-die character create "Hero Character"');
    console.log('  prompt-or-die character list');
    console.log('  prompt-or-die character show 123');
    console.log('  prompt-or-die character delete 123');
  }

  /**
   * Handle character commands
   */
  private async handleCharacterCommand(action: string, params: string[], args: any): Promise<void> {
    // Show character help if help flag is present or no action provided
    if (args.help || !action) {
      this.showCharacterHelp();
      return;
    }

    switch (action) {
      case 'create':
        await this.characterManager.createCharacter();
        break;
      case 'list':
        await this.characterManager.listCharacters();
        break;
      case 'show':
        const id = params[0];
        if (!id) {
          console.error(chalk.red('Character ID is required'));
          console.log(chalk.gray('Usage: prompt-or-die character show <id>'));
          return;
        }
        await this.characterManager.showCharacter(id);
        break;
      case 'delete':
        await this.characterManager.deleteCharacter();
        break;
      case 'edit':
        await this.characterManager.editCharacter();
        break;
      case 'search':
        await this.characterManager.searchCharacters();
        break;
      case 'analytics':
        await this.characterManager.showAnalytics();
        break;
      default:
        console.error(chalk.red(`Unknown character action: ${action}`));
        this.showCharacterHelp();
    }
  }

  /**
   * Handle emotion commands
   */
  private async handleEmotionCommand(action: string, params: string[], args: any): Promise<void> {
    if (!action) {
      await this.emotionManager.showMenu();
      return;
    }

    switch (action) {
      case 'create':
        await this.emotionManager.createEmotion();
        break;
      case 'list':
        await this.emotionManager.listEmotions();
        break;
      case 'edit':
        await this.emotionManager.editEmotion();
        break;
      case 'delete':
        await this.emotionManager.deleteEmotion();
        break;
      case 'search':
        await this.emotionManager.searchEmotions();
        break;
      case 'export':
        await this.emotionManager.exportEmotions();
        break;
      case 'import':
        await this.emotionManager.importEmotions();
        break;
      default:
        console.error(chalk.red(`Unknown emotion action: ${action}`));
        console.log(chalk.yellow('Available emotion commands:'));
        console.log(chalk.gray('  emotion create    - Create new emotion'));
        console.log(chalk.gray('  emotion list      - List all emotions'));
        console.log(chalk.gray('  emotion edit      - Edit an emotion'));
        console.log(chalk.gray('  emotion delete    - Delete an emotion'));
        console.log(chalk.gray('  emotion search    - Search emotions'));
        console.log(chalk.gray('  emotion export    - Export emotions'));
        console.log(chalk.gray('  emotion import    - Import emotions'));
        break;
    }
  }

  /**
   * Handle chain commands
   */
  private async handleChainCommand(action: string, params: string[], args: any): Promise<void> {
    console.log(chalk.blue(`🔗 Chain ${action}`));
    console.log(chalk.gray('Chain management functionality would be implemented here'));
  }

  /**
   * Handle prompt commands
   */
  private async handlePromptCommand(action: string, params: string[], args: any): Promise<void> {
    const promptText = [action, ...params].join(' ');
    console.log(chalk.blue('⚡ Quick Prompt Builder'));
    console.log(chalk.gray(`Processing prompt: "${promptText}"`));
    console.log(chalk.gray('Prompt building functionality would be implemented here'));
  }

  /**
   * Handle scaffold commands
   */
  private async handleScaffoldCommand(action: string, params: string[], args: any): Promise<void> {
    console.log(chalk.blue(`🏗️ Scaffold ${action}`));
    console.log(chalk.gray('Scaffolding functionality would be implemented here'));
  }

  /**
   * Handle MCP commands
   */
  private async handleMCPCommand(action: string, params: string[], args: any): Promise<void> {
    console.log(chalk.blue(`🌐 MCP ${action}`));
    console.log(chalk.gray('MCP management functionality would be implemented here'));
  }

  /**
   * Handle analytics commands
   */
  private async handleAnalyticsCommand(action: string, params: string[], args: any): Promise<void> {
    console.log(chalk.blue('📊 Analytics Dashboard'));
    console.log(chalk.gray('Analytics functionality would be implemented here'));
  }

  /**
   * Handle config commands
   */
  private async handleConfigCommand(action: string, params: string[], args: any): Promise<void> {
    console.log(chalk.blue(`⚙️ Config ${action}`));
    console.log(chalk.gray('Configuration functionality would be implemented here'));
  }

  /**
   * Handle import commands
   */
  private async handleImportCommand(action: string, params: string[], args: any): Promise<void> {
    console.log(chalk.blue(`📥 Import ${action}`));
    console.log(chalk.gray('Import functionality would be implemented here'));
  }

  /**
   * Handle export commands
   */
  private async handleExportCommand(action: string, params: string[], args: any): Promise<void> {
    console.log(chalk.blue(`📤 Export ${action}`));
    console.log(chalk.gray('Export functionality would be implemented here'));
  }

  /**
   * Handle environment commands
   */
  private async handleEnvCommand(action: string, params: string[], args: any): Promise<void> {
    if (!action) {
      await this.environmentManager.showMenu();
      return;
    }

    switch (action) {
      case 'config':
      case 'configure':
        await this.environmentManager.showMenu();
        break;
      case 'models':
        await this.environmentManager.manageAIModels();
        break;
      case 'keys':
        await this.environmentManager.manageAPIKeys();
        break;
      case 'env':
        await this.environmentManager.manageEnvFile();
        break;
      case 'test':
        await this.environmentManager.testConnections();
        break;
      case 'show':
      case 'view':
        await this.environmentManager.viewConfiguration();
        break;
      default:
        console.log(chalk.yellow('Available environment commands:'));
        console.log(chalk.gray('  env config    - Configure environment and AI models'));
        console.log(chalk.gray('  env models    - Manage AI models'));
        console.log(chalk.gray('  env keys      - Manage API keys'));
        console.log(chalk.gray('  env env       - Manage .env file'));
        console.log(chalk.gray('  env test      - Test API connections'));
        console.log(chalk.gray('  env show      - View current configuration'));
        break;
    }
  }
}

// Main execution
const currentFile = fileURLToPath(import.meta.url);
const scriptPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (currentFile === scriptPath) {
  const cli = new CLI();
  cli.run(process.argv).catch((error) => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}