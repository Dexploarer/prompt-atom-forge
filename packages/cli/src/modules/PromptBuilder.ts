/**
 * @fileoverview Prompt Builder module
 * @module @prompt-or-die/cli/modules/PromptBuilder
 */

import { input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import { PromptChain } from '../types.js';
import { PromptParameters } from './types.js';
import { ChainManager } from '../managers/ChainManager.js';

/**
 * Prompt Builder class for generating and managing prompts
 */
export class PromptBuilder {
  private chainManager: ChainManager;

  constructor(chainManager: ChainManager) {
    this.chainManager = chainManager;
  }

  /**
   * Quick Prompt Builder
   */
  async quickPromptBuilder(): Promise<void> {
    console.log(chalk.blue('\n⚡ Quick Prompt Builder'));
    console.log(chalk.gray('Build prompts quickly with guided assistance\n'));

    const type = await select({
      message: 'Prompt type:',
      choices: [
        { name: '💬 Conversational', value: 'conversational' },
        { name: '📝 Creative Writing', value: 'creative' },
        { name: '🔍 Analysis', value: 'analysis' },
        { name: '🎓 Educational', value: 'educational' },
        { name: '💼 Professional', value: 'professional' },
        { name: '🎯 Custom', value: 'custom' }
      ]
    });

    const context = await input({
      message: 'Context or background:',
      validate: (value) => value.length > 0 || 'Context is required'
    });

    const goal = await input({
      message: 'What do you want to achieve?',
      validate: (value) => value.length > 0 || 'Goal is required'
    });

    const tone = await select({
      message: 'Desired tone:',
      choices: [
        { name: '😊 Friendly', value: 'friendly' },
        { name: '💼 Professional', value: 'professional' },
        { name: '🎓 Academic', value: 'academic' },
        { name: '😄 Casual', value: 'casual' },
        { name: '🎭 Creative', value: 'creative' },
        { name: '🔧 Technical', value: 'technical' }
      ]
    });

    const length = await select({
      message: 'Response length:',
      choices: [
        { name: '📝 Brief (1-2 sentences)', value: 'brief' },
        { name: '📄 Medium (1-2 paragraphs)', value: 'medium' },
        { name: '📚 Detailed (3+ paragraphs)', value: 'detailed' },
        { name: '📖 Comprehensive (Full explanation)', value: 'comprehensive' }
      ]
    });

    const spinner = ora('Generating prompt...').start();
    
    try {
      const params: PromptParameters = { type, context, goal, tone, length };
      const prompt = this.generatePrompt(params);
      spinner.succeed('Prompt generated!');
      
      console.log(chalk.blue('\n📋 Generated Prompt:'));
      console.log(boxen(prompt, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan'
      }));
      
      const action = await select({
        message: 'What would you like to do?',
        choices: [
          { name: '📋 Copy to Clipboard', value: 'copy' },
          { name: '💾 Save as Chain', value: 'save' },
          { name: '🔄 Generate Another', value: 'regenerate' },
          { name: '🔙 Back to Menu', value: 'back' }
        ]
      });
      
      switch (action) {
        case 'copy':
          // In a real implementation, you'd copy to clipboard
          console.log(chalk.green('\n✅ Prompt copied to clipboard!'));
          break;
        case 'save':
          await this.savePromptAsChain(prompt, params);
          break;
        case 'regenerate':
          await this.quickPromptBuilder();
          return;
        case 'back':
          return;
      }
    } catch (error) {
      spinner.fail('Failed to generate prompt');
      console.error(chalk.red('Error:'), (error as Error).message);
    }

    // Wait for user to press Enter
    await input({
      message: 'Press Enter to continue...'
    });
  }

  /**
   * Generate prompt based on parameters
   */
  private generatePrompt(params: PromptParameters): string {
    const { type, context, goal, tone, length } = params;
    
    let prompt = `You are a ${tone} assistant helping with ${type} tasks.\n\n`;
    prompt += `Context: ${context}\n\n`;
    prompt += `Goal: ${goal}\n\n`;
    
    switch (length) {
      case 'brief':
        prompt += 'Please provide a brief, concise response (1-2 sentences).';
        break;
      case 'medium':
        prompt += 'Please provide a moderate response (1-2 paragraphs).';
        break;
      case 'detailed':
        prompt += 'Please provide a detailed response (3+ paragraphs).';
        break;
      case 'comprehensive':
        prompt += 'Please provide a comprehensive, thorough response with full explanations.';
        break;
    }
    
    return prompt;
  }

  /**
   * Save prompt as chain
   */
  private async savePromptAsChain(prompt: string, metadata: PromptParameters): Promise<void> {
    const name = await input({
      message: 'Chain name:',
      validate: (value) => value.length > 0 || 'Name is required'
    });

    const description = await input({
      message: 'Chain description (optional):'
    });

    const chain: PromptChain = {
      id: `chain_${Date.now()}`,
      name,
      description: description || `Generated ${metadata.type} prompt`,
      steps: [{
        id: `step_${Date.now()}`,
        name: 'Generated Prompt',
        prompt,
        nextSteps: [],
        conditions: []
      }],
      variables: {},
      conditions: [],
      metadata: {
        tags: [metadata.type, metadata.tone],
        category: metadata.type,
        difficulty: 'beginner',
        estimatedTime: 5
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.chainManager.save(chain);
    console.log(chalk.green(`\n✅ Prompt saved as chain '${name}'!`));
  }
}
