/**
 * @fileoverview Character management for CLI
 * @module @prompt-or-die/cli/managers/CharacterManager
 */

import { input, select, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import Table from 'cli-table3';
import { BaseManager } from './BaseManager.js';
import { CharacterSheet, EmotionalState } from '../types.js';
import { EmotionManager } from './EmotionManager.js';
import { CharacterFileManager } from './CharacterFileManager.js';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Character manager class
 */
export class CharacterManager extends BaseManager<CharacterSheet> {
  private emotionManager: EmotionManager;
  private fileManager: CharacterFileManager;

  constructor() {
    const dataDir = join(homedir(), '.prompt-or-die', 'data');
    super(dataDir, 'characters.json');
    this.emotionManager = new EmotionManager(dataDir);
    this.fileManager = new CharacterFileManager();
  }

  /**
   * Character management menu
   */
  async showMenu(): Promise<void> {
    const action = await select({
      message: 'Character Sheet Options:',
      choices: [
        { name: '👤 Create New Character', value: 'create' },
        { name: '📋 List Characters', value: 'list' },
        { name: '✏️  Edit Character', value: 'edit' },
        { name: '🗑️  Delete Character', value: 'delete' },
        { name: '📤 Export Character Files', value: 'export' },
        { name: '📦 Export All Characters', value: 'export-all' },
        { name: '📊 Character Analytics', value: 'analytics' },
        { name: '🔍 Search Characters', value: 'search' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });

    switch (action) {
      case 'create':
        await this.createCharacter();
        break;
      case 'list':
        await this.listCharacters();
        break;
      case 'edit':
        await this.editCharacter();
        break;
      case 'delete':
        await this.deleteCharacter();
        break;
      case 'export':
        await this.exportCharacter();
        break;
      case 'export-all':
        await this.exportAllCharacters();
        break;
      case 'analytics':
        await this.showAnalytics();
        break;
      case 'search':
        await this.searchCharacters();
        break;
      case 'back':
        return;
    }
  }

  /**
   * Create new character
   */
  async createCharacter(): Promise<void> {
    console.log(chalk.blue('\n👤 Create New Character\n'));

    const name = await input({
      message: 'Character name:',
      validate: (value) => value.length > 0 || 'Name is required'
    });

    const description = await input({
      message: 'Character description:',
      validate: (value) => value.length > 0 || 'Description is required'
    });

    const personality = await input({
      message: 'Personality traits (comma-separated):'
    });

    const background = await input({
      message: 'Character background:'
    });

    const goals = await input({
      message: 'Character goals (comma-separated):'
    });

    const strengths = await input({
      message: 'Strengths (comma-separated):'
    });

    const weaknesses = await input({
      message: 'Weaknesses (comma-separated):'
    });

    const quirks = await input({
      message: 'Quirks (comma-separated):'
    });

    const primaryEmotion = await select({
      message: 'Primary emotional state:',
      choices: [
        { name: 'Joy', value: 'joy' },
        { name: 'Sadness', value: 'sadness' },
        { name: 'Anger', value: 'anger' },
        { name: 'Fear', value: 'fear' },
        { name: 'Surprise', value: 'surprise' },
        { name: 'Disgust', value: 'disgust' },
        { name: 'Neutral', value: 'neutral' }
      ]
    });

    const intensity = await input({
      message: 'Emotional intensity (1-10):',
      validate: (value) => {
        const num = parseInt(value);
        return (num >= 1 && num <= 10) || 'Must be a number between 1 and 10';
      }
    });

    // AI Model Configuration
    const configureAI = await confirm({
      message: 'Configure AI model for this character?',
      default: true
    });

    let aiModel: CharacterSheet['aiModel'] | undefined;
    if (configureAI) {
      const provider = await select({
        message: 'Select AI provider:',
        choices: [
          { name: 'OpenAI (GPT-4, GPT-3.5)', value: 'openai' },
          { name: 'Anthropic (Claude)', value: 'anthropic' },
          { name: 'Google (Gemini)', value: 'google' },
          { name: 'Groq (Fast inference)', value: 'groq' },
          { name: 'Cohere', value: 'cohere' },
          { name: 'Local/Custom', value: 'local' }
        ]
      }) as 'openai' | 'anthropic' | 'google' | 'groq' | 'cohere' | 'local';

      const modelChoices = this.getModelChoicesForProvider(provider);
      const model = await select({
        message: 'Select model:',
        choices: modelChoices
      });

      aiModel = {
        provider,
        model
      };

      // API Key configuration
      const useCustomKey = await confirm({
        message: 'Use custom API key for this character? (Otherwise uses global config)',
        default: false
      });

      if (useCustomKey) {
        const apiKey = await input({
          message: `Enter ${provider.toUpperCase()} API key:`,
          validate: (value) => value.length > 0 || 'API key is required'
        });
        aiModel.apiKey = apiKey;
      }

      // Advanced settings
      const configureAdvanced = await confirm({
        message: 'Configure advanced model settings?',
        default: false
      });

      if (configureAdvanced) {
        if (provider === 'local') {
          aiModel.baseUrl = await input({
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
        aiModel.maxTokens = parseInt(maxTokensInput);

        const temperatureInput = await input({
          message: 'Temperature (0.0-2.0, default: 0.7):',
          default: '0.7',
          validate: (value: string) => {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0 || num > 2) return 'Please enter a number between 0.0 and 2.0';
            return true;
          }
        });
        aiModel.temperature = parseFloat(temperatureInput);
      }
    }

    const character = {
      id: `char_${Date.now()}`,
      name,
      description,
      personality: personality.split(',').map(p => p.trim()).filter(p => p),
      background,
      goals: goals.split(',').map(g => g.trim()).filter(g => g),
      relationships: {},
      traits: {
        strengths: strengths.split(',').map(s => s.trim()).filter(s => s),
        weaknesses: weaknesses.split(',').map(w => w.trim()).filter(w => w),
        quirks: quirks.split(',').map(q => q.trim()).filter(q => q)
      },
      emotionalState: {
        id: `emotion_${Date.now()}`,
        name: `${primaryEmotion}_state`,
        primaryEmotion: primaryEmotion,
        intensity: parseInt(intensity),
        valence: 0, // Default neutral valence
        arousal: parseInt(intensity) / 10, // Normalize intensity to 0-1 scale
        dominance: 0.5, // Default medium dominance
        secondaryEmotions: [],
        context: [],
        triggers: [],
        responses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        history: []
      },
      aiModel: aiModel || undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.save({
      ...character,
      aiModel: character.aiModel || {
        provider: 'openai',
        model: 'gpt-3.5-turbo'
      }
    });
    console.log(chalk.green(`\n✅ Character '${name}' created successfully!`));
    await this.pressAnyKey();
  }

  /**
   * List all characters
   */
  async listCharacters(): Promise<void> {
    const characters = this.loadAll();
    
    if (characters.length === 0) {
      console.log(chalk.yellow('\n📭 No characters found. Create one first!'));
      await this.pressAnyKey();
      return;
    }

    const table = new Table({
      head: ['ID', 'Name', 'Primary Emotion', 'AI Model', 'Traits', 'Created'],
      colWidths: [15, 20, 15, 20, 10, 12]
    });

    characters.forEach(char => {
      const traitCount = char.traits.strengths.length + char.traits.weaknesses.length + char.traits.quirks.length;
      const aiModelInfo = char.aiModel ? `${char.aiModel.provider}/${char.aiModel.model}` : 'None';
      table.push([
        char.id.substring(0, 12) + '...',
        char.name,
        char.emotionalState.primaryEmotion,
        aiModelInfo.substring(0, 18) + (aiModelInfo.length > 18 ? '...' : ''),
        traitCount.toString(),
        char.createdAt.toLocaleDateString()
      ]);
    });

    console.log('\n📋 Character List:\n');
    console.log(table.toString());
    await this.pressAnyKey();
  }

  /**
   * Edit character
   */
  async editCharacter(): Promise<void> {
    const characters = this.loadAll();
    
    if (characters.length === 0) {
      console.log(chalk.yellow('\n📭 No characters found. Create one first!'));
      await this.pressAnyKey();
      return;
    }

    const choices = characters.map(char => ({
      name: `${char.name} (${char.emotionalState.primaryEmotion})`,
      value: char.id
    }));

    const selectedId = await select({
      message: 'Select character to edit:',
      choices
    });

    const character = this.findById(selectedId);
    if (!character) {
      console.log(chalk.red('\n❌ Character not found!'));
      await this.pressAnyKey();
      return;
    }

    const field = await select({
      message: 'What would you like to edit?',
      choices: [
        { name: 'Name', value: 'name' },
        { name: 'Description', value: 'description' },
        { name: 'Personality', value: 'personality' },
        { name: 'Background', value: 'background' },
        { name: 'Goals', value: 'goals' },
        { name: 'Emotional State', value: 'emotion' },
        { name: 'Traits', value: 'traits' }
      ]
    });

    switch (field) {
      case 'name':
        character.name = await input({
          message: 'New name:',
          default: character.name,
          validate: (value) => value.length > 0 || 'Name is required'
        });
        break;
      case 'description':
        character.description = await input({
          message: 'New description:',
          default: character.description
        });
        break;
      case 'emotion':
        const newEmotion = await select({
          message: 'New primary emotion:',
          choices: [
            { name: 'Joy', value: 'joy' },
            { name: 'Sadness', value: 'sadness' },
            { name: 'Anger', value: 'anger' },
            { name: 'Fear', value: 'fear' },
            { name: 'Surprise', value: 'surprise' },
            { name: 'Disgust', value: 'disgust' },
            { name: 'Neutral', value: 'neutral' }
          ]
        });
        character.emotionalState.primaryEmotion = newEmotion;
        break;
      // Add more cases as needed
    }

    character.updatedAt = new Date();
    this.save(character);
    console.log(chalk.green('\n✅ Character updated successfully!'));
    await this.pressAnyKey();
  }

  /**
   * Delete character
   */
  async deleteCharacter(): Promise<void> {
    const characters = this.loadAll();
    
    if (characters.length === 0) {
      console.log(chalk.yellow('\n📭 No characters found.'));
      await this.pressAnyKey();
      return;
    }

    const choices = characters.map(char => ({
      name: `${char.name} (${char.emotionalState.primaryEmotion})`,
      value: char.id
    }));

    const selectedId = await select({
      message: 'Select character to delete:',
      choices
    });

    const character = this.findById(selectedId);
    if (!character) {
      console.log(chalk.red('\n❌ Character not found!'));
      await this.pressAnyKey();
      return;
    }

    const confirmed = await confirm({
      message: `Are you sure you want to delete '${character.name}'?`
    });

    if (confirmed) {
      this.delete(selectedId);
      console.log(chalk.green(`\n✅ Character '${character.name}' deleted successfully!`));
    } else {
      console.log(chalk.yellow('\n⚠️  Deletion cancelled.'));
    }

    await this.pressAnyKey();
  }

  /**
   * Search characters
   */
  async searchCharacters(): Promise<void> {
    const query = await input({
      message: 'Search characters (name or description):',
      validate: (value) => value.length > 0 || 'Search query is required'
    });

    const results = this.search(query);
    
    if (results.length === 0) {
      console.log(chalk.yellow(`\n📭 No characters found matching '${query}'.`));
      await this.pressAnyKey();
      return;
    }

    const table = new Table({
      head: ['Name', 'Description', 'Primary Emotion'],
      colWidths: [20, 40, 15]
    });

    results.forEach(char => {
      table.push([
        char.name,
        char.description.substring(0, 37) + (char.description.length > 37 ? '...' : ''),
        char.emotionalState.primaryEmotion
      ]);
    });

    console.log(`\n🔍 Search Results for '${query}':\n`);
    console.log(table.toString());
    await this.pressAnyKey();
  }

  /**
   * Show character details
   */
  async showCharacter(characterId?: string): Promise<void> {
    const characters = this.loadAll();
    
    if (characters.length === 0) {
      console.log(chalk.yellow('\n📭 No characters found. Create one first!'));
      await this.pressAnyKey();
      return;
    }

    let character;
    
    if (characterId) {
      character = this.findById(characterId);
      if (!character) {
        console.log(chalk.red(`\n❌ Character with ID '${characterId}' not found!`));
        await this.pressAnyKey();
        return;
      }
    } else {
      const choices = characters.map(char => ({
        name: `${char.name} (${char.emotionalState.primaryEmotion})`,
        value: char.id
      }));

      const selectedId = await select({
        message: 'Select character to view:',
        choices
      });

      character = this.findById(selectedId);
      if (!character) {
        console.log(chalk.red('\n❌ Character not found!'));
        await this.pressAnyKey();
        return;
      }
    }

    console.log(chalk.blue(`\n👤 Character Details: ${character.name}\n`));
    console.log(`${chalk.bold('ID:')} ${character.id}`);
    console.log(`${chalk.bold('Name:')} ${character.name}`);
    console.log(`${chalk.bold('Description:')} ${character.description}`);
    console.log(`${chalk.bold('Background:')} ${character.background}`);
    
    if (character.personality.length > 0) {
      console.log(`${chalk.bold('Personality:')} ${character.personality.join(', ')}`);
    }
    
    if (character.goals.length > 0) {
      console.log(`${chalk.bold('Goals:')} ${character.goals.join(', ')}`);
    }
    
    console.log(`${chalk.bold('Relationships:')} ${Object.keys(character.relationships).length} defined`);
    console.log(`${chalk.bold('Primary Emotion:')} ${character.emotionalState.primaryEmotion}`);
    console.log(`${chalk.bold('Emotional Intensity:')} ${character.emotionalState.intensity}/10`);
    
    if (character.traits.strengths.length > 0) {
      console.log(`${chalk.bold('Strengths:')} ${character.traits.strengths.join(', ')}`);
    }
    
    if (character.traits.weaknesses.length > 0) {
      console.log(`${chalk.bold('Weaknesses:')} ${character.traits.weaknesses.join(', ')}`);
    }
    
    if (character.traits.quirks.length > 0) {
      console.log(`${chalk.bold('Quirks:')} ${character.traits.quirks.join(', ')}`);
    }
    
    // AI Model Information
    if (character.aiModel) {
      console.log(`${chalk.bold('AI Model:')} ${character.aiModel.provider}/${character.aiModel.model}`);
      if (character.aiModel.apiKey) {
        console.log(`${chalk.bold('Custom API Key:')} ${chalk.green('✓ Configured')}`);
      }
      if (character.aiModel.maxTokens) {
        console.log(`${chalk.bold('Max Tokens:')} ${character.aiModel.maxTokens}`);
      }
      if (character.aiModel.temperature) {
        console.log(`${chalk.bold('Temperature:')} ${character.aiModel.temperature}`);
      }
      if (character.aiModel.baseUrl) {
        console.log(`${chalk.bold('Base URL:')} ${character.aiModel.baseUrl}`);
      }
    } else {
      console.log(`${chalk.bold('AI Model:')} ${chalk.yellow('Not configured')}`);
    }
    
    console.log(`${chalk.bold('Created:')} ${new Date(character.createdAt).toLocaleString()}`);
    console.log(`${chalk.bold('Updated:')} ${new Date(character.updatedAt).toLocaleString()}`);
    
    await this.pressAnyKey();
  }

  /**
   * Show character analytics
   */
  async showAnalytics(): Promise<void> {
    const characters = this.loadAll();
    
    if (characters.length === 0) {
      console.log(chalk.yellow('\n📭 No characters found. Create some first!'));
      await this.pressAnyKey();
      return;
    }

    // Calculate analytics
    const emotionCounts = characters.reduce((acc, char) => {
      acc[char.emotionalState.primaryEmotion] = (acc[char.emotionalState.primaryEmotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgTraits = characters.reduce((sum, char) => {
      return sum + char.traits.strengths.length + char.traits.weaknesses.length + char.traits.quirks.length;
    }, 0) / characters.length;

    console.log(chalk.blue('\n📊 Character Analytics\n'));
    console.log(`Total Characters: ${chalk.bold(characters.length)}`);
    console.log(`Average Traits per Character: ${chalk.bold(avgTraits.toFixed(1))}`);
    console.log('\nEmotion Distribution:');
    
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      const percentage = ((count / characters.length) * 100).toFixed(1);
      console.log(`  ${emotion}: ${count} (${percentage}%)`);
    });

    await this.pressAnyKey();
  }

  /**
   * Get model choices for a specific provider
   */
  private getModelChoicesForProvider(provider: string): Array<{name: string, value: string}> {
    switch (provider) {
      case 'openai':
        return [
          { name: 'GPT-4 Turbo', value: 'gpt-4-turbo-preview' },
          { name: 'GPT-4', value: 'gpt-4' },
          { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
          { name: 'GPT-3.5 Turbo 16k', value: 'gpt-3.5-turbo-16k' }
        ];
      case 'anthropic':
        return [
          { name: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
          { name: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
          { name: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' },
          { name: 'Claude 2.1', value: 'claude-2.1' },
          { name: 'Claude 2.0', value: 'claude-2.0' }
        ];
      case 'google':
        return [
          { name: 'Gemini Pro', value: 'gemini-pro' },
          { name: 'Gemini Pro Vision', value: 'gemini-pro-vision' }
        ];
      case 'groq':
        return [
          { name: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
          { name: 'LLaMA2 70B', value: 'llama2-70b-4096' },
          { name: 'Gemma 7B', value: 'gemma-7b-it' }
        ];
      case 'cohere':
        return [
          { name: 'Command', value: 'command' },
          { name: 'Command Light', value: 'command-light' },
          { name: 'Command Nightly', value: 'command-nightly' }
        ];
      case 'local':
        return [
          { name: 'Custom Local Model', value: 'local-model' },
          { name: 'Ollama Model', value: 'ollama' },
          { name: 'LM Studio', value: 'lm-studio' }
        ];
      default:
        return [{ name: 'Default Model', value: 'default' }];
    }
  }

  /**
   * Export a single character to file
   */
  private async exportCharacter(): Promise<void> {
    const characters = this.loadAll();
    if (characters.length === 0) {
      console.log(chalk.yellow('No characters found to export.'));
      return;
    }

    // Select character to export
    const characterChoices = characters.map((char: CharacterSheet) => ({
      name: `${char.name} - ${char.description}`,
      value: char.id
    }));

    const selectedId = await select({
      message: 'Select character to export:',
      choices: characterChoices
    });

    const character = characters.find((c: CharacterSheet) => c.id === selectedId);
    if (!character) {
      console.log(chalk.red('Character not found.'));
      return;
    }

    // Select export format
    const format = await select({
      message: 'Select export format:',
      choices: [
        { name: 'JSON (recommended)', value: 'json' },
        { name: 'YAML', value: 'yaml' },
        { name: 'Environment Variables (.env)', value: 'env' }
      ]
    }) as 'json' | 'yaml' | 'env';

    try {
      const filepath = await this.fileManager.exportCharacterFile(character, format);
      console.log(chalk.green(`\n✅ Character exported successfully!`));
      console.log(chalk.cyan(`📁 File location: ${filepath}`));
      console.log(chalk.gray(`💡 You can now use this file in your applications or share it with others.`));
      
      if (character.aiModel) {
        console.log(chalk.yellow(`\n⚠️  Note: Make sure to configure your API keys before using this character.`));
        if (character.aiModel.apiKey) {
          console.log(chalk.yellow(`🔑 API Key: ${character.aiModel.apiKey ? 'Configured' : 'Not configured'}`));
        }
      }
    } catch (error) {
      console.log(chalk.red(`❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }

    await this.pressAnyKey();
  }

  /**
   * Export all characters to files
   */
  private async exportAllCharacters(): Promise<void> {
    const characters = this.loadAll();
    if (characters.length === 0) {
      console.log(chalk.yellow('No characters found to export.'));
      return;
    }

    // Select export format
    const format = await select({
      message: 'Select export format for all characters:',
      choices: [
        { name: 'JSON (recommended)', value: 'json' },
        { name: 'YAML', value: 'yaml' },
        { name: 'Environment Variables (.env)', value: 'env' }
      ]
    }) as 'json' | 'yaml' | 'env';

    // Confirm export
    const confirmed = await confirm({
      message: `Export ${characters.length} character(s) as ${format.toUpperCase()} files?`,
      default: true
    });

    if (!confirmed) {
      console.log(chalk.yellow('Export cancelled.'));
      return;
    }

    try {
      console.log(chalk.blue(`\n📦 Exporting ${characters.length} characters...`));
      const filepaths = await this.fileManager.exportAllCharacters(characters, format);
      
      console.log(chalk.green(`\n✅ All characters exported successfully!`));
      console.log(chalk.cyan(`📁 Export directory: ${this.fileManager.getOutputDirectory()}`));
      console.log(chalk.gray(`📄 Files created: ${filepaths.length}`));
      
      // Show summary
      const charactersWithModels = characters.filter((c: CharacterSheet) => c.aiModel).length;
      if (charactersWithModels > 0) {
        console.log(chalk.yellow(`\n⚠️  ${charactersWithModels} character(s) have AI models configured.`));
        console.log(chalk.yellow(`🔑 Make sure to configure API keys before using these characters.`));
      }
      
      console.log(chalk.gray(`\n💡 An index file has been created to help you manage all exported characters.`));
    } catch (error) {
      console.log(chalk.red(`❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }

    await this.pressAnyKey();
  }

  /**
   * Wait for user input
   */
  private async pressAnyKey(): Promise<void> {
    await input({ message: 'Press Enter to continue...' });
  }
}