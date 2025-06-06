/**
 * @fileoverview Character management for CLI
 * @module @prompt-or-die/cli/managers/CharacterManager
 */

import { input, select, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import Table from 'cli-table3';
import { BaseManager } from './BaseManager.js';
import { CharacterSheet, EmotionalState } from '../types.js';

/**
 * Character manager class
 */
export class CharacterManager extends BaseManager<CharacterSheet> {
  constructor(dataDir: string) {
    super(dataDir, 'characters.json');
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

    const character: CharacterSheet = {
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
        primary: primaryEmotion,
        intensity: parseInt(intensity),
        triggers: [],
        responses: {},
        history: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.save(character);
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
      head: ['ID', 'Name', 'Primary Emotion', 'Traits', 'Created'],
      colWidths: [15, 20, 15, 15, 12]
    });

    characters.forEach(char => {
      const traitCount = char.traits.strengths.length + char.traits.weaknesses.length + char.traits.quirks.length;
      table.push([
        char.id.substring(0, 12) + '...',
        char.name,
        char.emotionalState.primaryEmotion,
        traitCount.toString(),
        new Date(char.createdAt).toLocaleDateString()
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
        char.emotionalState.primary
      ]);
    });

    console.log(`\n🔍 Search Results for '${query}':\n`);
    console.log(table.toString());
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
   * Wait for user input
   */
  private async pressAnyKey(): Promise<void> {
    await input({
      message: 'Press Enter to continue...'
    });
  }
}