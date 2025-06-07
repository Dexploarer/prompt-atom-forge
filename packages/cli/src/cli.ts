#!/usr/bin/env node
/**
 * @fileoverview Command-line interface for Prompt or Die SDK
 * @module @prompt-or-die/cli/cli
 */

const minimist = require('minimist');
const chalk = require('chalk');
const figlet = require('figlet');
const boxen = require('boxen');
const { CharacterManager } = require('./managers/CharacterManager');
const { EmotionManager } = require('./managers/EmotionManager');
const { ChainManager } = require('./managers/ChainManager');
const { AuthManager } = require('./managers/AuthManager');
const { ConfigManager } = require('./managers/ConfigManager');
const { ContactManager } = require('./managers/ContactManager');
const { MCPManager } = require('./managers/MCPManager');

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

    // Show help
    if (args.help || args._.length === 0) {
      this.showHelp();
      return;
    }

    // Show version
    if (args.version) {
      this.showVersion();
      return;
    }

    const [command, action, ...params] = args._;

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
    switch (action) {
      case 'login':
        console.log(chalk.blue('🔐 Authentication Login'));
        // Implementation would go here - for now just show status
        console.log(chalk.gray('Authentication functionality would be implemented here'));
        break;
      case 'logout':
        console.log(chalk.blue('🚪 Authentication Logout'));
        console.log(chalk.gray('Logout functionality would be implemented here'));
        break;
      case 'status':
        console.log(chalk.blue('📊 Authentication Status'));
        const isAuth = this.authManager.isAuthenticated();
        console.log(isAuth ? chalk.green('✅ Authenticated') : chalk.red('❌ Not authenticated'));
        break;
      default:
        console.error(chalk.red(`Unknown auth action: ${action}`));
        console.log(chalk.gray('Available actions: login, logout, status'));
    }
  }

  /**
   * Handle character commands
   */
  private async handleCharacterCommand(action: string, params: string[], args: any): Promise<void> {
    switch (action) {
      case 'create':
        const name = params[0];
        if (!name) {
          console.error(chalk.red('Character name is required'));
          console.log(chalk.gray('Usage: prompt-or-die character create <name>'));
          return;
        }
        console.log(chalk.blue(`🎭 Creating character: ${name}`));
        console.log(chalk.gray('Character creation functionality would be implemented here'));
        break;
      case 'list':
        console.log(chalk.blue('📋 Character List'));
        console.log(chalk.gray('Character listing functionality would be implemented here'));
        break;
      case 'show':
        const id = params[0];
        if (!id) {
          console.error(chalk.red('Character ID is required'));
          console.log(chalk.gray('Usage: prompt-or-die character show <id>'));
          return;
        }
        console.log(chalk.blue(`👤 Character Details: ${id}`));
        console.log(chalk.gray('Character details functionality would be implemented here'));
        break;
      case 'delete':
        const deleteId = params[0];
        if (!deleteId) {
          console.error(chalk.red('Character ID is required'));
          console.log(chalk.gray('Usage: prompt-or-die character delete <id>'));
          return;
        }
        console.log(chalk.blue(`🗑️ Deleting character: ${deleteId}`));
        console.log(chalk.gray('Character deletion functionality would be implemented here'));
        break;
      default:
        console.error(chalk.red(`Unknown character action: ${action}`));
        console.log(chalk.gray('Available actions: create, list, show, delete'));
    }
  }

  /**
   * Handle emotion commands
   */
  private async handleEmotionCommand(action: string, params: string[], args: any): Promise<void> {
    console.log(chalk.blue(`🎭 Emotion ${action}`));
    console.log(chalk.gray('Emotion management functionality would be implemented here'));
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
}

// Main execution
if (require.main === module) {
  const cli = new CLI();
  cli.run(process.argv).catch((error) => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}