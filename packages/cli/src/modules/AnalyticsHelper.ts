/**
 * @fileoverview Analytics Helper module
 * @module @prompt-or-die/cli/modules/AnalyticsHelper
 */

import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { select, input } from '@inquirer/prompts';
import { writeFileSync } from 'fs';
import { AnalyticsData } from '../types.js';
import { ChainManager } from '../managers/ChainManager.js';
import { CharacterManager } from '../managers/CharacterManager.js';
import { EmotionManager } from '../managers/EmotionManager.js';

/**
 * Analytics Helper class for analytics and help functionality
 */
export class AnalyticsHelper {
  private chainManager: ChainManager;
  private characterManager: CharacterManager;
  private emotionManager: EmotionManager;

  constructor(
    chainManager: ChainManager,
    characterManager: CharacterManager,
    emotionManager: EmotionManager
  ) {
    this.chainManager = chainManager;
    this.characterManager = characterManager;
    this.emotionManager = emotionManager;
  }

  /**
   * Load analytics data
   */
  async loadAnalytics(): Promise<AnalyticsData> {
    return {
      totalCommands: 0,
      totalPrompts: 0,
      totalChains: await this.chainManager.count(),
      totalCharacters: await this.characterManager.count(),
      totalEmotions: await this.emotionManager.count(),
      successRate: 0,
      averageExecutionTime: 0,
      mostUsedBlocks: [],
      lastUsed: new Date(),
      recentActivity: []
    };
  }

  /**
   * Analytics menu
   */
  async analyticsMenu(): Promise<void> {
    console.log(chalk.blue('\n📊 Analytics Dashboard'));
    console.log(chalk.gray('View usage statistics and insights\n'));

    const spinner = ora('Loading analytics...').start();
    const analytics = await this.loadAnalytics();
    spinner.succeed('Analytics loaded!');

    const table = new Table({
      head: ['Metric', 'Count'],
      colWidths: [25, 15]
    });

    table.push(
      ['📝 Total Prompts', chalk.cyan(analytics.totalPrompts.toString())],
      ['👤 Characters', chalk.cyan(analytics.totalCharacters.toString())],
      ['🔗 Prompt Chains', chalk.cyan(analytics.totalChains.toString())],
      ['🎭 Emotions', chalk.cyan(analytics.totalEmotions.toString())],
      ['⚡ Commands', chalk.cyan(analytics.totalCommands.toString())],
      ['📅 Last Used', chalk.cyan(analytics.lastUsed.toLocaleDateString())]
    );

    console.log(table.toString());
    
    const action = await select({
      message: 'Analytics Options:',
      choices: [
        { name: '📈 Detailed Report', value: 'detailed' },
        { name: '📤 Export Analytics', value: 'export' },
        { name: '🔄 Refresh Data', value: 'refresh' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });

    switch (action) {
      case 'detailed':
        await this.showDetailedAnalytics();
        break;
      case 'export':
        await this.exportAnalytics(analytics);
        break;
      case 'refresh':
        await this.analyticsMenu();
        return;
      case 'back':
        return;
    }

    await this.pressAnyKey();
  }

  /**
   * Show detailed analytics
   */
  private async showDetailedAnalytics(): Promise<void> {
    console.log(chalk.blue('\n📈 Detailed Analytics Report'));
    console.log(chalk.gray('Comprehensive usage statistics\n'));
    
    // This would show more detailed breakdowns
    console.log(chalk.yellow('🚧 Detailed analytics coming soon...'));
  }

  /**
   * Export analytics
   */
  private async exportAnalytics(analytics: AnalyticsData): Promise<void> {
    const filename = await input({
      message: 'Export filename:',
      default: `analytics-${new Date().toISOString().split('T')[0]}.json`
    });

    try {
      writeFileSync(filename, JSON.stringify(analytics, null, 2));
      console.log(chalk.green(`\n✅ Analytics exported to "${filename}"!`));
    } catch (error) {
      console.error(chalk.red('\n❌ Export failed:'), (error as Error).message);
    }
  }

  /**
   * Show help
   */
  async showHelp(): Promise<void> {
    console.log(chalk.blue('\n❓ Help Center'));
    console.log(chalk.gray('Learn how to use the Prompt or Die CLI\n'));
    
    const topic = await select({
      message: 'Select a help topic:',
      choices: [
        { name: '🚀 Quick Start Guide', value: 'quickstart' },
        { name: '💡 Tips & Tricks', value: 'tips' },
        { name: '📚 Documentation', value: 'docs' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });
    
    switch (topic) {
      case 'quickstart':
        await this.showQuickStart();
        break;
      case 'tips':
        await this.showTips();
        break;
      case 'docs':
        console.log(chalk.blue('\n📚 Documentation'));
        console.log(chalk.gray('Visit https://docs.prompt-or-die.com for full documentation'));
        break;
      case 'back':
        return;
    }
    
    await this.pressAnyKey();
  }

  /**
   * Show quick start guide
   */
  private async showQuickStart(): Promise<void> {
    console.log(chalk.blue('\n🚀 Quick Start Guide'));
    console.log(chalk.gray('Get started quickly with Prompt or Die CLI\n'));
    
    const steps = [
      '1. Create a character sheet using the Character Sheets menu',
      '2. Create emotional states using the Emotional States menu',
      '3. Build prompt chains using the Prompt Chains menu or Quick Prompt Builder',
      '4. Generate an MCP server using the MCP Server Management menu',
      '5. Deploy your project and start prompting!'
    ];
    
    steps.forEach(step => console.log(chalk.yellow(step)));
  }

  /**
   * Show tips and tricks
   */
  private async showTips(): Promise<void> {
    console.log(chalk.blue('\n💡 Tips & Tricks'));
    console.log(chalk.gray('Advanced usage tips for Prompt or Die CLI\n'));
    
    const tips = [
      '💡 Use tab completion in CLI commands for faster navigation',
      '💡 Chain multiple prompts together for complex reasoning',
      '💡 Export your data regularly as backup',
      '💡 Use variables in your prompt chains for dynamic content',
      '💡 Create character sheets for consistent AI personas'
    ];
    
    tips.forEach(tip => console.log(chalk.yellow(tip)));
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
