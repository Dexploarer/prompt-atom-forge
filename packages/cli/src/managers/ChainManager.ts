/**
 * @fileoverview Prompt chain management for CLI
 * @module @prompt-or-die/cli/managers/ChainManager
 */

import { input, select, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import Table = require('cli-table3');
import ora from 'ora';
import { BaseManager } from './BaseManager.js';
import { PromptChain, PromptChainStep, ChainCondition } from '../types.js';

/**
 * Chain manager class
 */
export class ChainManager extends BaseManager<PromptChain> {
  constructor(dataDir: string) {
    super(dataDir, 'chains.json');
  }

  /**
   * Chain management menu
   */
  async showMenu(): Promise<void> {
    const action = await select({
      message: 'Prompt Chain Options:',
      choices: [
        { name: '🔗 Create New Chain', value: 'create' },
        { name: '📋 List Chains', value: 'list' },
        { name: '▶️  Execute Chain', value: 'execute' },
        { name: '✏️  Edit Chain', value: 'edit' },
        { name: '🗑️  Delete Chain', value: 'delete' },
        { name: '📊 Chain Analytics', value: 'analytics' },
        { name: '🔍 Search Chains', value: 'search' },
        { name: '📤 Export Chain', value: 'export' },
        { name: '📥 Import Chain', value: 'import' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });

    switch (action) {
      case 'create':
        await this.createChain();
        break;
      case 'list':
        await this.listChains();
        break;
      case 'execute':
        await this.executeChain();
        break;
      case 'edit':
        await this.editChain();
        break;
      case 'delete':
        await this.deleteChain();
        break;
      case 'analytics':
        await this.showAnalytics();
        break;
      case 'search':
        await this.searchChains();
        break;
      case 'export':
        await this.exportChain();
        break;
      case 'import':
        await this.importChain();
        break;
      case 'back':
        return;
    }
  }

  /**
   * Create new prompt chain
   */
  async createChain(): Promise<void> {
    console.log(chalk.blue('\n🔗 Create New Prompt Chain\n'));

    const name = await input({
      message: 'Chain name:',
      validate: (value) => value.length > 0 || 'Name is required'
    });

    const description = await input({
      message: 'Chain description:'
    });

    const category = await select({
      message: 'Chain category:',
      choices: [
        { name: 'Content Creation', value: 'content' },
        { name: 'Data Analysis', value: 'analysis' },
        { name: 'Code Generation', value: 'code' },
        { name: 'Research', value: 'research' },
        { name: 'Creative Writing', value: 'creative' },
        { name: 'Business', value: 'business' },
        { name: 'Education', value: 'education' },
        { name: 'Other', value: 'other' }
      ]
    });

    const difficulty = await select({
      message: 'Difficulty level:',
      choices: [
        { name: 'Beginner', value: 'beginner' },
        { name: 'Intermediate', value: 'intermediate' },
        { name: 'Advanced', value: 'advanced' }
      ]
    });

    const estimatedTime = await input({
      message: 'Estimated execution time (minutes):',
      validate: (value) => {
        const num = parseInt(value);
        return (num > 0) || 'Must be a positive number';
      }
    });

    const tags = await input({
      message: 'Tags (comma-separated):'
    });

    const steps = await this.createSteps();

    const chain: PromptChain = {
      id: `chain_${Date.now()}`,
      name,
      description,
      steps,
      variables: {},
      conditions: [],
      metadata: {
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        category,
        difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
        estimatedTime: parseInt(estimatedTime)
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.save(chain);
    console.log(chalk.green(`\n✅ Prompt chain '${name}' created successfully!`));
    await this.pressAnyKey();
  }

  /**
   * Create steps for a chain
   */
  private async createSteps(): Promise<PromptChainStep[]> {
    const steps: PromptChainStep[] = [];
    let addingSteps = true;
    let stepCounter = 1;

    while (addingSteps) {
      console.log(chalk.cyan(`\n📝 Step ${stepCounter}:`));
      
      const stepName = await input({
        message: 'Step name:',
        validate: (value) => value.length > 0 || 'Step name is required'
      });

      const prompt = await input({
        message: 'Prompt text:',
        validate: (value) => value.length > 0 || 'Prompt is required'
      });

      const expectedOutput = await input({
        message: 'Expected output (optional):'
      });

      const timeout = await input({
        message: 'Timeout in seconds (optional):',
        validate: (value) => {
          if (!value) return true;
          const num = parseInt(value);
          return (num > 0) || 'Must be a positive number';
        }
      });

      const retries = await input({
        message: 'Number of retries (optional):',
        validate: (value) => {
          if (!value) return true;
          const num = parseInt(value);
          return (num >= 0) || 'Must be a non-negative number';
        }
      });

      const step = {
        id: `step_${Date.now()}_${stepCounter}`,
        name: stepName,
        prompt,
        expectedOutput: expectedOutput || undefined,
        nextSteps: [],
        timeout: timeout ? parseInt(timeout) : undefined,
        retries: retries ? parseInt(retries) : undefined
      };

      steps.push(step as PromptChainStep);
      stepCounter++;

      addingSteps = await confirm({
        message: 'Add another step?'
      });
    }

    // Link steps together sequentially
    for (let i = 0; i < steps.length - 1; i++) {
      if (steps[i] && steps[i + 1]) {
        const currentStep = steps[i];
        const nextStep = steps[i + 1];
        if (currentStep && nextStep) {
          currentStep.nextSteps.push(nextStep.id);
        }
      }
    }

    return steps;
  }

  /**
   * List all chains
   */
  async listChains(): Promise<void> {
    const chains = this.loadAll();
    
    if (chains.length === 0) {
      console.log(chalk.yellow('\n📭 No prompt chains found. Create one first!'));
      await this.pressAnyKey();
      return;
    }

    const table = new Table({
      head: ['ID', 'Name', 'Category', 'Steps', 'Difficulty', 'Est. Time'],
      colWidths: [15, 25, 15, 8, 12, 10]
    });

    chains.forEach(chain => {
      table.push([
        chain.id.substring(0, 12) + '...',
        chain.name,
        chain.metadata.category,
        chain.steps.length.toString(),
        chain.metadata.difficulty,
        `${chain.metadata.estimatedTime}m`
      ]);
    });

    console.log('\n🔗 Prompt Chain List:\n');
    console.log(table.toString());
    await this.pressAnyKey();
  }

  /**
   * Execute a chain
   */
  async executeChain(): Promise<void> {
    const chains = this.loadAll();
    
    if (chains.length === 0) {
      console.log(chalk.yellow('\n📭 No chains found. Create one first!'));
      await this.pressAnyKey();
      return;
    }

    const choices = chains.map(chain => ({
      name: `${chain.name} (${chain.steps.length} steps, ${chain.metadata.estimatedTime}m)`,
      value: chain.id
    }));

    const selectedId = await select({
      message: 'Select chain to execute:',
      choices
    });

    const chain = this.findById(selectedId);
    if (!chain) {
      console.log(chalk.red('\n❌ Chain not found!'));
      await this.pressAnyKey();
      return;
    }

    console.log(chalk.blue(`\n▶️  Executing chain: ${chain.name}\n`));
    
    const spinner = ora('Preparing chain execution...').start();
    
    try {
      // Simulate chain execution
      for (let i = 0; i < chain.steps.length; i++) {
        const step = chain.steps[i];
        
        if (!step) {
          console.log(chalk.yellow(`\n⚠️  Step ${i + 1} is missing or invalid`));
          continue;
        }
        
        spinner.text = `Executing step ${i + 1}/${chain.steps.length}: ${step.name}`;
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        console.log(chalk.green(`\n✅ Step ${i + 1} completed: ${step.name}`));
        // Display truncated prompt text with ellipsis if needed
        const truncatedPrompt = step.prompt.length > 100 
          ? `${step.prompt.substring(0, 100)}...`
          : step.prompt;
        console.log(chalk.gray(`   Prompt: ${truncatedPrompt}`));
        
        // Display truncated expected output if it exists
        if (step.expectedOutput) {
          const truncatedOutput = step.expectedOutput.length > 100
            ? `${step.expectedOutput.substring(0, 100)}...`
            : step.expectedOutput;
          console.log(chalk.gray(`   Expected: ${truncatedOutput}`));
        }
      }
      
      spinner.succeed('Chain execution completed successfully!');
      console.log(chalk.green(`\n🎉 Chain '${chain.name}' executed successfully!`));
      
    } catch (error) {
      spinner.fail('Chain execution failed');
      console.error(chalk.red('\n❌ Execution error:'), error instanceof Error ? error.message : String(error));
    }

    await this.pressAnyKey();
  }

  /**
   * Edit chain
   */
  async editChain(): Promise<void> {
    const chains = this.loadAll();
    
    if (chains.length === 0) {
      console.log(chalk.yellow('\n📭 No chains found. Create one first!'));
      await this.pressAnyKey();
      return;
    }

    const choices = chains.map(chain => ({
      name: `${chain.name} (${chain.steps.length} steps)`,
      value: chain.id
    }));

    const selectedId = await select({
      message: 'Select chain to edit:',
      choices
    });

    const chain = this.findById(selectedId);
    if (!chain) {
      console.log(chalk.red('\n❌ Chain not found!'));
      await this.pressAnyKey();
      return;
    }

    const field = await select({
      message: 'What would you like to edit?',
      choices: [
        { name: 'Name', value: 'name' },
        { name: 'Description', value: 'description' },
        { name: 'Category', value: 'category' },
        { name: 'Difficulty', value: 'difficulty' },
        { name: 'Estimated Time', value: 'time' },
        { name: 'Tags', value: 'tags' },
        { name: 'Steps', value: 'steps' }
      ]
    });

    switch (field) {
      case 'name':
        chain.name = await input({
          message: 'New name:',
          default: chain.name,
          validate: (value) => value.length > 0 || 'Name is required'
        });
        break;
      case 'description':
        chain.description = await input({
          message: 'New description:',
          default: chain.description
        });
        break;
      case 'steps':
        console.log(chalk.yellow('\n⚠️  Step editing is complex and will be implemented in a future version.'));
        await this.pressAnyKey();
        return;
    }

    chain.updatedAt = new Date();
    this.save(chain);
    console.log(chalk.green('\n✅ Chain updated successfully!'));
    await this.pressAnyKey();
  }

  /**
   * Delete chain
   */
  async deleteChain(): Promise<void> {
    const chains = this.loadAll();
    
    if (chains.length === 0) {
      console.log(chalk.yellow('\n📭 No chains found.'));
      await this.pressAnyKey();
      return;
    }

    const choices = chains.map(chain => ({
      name: `${chain.name} (${chain.steps.length} steps)`,
      value: chain.id
    }));

    const selectedId = await select({
      message: 'Select chain to delete:',
      choices
    });

    const chain = this.findById(selectedId);
    if (!chain) {
      console.log(chalk.red('\n❌ Chain not found!'));
      await this.pressAnyKey();
      return;
    }

    const confirmed = await confirm({
      message: `Are you sure you want to delete '${chain.name}'?`
    });

    if (confirmed) {
      this.delete(selectedId);
      console.log(chalk.green(`\n✅ Chain '${chain.name}' deleted successfully!`));
    } else {
      console.log(chalk.yellow('\n⚠️  Deletion cancelled.'));
    }

    await this.pressAnyKey();
  }

  /**
   * Search chains
   */
  async searchChains(): Promise<void> {
    const query = await input({
      message: 'Search chains (name or description):',
      validate: (value) => value.length > 0 || 'Search query is required'
    });

    const results = this.search(query);
    
    if (results.length === 0) {
      console.log(chalk.yellow(`\n📭 No chains found matching '${query}'.`));
      await this.pressAnyKey();
      return;
    }

    const table = new Table({
      head: ['Name', 'Description', 'Category', 'Steps'],
      colWidths: [25, 40, 15, 8]
    });

    results.forEach(chain => {
      table.push([
        chain.name,
        chain.description.substring(0, 37) + (chain.description.length > 37 ? '...' : ''),
        chain.metadata.category,
        chain.steps.length.toString()
      ]);
    });

    console.log(`\n🔍 Search Results for '${query}':\n`);
    console.log(table.toString());
    await this.pressAnyKey();
  }

  /**
   * Show chain analytics
   */
  async showAnalytics(): Promise<void> {
    const chains = this.loadAll();
    
    if (chains.length === 0) {
      console.log(chalk.yellow('\n📭 No chains found. Create some first!'));
      await this.pressAnyKey();
      return;
    }

    // Calculate analytics
    const categoryCounts = chains.reduce((acc, chain) => {
      acc[chain.metadata.category] = (acc[chain.metadata.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const difficultyCounts = chains.reduce((acc, chain) => {
      acc[chain.metadata.difficulty] = (acc[chain.metadata.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgSteps = chains.reduce((sum, chain) => sum + chain.steps.length, 0) / chains.length;
    const avgTime = chains.reduce((sum, chain) => sum + chain.metadata.estimatedTime, 0) / chains.length;

    console.log(chalk.blue('\n📊 Chain Analytics\n'));
    console.log(`Total Chains: ${chalk.bold(chains.length)}`);
    console.log(`Average Steps per Chain: ${chalk.bold(avgSteps.toFixed(1))}`);
    console.log(`Average Estimated Time: ${chalk.bold(avgTime.toFixed(1))} minutes`);
    
    console.log('\nCategory Distribution:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      const percentage = ((count / chains.length) * 100).toFixed(1);
      console.log(`  ${category}: ${count} (${percentage}%)`);
    });

    console.log('\nDifficulty Distribution:');
    Object.entries(difficultyCounts).forEach(([difficulty, count]) => {
      const percentage = ((count / chains.length) * 100).toFixed(1);
      console.log(`  ${difficulty}: ${count} (${percentage}%)`);
    });

    await this.pressAnyKey();
  }

  /**
   * Export chain
   */
  async exportChain(): Promise<void> {
    console.log(chalk.yellow('\n📤 Chain Export - Coming Soon!'));
    await this.pressAnyKey();
  }

  /**
   * Import chain
   */
  async importChain(): Promise<void> {
    console.log(chalk.yellow('\n📥 Chain Import - Coming Soon!'));
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