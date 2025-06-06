/**
 * @fileoverview Import/Export Manager module
 * @module @prompt-or-die/cli/modules/ImportExportManager
 */

import chalk from 'chalk';
import ora from 'ora';
import { select, input, confirm } from '@inquirer/prompts';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { CharacterManager } from '../managers/CharacterManager.js';
import { EmotionManager } from '../managers/EmotionManager.js';
import { ChainManager } from '../managers/ChainManager.js';
import { ConfigManager } from '../managers/ConfigManager.js';

/**
 * Import/Export Manager class for data import and export functionality
 */
export class ImportExportManager {
  private characterManager: CharacterManager;
  private emotionManager: EmotionManager;
  private chainManager: ChainManager;
  private configManager: ConfigManager;

  constructor(
    characterManager: CharacterManager,
    emotionManager: EmotionManager,
    chainManager: ChainManager,
    configManager: ConfigManager
  ) {
    this.characterManager = characterManager;
    this.emotionManager = emotionManager;
    this.chainManager = chainManager;
    this.configManager = configManager;
  }

  /**
   * Import/Export menu
   */
  async showMenu(): Promise<void> {
    console.log(chalk.blue('\n📦 Import/Export Manager'));
    console.log(chalk.gray('Backup and restore your data\n'));

    const action = await select({
      message: 'Import/Export Options:',
      choices: [
        { name: '📤 Export All Data', value: 'export-all' },
        { name: '📥 Import All Data', value: 'import-all' },
        { name: '👤 Export Characters', value: 'export-characters' },
        { name: '👤 Import Characters', value: 'import-characters' },
        { name: '🎭 Export Emotions', value: 'export-emotions' },
        { name: '🎭 Import Emotions', value: 'import-emotions' },
        { name: '🔗 Export Chains', value: 'export-chains' },
        { name: '🔗 Import Chains', value: 'import-chains' },
        { name: '⚙️ Export Config', value: 'export-config' },
        { name: '⚙️ Import Config', value: 'import-config' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });

    switch (action) {
      case 'export-all':
        await this.exportAllData();
        break;
      case 'import-all':
        await this.importAllData();
        break;
      case 'export-characters':
        await this.exportData('characters');
        break;
      case 'import-characters':
        await this.importData('characters');
        break;
      case 'export-emotions':
        await this.exportData('emotions');
        break;
      case 'import-emotions':
        await this.importData('emotions');
        break;
      case 'export-chains':
        await this.exportData('chains');
        break;
      case 'import-chains':
        await this.importData('chains');
        break;
      case 'export-config':
        await this.configManager.exportConfig();
        break;
      case 'import-config':
        await this.configManager.importConfig();
        break;
      case 'back':
        return;
    }

    await this.pressAnyKey();
  }

  /**
   * Export all data
   */
  private async exportAllData(): Promise<void> {
    const spinner = ora('Exporting all data...').start();
    
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `prompt-or-die-backup-${timestamp}.json`;
      
      const backup = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
          characters: await (this.characterManager as any).exportData(),
          emotions: await (this.emotionManager as any).exportData(),
          chains: await (this.chainManager as any).exportData(),
          config: await this.configManager.exportConfig()
        }
      };
      
      writeFileSync(filename, JSON.stringify(backup, null, 2));
      spinner.succeed(`All data exported to "${filename}"!`);
    } catch (error) {
      spinner.fail('Export failed!');
      console.error(chalk.red('Error:'), (error as Error).message);
    }
  }

  /**
   * Import all data
   */
  private async importAllData(): Promise<void> {
    const filename = await input({
      message: 'Import filename:',
      validate: (input) => {
        if (!input) return 'Filename is required';
        if (!existsSync(input)) return 'File does not exist';
        return true;
      }
    });

    const confirmed = await confirm({
      message: 'This will overwrite existing data. Continue?',
      default: false
    });

    if (!confirmed) {
      console.log(chalk.gray('\n❌ Import cancelled.'));
      return;
    }

    const spinner = ora('Importing all data...').start();
    
    try {
      const content = readFileSync(filename, 'utf8');
      const backup = JSON.parse(content);
      
      if (!backup.data) {
        throw new Error('Invalid backup format');
      }
      
      if (backup.data.characters) {
        await (this.characterManager as any).importData(backup.data.characters);
      }
      
      if (backup.data.emotions) {
        await (this.emotionManager as any).importData(backup.data.emotions);
      }
      
      if (backup.data.chains) {
        await (this.chainManager as any).importData(backup.data.chains);
      }
      
      if (backup.data.config) {
        await this.configManager.importConfig();
      }
      
      spinner.succeed('All data imported successfully!');
    } catch (error) {
      spinner.fail('Import failed!');
      console.error(chalk.red('Error:'), (error as Error).message);
    }
  }

  /**
   * Export specific data type
   */
  private async exportData(type: 'characters' | 'emotions' | 'chains'): Promise<void> {
    const spinner = ora(`Exporting ${type}...`).start();
    
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `prompt-or-die-${type}-${timestamp}.json`;
      
      let data;
      switch (type) {
        case 'characters':
          data = await (this.characterManager as any).exportData();
          break;
        case 'emotions':
          data = await (this.emotionManager as any).exportData();
          break;
        case 'chains':
          data = await (this.chainManager as any).exportData();
          break;
      }
      
      writeFileSync(filename, JSON.stringify(data, null, 2));
      spinner.succeed(`${type} exported to "${filename}"!`);
    } catch (error) {
      spinner.fail(`Export of ${type} failed!`);
      console.error(chalk.red('Error:'), (error as Error).message);
    }
  }

  /**
   * Import specific data type
   */
  private async importData(type: 'characters' | 'emotions' | 'chains'): Promise<void> {
    const filename = await input({
      message: 'Import filename:',
      validate: (input) => {
        if (!input) return 'Filename is required';
        if (!existsSync(input)) return 'File does not exist';
        return true;
      }
    });

    const confirmed = await confirm({
      message: `This will overwrite existing ${type}. Continue?`,
      default: false
    });

    if (!confirmed) {
      console.log(chalk.gray('\n❌ Import cancelled.'));
      return;
    }

    const spinner = ora(`Importing ${type}...`).start();
    
    try {
      const content = readFileSync(filename, 'utf8');
      const data = JSON.parse(content);
      
      switch (type) {
        case 'characters':
          await (this.characterManager as any).importData(data);
          break;
        case 'emotions':
          await (this.emotionManager as any).importData(data);
          break;
        case 'chains':
          await (this.chainManager as any).importData(data);
          break;
      }
      
      spinner.succeed(`${type} imported successfully!`);
    } catch (error) {
      spinner.fail(`Import of ${type} failed!`);
      console.error(chalk.red('Error:'), (error as Error).message);
    }
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
