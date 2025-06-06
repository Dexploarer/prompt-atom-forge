/**
 * @fileoverview Emotion management for CLI
 * @module @prompt-or-die/cli/managers/EmotionManager
 */

import { input, select, confirm, number } from '@inquirer/prompts';
import chalk from 'chalk';
import * as Table from 'cli-table3';
import { BaseManager } from './BaseManager.js';
import { EmotionalState } from '../types.js';

/**
 * Emotion manager class
 */
export class EmotionManager extends BaseManager<EmotionalState> {
  constructor(dataDir: string) {
    super(dataDir, 'emotions.json');
  }

  /**
   * Emotion management menu
   */
  async showMenu(): Promise<void> {
    const action = await select({
      message: 'Emotion Management Options:',
      choices: [
        { name: '🎭 Create Emotional State', value: 'create' },
        { name: '📋 List Emotional States', value: 'list' },
        { name: '✏️ Edit Emotional State', value: 'edit' },
        { name: '🗑️ Delete Emotional State', value: 'delete' },
        { name: '🔍 Search Emotional States', value: 'search' },
        { name: '🎨 Emotion Presets', value: 'presets' },
        { name: '🔄 Blend Emotions', value: 'blend' },
        { name: '📊 Emotion Analytics', value: 'analytics' },
        { name: '📤 Export Emotions', value: 'export' },
        { name: '📥 Import Emotions', value: 'import' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });

    switch (action) {
      case 'create':
        await this.createEmotion();
        break;
      case 'list':
        await this.listEmotions();
        break;
      case 'edit':
        await this.editEmotion();
        break;
      case 'delete':
        await this.deleteEmotion();
        break;
      case 'search':
        await this.searchEmotions();
        break;
      case 'presets':
        await this.showPresets();
        break;
      case 'blend':
        await this.blendEmotions();
        break;
      case 'analytics':
        await this.showAnalytics();
        break;
      case 'export':
        await this.exportEmotions();
        break;
      case 'import':
        await this.importEmotions();
        break;
      case 'back':
        return;
    }
  }

  /**
   * Create new emotional state
   */
  async createEmotion(): Promise<void> {
    console.log(chalk.blue('\n🎭 Create Emotional State\n'));

    const name = await input({
      message: 'Emotion name:',
      validate: (value) => value.length > 0 || 'Name is required'
    });

    const description = await input({
      message: 'Description (optional):'
    });

    const primaryEmotion = await select({
      message: 'Primary emotion:',
      choices: [
        { name: '😊 Joy', value: 'joy' },
        { name: '😢 Sadness', value: 'sadness' },
        { name: '😠 Anger', value: 'anger' },
        { name: '😨 Fear', value: 'fear' },
        { name: '🤢 Disgust', value: 'disgust' },
        { name: '😲 Surprise', value: 'surprise' },
        { name: '🤔 Anticipation', value: 'anticipation' },
        { name: '🙏 Trust', value: 'trust' },
        { name: '😐 Neutral', value: 'neutral' }
      ]
    });

    const intensity = await number({
      message: 'Intensity (0-100):',
      min: 0,
      max: 100,
      default: 50
    });

    const valence = await number({
      message: 'Valence - positive/negative (-100 to 100):',
      min: -100,
      max: 100,
      default: 0
    });

    const arousal = await number({
      message: 'Arousal - calm/excited (0-100):',
      min: 0,
      max: 100,
      default: 50
    });

    const dominance = await number({
      message: 'Dominance - submissive/dominant (0-100):',
      min: 0,
      max: 100,
      default: 50
    });

    // Secondary emotions
    const hasSecondary = await confirm({
      message: 'Add secondary emotions?'
    });

    let secondaryEmotions: Array<{ emotion: string; weight: number }> = [];
    if (hasSecondary) {
      let addMore = true;
      while (addMore && secondaryEmotions.length < 3) {
        const secondaryEmotion = await select({
          message: `Secondary emotion ${secondaryEmotions.length + 1}:`,
          choices: [
            { name: '😊 Joy', value: 'joy' },
            { name: '😢 Sadness', value: 'sadness' },
            { name: '😠 Anger', value: 'anger' },
            { name: '😨 Fear', value: 'fear' },
            { name: '🤢 Disgust', value: 'disgust' },
            { name: '😲 Surprise', value: 'surprise' },
            { name: '🤔 Anticipation', value: 'anticipation' },
            { name: '🙏 Trust', value: 'trust' }
          ].filter(choice => choice.value !== primaryEmotion)
        });

        const weight = await number({
          message: 'Weight (0-100):',
          min: 0,
          max: 100,
          default: 25
        });

        secondaryEmotions.push({ emotion: secondaryEmotion, weight });

        if (secondaryEmotions.length < 3) {
          addMore = await confirm({
            message: 'Add another secondary emotion?'
          });
        }
      }
    }

    // Context tags
    const contextInput = await input({
      message: 'Context tags (comma-separated, optional):'
    });
    const context = contextInput ? contextInput.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    // Triggers
    const triggersInput = await input({
      message: 'Triggers (comma-separated, optional):'
    });
    const triggers = triggersInput ? triggersInput.split(',').map(trigger => trigger.trim()).filter(Boolean) : [];

    // Responses
    const responsesInput = await input({
      message: 'Typical responses (comma-separated, optional):'
    });
    const responses = responsesInput ? responsesInput.split(',').map(response => response.trim()).filter(Boolean) : [];

    const emotion: EmotionalState = {
      id: Date.now().toString(),
      name,
      description: description || undefined,
      primaryEmotion,
      intensity,
      valence,
      arousal,
      dominance,
      secondaryEmotions: secondaryEmotions.map(se => se.emotion),
      context,
      triggers,
      responses,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.save(emotion);
    console.log(chalk.green(`\n✅ Emotional state '${name}' created successfully!`));
    await this.pressAnyKey();
  }

  /**
   * List all emotional states
   */
  async listEmotions(): Promise<void> {
    const emotions = await this.loadAll();
    
    if (emotions.length === 0) {
      console.log(chalk.yellow('\n📭 No emotional states found.'));
      await this.pressAnyKey();
      return;
    }

    console.log(chalk.blue(`\n📋 Emotional States (${emotions.length} total)\n`));

    const table = new Table({
      head: ['Name', 'Primary', 'Intensity', 'Valence', 'Context', 'Created'],
      colWidths: [20, 15, 10, 10, 25, 12]
    });

    emotions.forEach(emotion => {
      const emotionIcon = this.getEmotionIcon(emotion.primaryEmotion);
      const valenceColor = emotion.valence >= 0 ? chalk.green : chalk.red;
      const contextStr = emotion.context.slice(0, 3).join(', ');
      const contextDisplay = emotion.context.length > 3 ? `${contextStr}...` : contextStr;
      
      table.push([
        emotion.name,
        `${emotionIcon} ${emotion.primaryEmotion}`,
        `${emotion.intensity}%`,
        valenceColor(`${emotion.valence > 0 ? '+' : ''}${emotion.valence}`),
        contextDisplay || '-',
        emotion.createdAt.toLocaleDateString()
      ]);
    });

    console.log(table.toString());
    await this.pressAnyKey();
  }

  /**
   * Edit emotional state
   */
  async editEmotion(): Promise<void> {
    const emotions = await this.loadAll();
    
    if (emotions.length === 0) {
      console.log(chalk.yellow('\n📭 No emotional states found.'));
      await this.pressAnyKey();
      return;
    }

    const choices = emotions.map(emotion => ({
      name: `${this.getEmotionIcon(emotion.primaryEmotion)} ${emotion.name} (${emotion.primaryEmotion})`,
      value: emotion.id
    }));

    const emotionId = await select({
      message: 'Select emotional state to edit:',
      choices
    });

    const emotion = await this.findById(emotionId);
    if (!emotion) {
      console.log(chalk.red('\n❌ Emotional state not found.'));
      await this.pressAnyKey();
      return;
    }

    const field = await select({
      message: 'What would you like to edit?',
      choices: [
        { name: 'Name', value: 'name' },
        { name: 'Description', value: 'description' },
        { name: 'Primary Emotion', value: 'primaryEmotion' },
        { name: 'Intensity', value: 'intensity' },
        { name: 'Valence', value: 'valence' },
        { name: 'Arousal', value: 'arousal' },
        { name: 'Dominance', value: 'dominance' },
        { name: 'Context Tags', value: 'context' },
        { name: 'Triggers', value: 'triggers' },
        { name: 'Responses', value: 'responses' }
      ]
    });

    switch (field) {
      case 'name':
        emotion.name = await input({
          message: 'New name:',
          default: emotion.name,
          validate: (value) => value.length > 0 || 'Name is required'
        });
        break;
      case 'description':
        emotion.description = await input({
          message: 'New description:',
          default: emotion.description || ''
        }) || undefined;
        break;
      case 'intensity':
        emotion.intensity = await number({
          message: 'New intensity (0-100):',
          default: emotion.intensity,
          min: 0,
          max: 100
        });
        break;
      case 'valence':
        emotion.valence = await number({
          message: 'New valence (-100 to 100):',
          default: emotion.valence,
          min: -100,
          max: 100
        });
        break;
      case 'arousal':
        emotion.arousal = await number({
          message: 'New arousal (0-100):',
          default: emotion.arousal,
          min: 0,
          max: 100
        });
        break;
      case 'dominance':
        emotion.dominance = await number({
          message: 'New dominance (0-100):',
          default: emotion.dominance,
          min: 0,
          max: 100
        });
        break;
      case 'context':
        const contextInput = await input({
          message: 'New context tags (comma-separated):',
          default: emotion.context.join(', ')
        });
        emotion.context = contextInput ? contextInput.split(',').map(tag => tag.trim()).filter(Boolean) : [];
        break;
      case 'triggers':
        const triggersInput = await input({
          message: 'New triggers (comma-separated):',
          default: emotion.triggers.join(', ')
        });
        emotion.triggers = triggersInput ? triggersInput.split(',').map(trigger => trigger.trim()).filter(Boolean) : [];
        break;
      case 'responses':
        const responsesInput = await input({
          message: 'New responses (comma-separated):',
          default: emotion.responses.join(', ')
        });
        emotion.responses = responsesInput ? responsesInput.split(',').map(response => response.trim()).filter(Boolean) : [];
        break;
    }

    emotion.updatedAt = new Date();
    await this.save(emotion);
    console.log(chalk.green(`\n✅ Emotional state '${emotion.name}' updated successfully!`));
    await this.pressAnyKey();
  }

  /**
   * Delete emotional state
   */
  async deleteEmotion(): Promise<void> {
    const emotions = await this.loadAll();
    
    if (emotions.length === 0) {
      console.log(chalk.yellow('\n📭 No emotional states found.'));
      await this.pressAnyKey();
      return;
    }

    const choices = emotions.map(emotion => ({
      name: `${this.getEmotionIcon(emotion.primaryEmotion)} ${emotion.name} (${emotion.primaryEmotion})`,
      value: emotion.id
    }));

    const emotionId = await select({
      message: 'Select emotional state to delete:',
      choices
    });

    const emotion = await this.findById(emotionId);
    if (!emotion) {
      console.log(chalk.red('\n❌ Emotional state not found.'));
      await this.pressAnyKey();
      return;
    }

    const confirmed = await confirm({
      message: `Are you sure you want to delete '${emotion.name}'?`
    });

    if (confirmed) {
      await this.delete(emotionId);
      console.log(chalk.green(`\n✅ Emotional state '${emotion.name}' deleted successfully!`));
    } else {
      console.log(chalk.yellow('\n❌ Deletion cancelled.'));
    }

    await this.pressAnyKey();
  }

  /**
   * Search emotional states
   */
  async searchEmotions(): Promise<void> {
    const query = await input({
      message: 'Search query:',
      validate: (value) => value.length > 0 || 'Query is required'
    });

    const results = await this.search(query);
    
    if (results.length === 0) {
      console.log(chalk.yellow(`\n🔍 No emotional states found matching '${query}'.`));
      await this.pressAnyKey();
      return;
    }

    console.log(chalk.blue(`\n🔍 Search Results for '${query}' (${results.length} found)\n`));

    const table = new Table({
      head: ['Name', 'Primary', 'Intensity', 'Context'],
      colWidths: [25, 15, 10, 30]
    });

    results.forEach(emotion => {
      const emotionIcon = this.getEmotionIcon(emotion.primaryEmotion);
      const contextStr = emotion.context.slice(0, 2).join(', ');
      const contextDisplay = emotion.context.length > 2 ? `${contextStr}...` : contextStr;
      
      table.push([
        emotion.name,
        `${emotionIcon} ${emotion.primaryEmotion}`,
        `${emotion.intensity}%`,
        contextDisplay || '-'
      ]);
    });

    console.log(table.toString());
    await this.pressAnyKey();
  }

  /**
   * Show emotion presets
   */
  async showPresets(): Promise<void> {
    console.log(chalk.blue('\n🎨 Emotion Presets\n'));

    const presets = [
      {
        name: 'Happy & Excited',
        primary: 'joy',
        intensity: 80,
        valence: 75,
        arousal: 85,
        context: ['celebration', 'achievement', 'success']
      },
      {
        name: 'Calm & Peaceful',
        primary: 'neutral',
        intensity: 30,
        valence: 20,
        arousal: 15,
        context: ['meditation', 'relaxation', 'nature']
      },
      {
        name: 'Anxious & Worried',
        primary: 'fear',
        intensity: 70,
        valence: -60,
        arousal: 80,
        context: ['uncertainty', 'deadline', 'pressure']
      },
      {
        name: 'Frustrated & Angry',
        primary: 'anger',
        intensity: 75,
        valence: -70,
        arousal: 90,
        context: ['obstacle', 'injustice', 'conflict']
      },
      {
        name: 'Melancholic & Sad',
        primary: 'sadness',
        intensity: 60,
        valence: -80,
        arousal: 25,
        context: ['loss', 'nostalgia', 'loneliness']
      }
    ];

    const table = new Table({
      head: ['Preset', 'Primary', 'Intensity', 'Valence', 'Arousal', 'Context'],
      colWidths: [20, 12, 10, 10, 10, 25]
    });

    presets.forEach(preset => {
      const emotionIcon = this.getEmotionIcon(preset.primary);
      const valenceColor = preset.valence >= 0 ? chalk.green : chalk.red;
      
      table.push([
        preset.name,
        `${emotionIcon} ${preset.primary}`,
        `${preset.intensity}%`,
        valenceColor(`${preset.valence > 0 ? '+' : ''}${preset.valence}`),
        `${preset.arousal}%`,
        preset.context.join(', ')
      ]);
    });

    console.log(table.toString());

    const usePreset = await confirm({
      message: 'Would you like to create an emotion from a preset?'
    });

    if (usePreset) {
      const choices = presets.map((preset, index) => ({
        name: `${this.getEmotionIcon(preset.primary)} ${preset.name}`,
        value: index
      }));

      const presetIndex = await select({
        message: 'Select preset:',
        choices
      });

      const selectedPreset = presets[presetIndex];
      const name = await input({
        message: 'Name for this emotion:',
        default: selectedPreset.name
      });

      const emotion: EmotionalState = {
        id: Date.now().toString(),
        name,
        primaryEmotion: selectedPreset.primary,
        intensity: selectedPreset.intensity,
        valence: selectedPreset.valence,
        arousal: selectedPreset.arousal,
        dominance: 50,
        secondaryEmotions: [],
        context: selectedPreset.context,
        triggers: [],
        responses: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.save(emotion);
      console.log(chalk.green(`\n✅ Emotional state '${name}' created from preset!`));
    }

    await this.pressAnyKey();
  }

  /**
   * Blend emotions
   */
  async blendEmotions(): Promise<void> {
    const emotions = await this.loadAll();
    
    if (emotions.length < 2) {
      console.log(chalk.yellow('\n📭 Need at least 2 emotional states to blend.'));
      await this.pressAnyKey();
      return;
    }

    console.log(chalk.blue('\n🔄 Blend Emotions\n'));

    const choices = emotions.map(emotion => ({
      name: `${this.getEmotionIcon(emotion.primaryEmotion)} ${emotion.name} (${emotion.primaryEmotion})`,
      value: emotion.id
    }));

    const emotion1Id = await select({
      message: 'Select first emotion:',
      choices
    });

    const emotion2Id = await select({
      message: 'Select second emotion:',
      choices: choices.filter(choice => choice.value !== emotion1Id)
    });

    const emotion1 = await this.findById(emotion1Id);
    const emotion2 = await this.findById(emotion2Id);

    if (!emotion1 || !emotion2) {
      console.log(chalk.red('\n❌ Emotions not found.'));
      await this.pressAnyKey();
      return;
    }

    const weight1 = await number({
      message: `Weight for '${emotion1.name}' (0-100):`,
      min: 0,
      max: 100,
      default: 50
    });

    const weight2 = 100 - weight1;

    // Blend the emotions
    const blendedName = await input({
      message: 'Name for blended emotion:',
      default: `${emotion1.name} + ${emotion2.name}`
    });

    const blendedEmotion: EmotionalState = {
      id: Date.now().toString(),
      name: blendedName,
      description: `Blend of ${emotion1.name} (${weight1}%) and ${emotion2.name} (${weight2}%)`,
      primaryEmotion: weight1 >= 50 ? emotion1.primaryEmotion : emotion2.primaryEmotion,
      intensity: Math.round((emotion1.intensity * weight1 + emotion2.intensity * weight2) / 100),
      valence: Math.round((emotion1.valence * weight1 + emotion2.valence * weight2) / 100),
      arousal: Math.round((emotion1.arousal * weight1 + emotion2.arousal * weight2) / 100),
      dominance: Math.round((emotion1.dominance * weight1 + emotion2.dominance * weight2) / 100),
      secondaryEmotions: [emotion1.primaryEmotion, emotion2.primaryEmotion],
      context: Array.from(new Set([...emotion1.context, ...emotion2.context])),
      triggers: Array.from(new Set([...emotion1.triggers, ...emotion2.triggers])),
      responses: Array.from(new Set([...emotion1.responses, ...emotion2.responses])),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.save(blendedEmotion);
    console.log(chalk.green(`\n✅ Blended emotion '${blendedName}' created successfully!`));
    await this.pressAnyKey();
  }

  /**
   * Show emotion analytics
   */
  async showAnalytics(): Promise<void> {
    const emotions = await this.loadAll();
    
    if (emotions.length === 0) {
      console.log(chalk.yellow('\n📭 No emotional states found.'));
      await this.pressAnyKey();
      return;
    }

    console.log(chalk.blue('\n📊 Emotion Analytics\n'));

    // Basic stats
    const totalEmotions = emotions.length;
    const avgIntensity = Math.round(emotions.reduce((sum, e) => sum + e.intensity, 0) / totalEmotions);
    const avgValence = Math.round(emotions.reduce((sum, e) => sum + e.valence, 0) / totalEmotions);
    const avgArousal = Math.round(emotions.reduce((sum, e) => sum + e.arousal, 0) / totalEmotions);

    console.log(`Total Emotions: ${chalk.bold(totalEmotions)}`);
    console.log(`Average Intensity: ${chalk.bold(avgIntensity)}%`);
    console.log(`Average Valence: ${chalk.bold(avgValence)}`);
    console.log(`Average Arousal: ${chalk.bold(avgArousal)}%`);

    // Primary emotion distribution
    const primaryCounts = emotions.reduce((acc, emotion) => {
      acc[emotion.primaryEmotion] = (acc[emotion.primaryEmotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nPrimary Emotion Distribution:');
    Object.entries(primaryCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([emotion, count]) => {
        const percentage = Math.round((count / totalEmotions) * 100);
        const icon = this.getEmotionIcon(emotion);
        console.log(`  ${icon} ${emotion}: ${count} (${percentage}%)`);
      });

    // Most common context tags
    const allContexts = emotions.flatMap(e => e.context);
    const contextCounts = allContexts.reduce((acc, context) => {
      acc[context] = (acc[context] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(contextCounts).length > 0) {
      console.log('\nMost Common Context Tags:');
      Object.entries(contextCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([context, count]) => {
          console.log(`  ${context}: ${count}`);
        });
    }

    await this.pressAnyKey();
  }

  /**
   * Export emotions
   */
  async exportEmotions(): Promise<void> {
    const emotions = await this.loadAll();
    
    if (emotions.length === 0) {
      console.log(chalk.yellow('\n📭 No emotional states found.'));
      await this.pressAnyKey();
      return;
    }

    const filename = await input({
      message: 'Export filename:',
      default: `emotions-${new Date().toISOString().split('T')[0]}.json`
    });

    try {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        emotions
      };

      const { writeFileSync } = await import('fs');
      writeFileSync(filename, JSON.stringify(exportData, null, 2));
      console.log(chalk.green(`\n✅ Emotions exported to '${filename}'`));
    } catch (error) {
      console.error(chalk.red('\n❌ Export failed:'), error.message);
    }

    await this.pressAnyKey();
  }

  /**
   * Import emotions
   */
  async importEmotions(): Promise<void> {
    const filename = await input({
      message: 'Import filename:',
      validate: (value) => {
        if (!value) return 'Filename is required';
        const { existsSync } = require('fs');
        if (!existsSync(value)) return 'File does not exist';
        return true;
      }
    });

    try {
      const { readFileSync } = await import('fs');
      const data = JSON.parse(readFileSync(filename, 'utf8'));
      
      if (!data.emotions || !Array.isArray(data.emotions)) {
        throw new Error('Invalid file format');
      }

      const overwrite = await confirm({
        message: 'Overwrite existing emotions with same names?'
      });

      let imported = 0;
      let skipped = 0;

      for (const emotion of data.emotions) {
        const existing = await this.findById(emotion.id);
        if (existing && !overwrite) {
          skipped++;
          continue;
        }

        // Ensure required fields
        emotion.createdAt = new Date(emotion.createdAt);
        emotion.updatedAt = new Date(emotion.updatedAt);
        emotion.secondaryEmotions = emotion.secondaryEmotions || [];
        emotion.context = emotion.context || [];
        emotion.triggers = emotion.triggers || [];
        emotion.responses = emotion.responses || [];

        await this.save(emotion);
        imported++;
      }

      console.log(chalk.green(`\n✅ Import completed: ${imported} imported, ${skipped} skipped`));
    } catch (error) {
      console.error(chalk.red('\n❌ Import failed:'), error.message);
    }

    await this.pressAnyKey();
  }

  /**
   * Get emotion icon
   */
  private getEmotionIcon(emotion: string): string {
    const icons: Record<string, string> = {
      joy: '😊',
      sadness: '😢',
      anger: '😠',
      fear: '😨',
      disgust: '🤢',
      surprise: '😲',
      anticipation: '🤔',
      trust: '🙏',
      neutral: '😐'
    };
    return icons[emotion] || '❓';
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