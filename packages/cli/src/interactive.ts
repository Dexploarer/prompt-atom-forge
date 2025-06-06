/**
 * @fileoverview Interactive CLI for Prompt or Die SDK
 * @module @prompt-or-die/cli/interactive
 */

import { input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import { CharacterManager } from './managers/CharacterManager.js';
import { EmotionManager } from './managers/EmotionManager.js';
import { ChainManager } from './managers/ChainManager.js';
import { MCPManager } from './managers/MCPManager.js';
import { ConfigManager } from './managers/ConfigManager.js';
import { ContactManager } from './managers/ContactManager.js';
import { PromptBuilder } from './modules/PromptBuilder.js';
import { MCPServerGenerator } from './modules/MCPServerGenerator.js';
import { AnalyticsHelper } from './modules/AnalyticsHelper.js';
import { ImportExportManager } from './modules/ImportExportManager.js';

/**
 * Interactive CLI class
 */
export class InteractiveCLI {
  private characterManager: CharacterManager;
  private emotionManager: EmotionManager;
  private chainManager: ChainManager;
  private mcpManager: MCPManager;
  private configManager: ConfigManager;
  private contactManager: ContactManager;
  private promptBuilder: PromptBuilder;
  private analyticsHelper: AnalyticsHelper;
  private importExportManager: ImportExportManager;

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
    
    // Initialize module helpers
    this.promptBuilder = new PromptBuilder(this.chainManager);
    this.analyticsHelper = new AnalyticsHelper(this.chainManager, this.characterManager, this.emotionManager);
    this.importExportManager = new ImportExportManager(
      this.characterManager,
      this.emotionManager,
      this.chainManager,
      this.configManager
    );
  }

  /**
   * Start the interactive CLI
   */
  async start(): Promise<void> {
    console.log(chalk.bold(figlet.textSync('Prompt or Die', { horizontalLayout: 'full' })));
    console.log(boxen('Interactive SDK for AI prompt engineering', { padding: 1, margin: 1, borderColor: 'blue' }));

    await this.showMainMenu();
  }

  /**
   * Show main menu
   */
  async showMainMenu(): Promise<void> {
    while (true) {
      console.clear();
      console.log(chalk.bold(chalk.blue('\n🚀 Prompt or Die - Main Menu')));
      console.log(chalk.gray('Interactive SDK for AI prompt engineering\n'));

      const action = await select({
        message: 'What would you like to do?',
        choices: [
          { name: '⚡ Quick Prompt Builder', value: 'prompt' },
          { name: '🤖 Character Sheets', value: 'character' },
          { name: '🎭 Emotional States', value: 'emotion' },
          { name: '🔗 Prompt Chains', value: 'chain' },
          { name: '🌐 MCP Server Management', value: 'mcp' },
          { name: '📊 Analytics Dashboard', value: 'analytics' },
          { name: '📦 Import/Export Data', value: 'import-export' },
          { name: '⚙️ Configuration', value: 'config' },
          { name: '❓ Help', value: 'help' },
          { name: '👋 Exit', value: 'exit' }
        ]
      });

      switch (action) {
        case 'prompt':
          await this.promptBuilder.quickPromptBuilder();
          break;
        case 'character':
          await this.characterSheetsMenu();
          break;
        case 'emotion':
          await this.emotionalStatesMenu();
          break;
        case 'chain':
          await this.promptChainsMenu();
          break;
        case 'mcp':
          await this.mcpMenu();
          break;
        case 'analytics':
          await this.analyticsHelper.analyticsMenu();
          break;
        case 'import-export':
          await this.importExportManager.showMenu();
          break;
        case 'config':
          await this.configMenu();
          break;
        case 'help':
          await this.analyticsHelper.showHelp();
          break;
        case 'exit':
          console.log(chalk.blue('\n👋 Thank you for using Prompt or Die CLI!'));
          return;
      }
    }
  }

  /**
   * Character Sheets menu
   */
  private async characterSheetsMenu(): Promise<void> {
    console.log(chalk.blue('\n👤 Character Sheets'));
    console.log(chalk.gray('Manage AI character sheets\n'));
    
    const action = await select({
      message: 'Character Sheets:',
      choices: [
        { name: '📝 Create New Character', value: 'create' },
        { name: '📋 List Characters', value: 'list' },
        { name: '🔄 Edit Character', value: 'edit' },
        { name: '🗑️ Delete Character', value: 'delete' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });
    
    if (action === 'back') return;
    
    await this.characterManager.showMenu();
  }

  /**
   * Emotional States menu
   */
  private async emotionalStatesMenu(): Promise<void> {
    console.log(chalk.blue('\n🎭 Emotional States'));
    console.log(chalk.gray('Manage AI emotional states\n'));
    
    const action = await select({
      message: 'Emotional States:',
      choices: [
        { name: '📝 Create New Emotion', value: 'create' },
        { name: '📋 List Emotions', value: 'list' },
        { name: '🔄 Edit Emotion', value: 'edit' },
        { name: '🗑️ Delete Emotion', value: 'delete' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });
    
    if (action === 'back') return;
    
    await this.emotionManager.showMenu();
  }

  /**
   * Prompt Chains menu
   */
  private async promptChainsMenu(): Promise<void> {
    console.log(chalk.blue('\n🔗 Prompt Chains'));
    console.log(chalk.gray('Manage prompt chains\n'));
    
    const action = await select({
      message: 'Prompt Chains:',
      choices: [
        { name: '📝 Create New Chain', value: 'create' },
        { name: '📋 List Chains', value: 'list' },
        { name: '🔄 Edit Chain', value: 'edit' },
        { name: '🗑️ Delete Chain', value: 'delete' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });
    
    if (action === 'back') return;
    
    await this.chainManager.showMenu();
  }
  
  /**
   * MCP menu
   */
  private async mcpMenu(): Promise<void> {
    console.log(chalk.blue('\n🌐 MCP Server Management'));
    console.log(chalk.gray('Manage MCP servers\n'));
    
    const action = await select({
      message: 'MCP Server Options:',
      choices: [
        { name: '🚀 Generate New MCP Server', value: 'generate' },
        { name: '📋 List MCP Servers', value: 'list' },
        { name: '🔄 Update MCP Server', value: 'update' },
        { name: '🗑️ Delete MCP Server', value: 'delete' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });
    
    switch (action) {
      case 'generate':
        await MCPServerGenerator.generateInteractive();
        break;
      case 'list':
      case 'update':
      case 'delete':
        await this.mcpManager.showMenu();
        break;
      case 'back':
        return;
    }
  }

  /**
   * Configuration menu
   */
  private async configMenu(): Promise<void> {
    console.log(chalk.blue('\n⚙️ Configuration'));
    console.log(chalk.gray('Manage CLI configuration\n'));
    
    const action = await select({
      message: 'Configuration Options:',
      choices: [
        { name: '📋 View Current Config', value: 'view' },
        { name: '🔄 Update Config', value: 'update' },
        { name: '🔄 Reset to Default', value: 'reset' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });
    
    if (action === 'back') return;
    
    await this.configManager.showMenu();
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

// Export the CLI
export default InteractiveCLI;
