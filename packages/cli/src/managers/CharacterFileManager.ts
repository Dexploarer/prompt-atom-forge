/**
 * @fileoverview Character file management for local storage and export
 * @module @prompt-or-die/cli/managers/CharacterFileManager
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import { CharacterSheet } from '../types.js';

/**
 * Character file configuration interface
 */
export interface CharacterFileConfig {
  id: string;
  name: string;
  description: string;
  personality: string[];
  background: string;
  goals: string[];
  traits: {
    strengths: string[];
    weaknesses: string[];
    quirks: string[];
  };
  emotionalState: {
    primaryEmotion: string;
    intensity: number;
    context: string[];
  };
  aiModel?: {
    provider: string;
    model: string;
    apiKey?: string;
    baseUrl?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  systemPrompt?: string;
  conversationStarters?: string[];
  responseStyle?: {
    tone: string;
    formality: 'casual' | 'formal' | 'mixed';
    verbosity: 'concise' | 'detailed' | 'adaptive';
    creativity: number; // 0-1
  };
  metadata: {
    version: string;
    createdAt: string;
    updatedAt: string;
    exportedAt: string;
    source: 'prompt-or-die-cli';
  };
}

/**
 * Character file manager class
 */
export class CharacterFileManager {
  private outputDir: string;

  constructor(outputDir?: string) {
    this.outputDir = outputDir || join(homedir(), '.prompt-or-die', 'characters');
    this.ensureOutputDirectory();
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDirectory(): void {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Export character to local file
   */
  async exportCharacterFile(character: CharacterSheet, format: 'json' | 'yaml' | 'env' = 'json'): Promise<string> {
    const config = this.convertToFileConfig(character);
    const filename = this.generateFilename(character.name, format);
    const filepath = join(this.outputDir, filename);

    switch (format) {
      case 'json':
        this.writeJSONFile(filepath, config);
        break;
      case 'yaml':
        this.writeYAMLFile(filepath, config);
        break;
      case 'env':
        this.writeEnvFile(filepath, config);
        break;
    }

    console.log(chalk.green(`✅ Character file exported: ${filepath}`));
    return filepath;
  }

  /**
   * Export all characters to local files
   */
  async exportAllCharacters(characters: CharacterSheet[], format: 'json' | 'yaml' | 'env' = 'json'): Promise<string[]> {
    const filepaths: string[] = [];
    
    for (const character of characters) {
      const filepath = await this.exportCharacterFile(character, format);
      filepaths.push(filepath);
    }

    // Create index file
    const indexPath = await this.createIndexFile(characters, format);
    filepaths.push(indexPath);

    return filepaths;
  }

  /**
   * Convert CharacterSheet to CharacterFileConfig
   */
  private convertToFileConfig(character: CharacterSheet): CharacterFileConfig {
    const systemPrompt = this.generateSystemPrompt(character);
    const conversationStarters = this.generateConversationStarters(character);
    
    return <CharacterFileConfig>{
      id: character.id,
      name: character.name,
      description: character.description,
      personality: character.personality,
      background: character.background,
      goals: character.goals,
      traits: character.traits,
      emotionalState: {
        primaryEmotion: character.emotionalState.primaryEmotion,
        intensity: character.emotionalState.intensity,
        context: character.emotionalState.context
      },
      aiModel: character.aiModel,
      systemPrompt,
      conversationStarters,
      responseStyle: {
        tone: this.inferToneFromPersonality(character.personality),
        formality: this.inferFormalityFromBackground(character.background),
        verbosity: 'adaptive',
        creativity: character.aiModel?.temperature || 0.7
      },
      metadata: {
        version: '1.0.0',
        createdAt: character.createdAt.toISOString(),
        updatedAt: character.updatedAt.toISOString(),
        exportedAt: new Date().toISOString(),
        source: 'prompt-or-die-cli'
      }
    };
  }

  /**
   * Generate system prompt for character
   */
  private generateSystemPrompt(character: CharacterSheet): string {
    const traits = [
      ...character.traits.strengths.map(s => `strength: ${s}`),
      ...character.traits.weaknesses.map(w => `weakness: ${w}`),
      ...character.traits.quirks.map(q => `quirk: ${q}`)
    ].join(', ');

    return `You are ${character.name}, ${character.description}.

Background: ${character.background}

Personality: ${character.personality.join(', ')}

Goals: ${character.goals.join(', ')}

Traits: ${traits}

Current emotional state: ${character.emotionalState.primaryEmotion} (intensity: ${character.emotionalState.intensity}/10)

Respond as this character would, maintaining consistency with their personality, background, and current emotional state. Stay true to their goals and let their traits influence your responses naturally.`;
  }

  /**
   * Generate conversation starters
   */
  private generateConversationStarters(character: CharacterSheet): string[] {
    const starters = [
      `Hello! I'm ${character.name}. ${character.description}`,
      `I've been thinking about ${character.goals[0] || 'my goals'} lately...`,
      `You know, ${character.personality[0] || 'I'} always find myself...`
    ];

    if (character.background) {
      starters.push(`My background in ${character.background} has taught me...`);
    }

    return starters;
  }

  /**
   * Infer tone from personality traits
   */
  private inferToneFromPersonality(personality: string[]): string {
    const traits = personality.join(' ').toLowerCase();
    
    if (traits.includes('friendly') || traits.includes('warm')) return 'friendly';
    if (traits.includes('serious') || traits.includes('formal')) return 'serious';
    if (traits.includes('playful') || traits.includes('humorous')) return 'playful';
    if (traits.includes('mysterious') || traits.includes('enigmatic')) return 'mysterious';
    
    return 'balanced';
  }

  /**
   * Infer formality from background
   */
  private inferFormalityFromBackground(background: string): 'casual' | 'formal' | 'mixed' {
    const bg = background.toLowerCase();
    
    if (bg.includes('academic') || bg.includes('professor') || bg.includes('doctor')) return 'formal';
    if (bg.includes('street') || bg.includes('casual') || bg.includes('artist')) return 'casual';
    
    return 'mixed';
  }

  /**
   * Generate filename for character
   */
  private generateFilename(name: string, format: string): string {
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const timestamp = new Date().toISOString().split('T')[0];
    return `${safeName}-${timestamp}.${format}`;
  }

  /**
   * Write JSON file
   */
  private writeJSONFile(filepath: string, config: CharacterFileConfig): void {
    writeFileSync(filepath, JSON.stringify(config, null, 2), 'utf8');
  }

  /**
   * Write YAML file
   */
  private writeYAMLFile(filepath: string, config: CharacterFileConfig): void {
    // Simple YAML serialization (for basic use cases)
    const yaml = this.objectToYAML(config);
    writeFileSync(filepath, yaml, 'utf8');
  }

  /**
   * Write environment file
   */
  private writeEnvFile(filepath: string, config: CharacterFileConfig): void {
    const envContent = [
      `# Character: ${config.name}`,
      `# Generated: ${config.metadata.exportedAt}`,
      '',
      `CHARACTER_ID="${config.id}"`,
      `CHARACTER_NAME="${config.name}"`,
      `CHARACTER_DESCRIPTION="${config.description}"`,
      `CHARACTER_BACKGROUND="${config.background}"`,
      `CHARACTER_PERSONALITY="${config.personality.join(', ')}"`,
      `CHARACTER_GOALS="${config.goals.join(', ')}"`,
      `CHARACTER_PRIMARY_EMOTION="${config.emotionalState.primaryEmotion}"`,
      `CHARACTER_EMOTIONAL_INTENSITY="${config.emotionalState.intensity}"`,
      '',
      '# AI Model Configuration',
      config.aiModel ? [
        `AI_PROVIDER="${config.aiModel.provider}"`,
        `AI_MODEL="${config.aiModel.model}"`,
        config.aiModel.apiKey ? `AI_API_KEY="${config.aiModel.apiKey}"` : '# AI_API_KEY="your-api-key-here"',
        config.aiModel.baseUrl ? `AI_BASE_URL="${config.aiModel.baseUrl}"` : '',
        config.aiModel.maxTokens ? `AI_MAX_TOKENS="${config.aiModel.maxTokens}"` : '',
        config.aiModel.temperature ? `AI_TEMPERATURE="${config.aiModel.temperature}"` : ''
      ].filter(Boolean).join('\n') : '# No AI model configured',
      '',
      '# System Prompt (base64 encoded to preserve formatting)',
      `SYSTEM_PROMPT="${Buffer.from(config.systemPrompt || '').toString('base64')}"`
    ].join('\n');

    writeFileSync(filepath, envContent, 'utf8');
  }

  /**
   * Create index file for all characters
   */
  private async createIndexFile(characters: CharacterSheet[], format: string): Promise<string> {
    const indexData = {
      characters: characters.map(char => ({
        id: char.id,
        name: char.name,
        description: char.description,
        aiModel: char.aiModel ? `${char.aiModel.provider}/${char.aiModel.model}` : null,
        filename: this.generateFilename(char.name, format)
      })),
      metadata: {
        totalCharacters: characters.length,
        exportedAt: new Date().toISOString(),
        format,
        source: 'prompt-or-die-cli'
      }
    };

    const indexPath = join(this.outputDir, `character-index.${format}`);
    
    if (format === 'json') {
      writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
    } else if (format === 'yaml') {
      writeFileSync(indexPath, this.objectToYAML(indexData), 'utf8');
    }

    return indexPath;
  }

  /**
   * Simple object to YAML conversion
   */
  private objectToYAML(obj: any, indent = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        yaml += `${spaces}${key}: null\n`;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${this.objectToYAML(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n${this.objectToYAML(item, indent + 2)}`;
          } else {
            yaml += `${spaces}  - ${JSON.stringify(item)}\n`;
          }
        });
      } else {
        yaml += `${spaces}${key}: ${JSON.stringify(value)}\n`;
      }
    }

    return yaml;
  }

  /**
   * Get output directory
   */
  getOutputDirectory(): string {
    return this.outputDir;
  }

  /**
   * Set output directory
   */
  setOutputDirectory(dir: string): void {
    this.outputDir = dir;
    this.ensureOutputDirectory();
  }
}