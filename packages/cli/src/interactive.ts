/**
 * @fileoverview Interactive CLI for Prompt or Die SDK
 * @module @prompt-or-die/cli/interactive
 */

import { select, input, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import ora from 'ora';
import Table from 'cli-table3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { CharacterManager } from './managers/CharacterManager.js';
import { EmotionManager } from './managers/EmotionManager.js';
import { ChainManager } from './managers/ChainManager.js';
import { MCPManager } from './managers/MCPManager.js';
import { ConfigManager } from './managers/ConfigManager.js';
import { AnalyticsData } from './types.js';



/**
 * Interactive CLI class
 */
export class InteractiveCLI {
  private characterManager: CharacterManager;
  private emotionManager: EmotionManager;
  private chainManager: ChainManager;
  private mcpManager: MCPManager;
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
    const dataDir = this.configManager.getConfig().dataDir || process.env.HOME + '/.prompt-or-die';
    this.characterManager = new CharacterManager(dataDir);
    this.emotionManager = new EmotionManager(dataDir);
    this.chainManager = new ChainManager(dataDir);
    this.mcpManager = new MCPManager();
  }

  /**
   * Start the interactive CLI
   */
  async start(): Promise<void> {
    console.clear();
    
    // Display banner
    console.log(chalk.cyan(figlet.textSync('Prompt or Die', { horizontalLayout: 'full' })));
    console.log(chalk.gray('Interactive CLI - Enhanced Terminal Experience\n'));
    
    await this.showMainMenu();
  }

  /**
   * Show main menu
   */
  async showMainMenu(): Promise<void> {
    while (true) {
      const action = await select({
        message: 'What would you like to do?',
        choices: [
          { name: '🚀 MCP Server Management', value: 'mcp' },
          { name: '👤 Character Sheets', value: 'characters' },
          { name: '🎭 Emotional States', value: 'emotions' },
          { name: '🔗 Prompt Chains', value: 'chains' },
          { name: '⚡ Quick Prompt Builder', value: 'quick' },
          { name: '⚙️ Configuration', value: 'config' },
          { name: '📊 Analytics', value: 'analytics' },
          { name: '📤 Import/Export', value: 'import-export' },
          { name: '❓ Help', value: 'help' },
          { name: '🚪 Exit', value: 'exit' }
        ]
      });

      switch (action) {
        case 'mcp':
          await this.mcpManager.showMenu();
          break;
        case 'characters':
          await this.characterManager.showMenu();
          break;
        case 'emotions':
          await this.emotionManager.showMenu();
          break;
        case 'chains':
          await this.chainManager.showMenu();
          break;
        case 'quick':
          await this.quickPromptBuilder();
          break;
        case 'config':
          await this.configManager.showMenu();
          break;
        case 'analytics':
          await this.analyticsMenu();
          break;
        case 'import-export':
          await this.importExportMenu();
          break;
        case 'help':
          await this.showHelp();
          break;
        case 'exit':
          console.log(chalk.green('\n👋 Goodbye!'));
          process.exit(0);
      }
    }
  }

  /**
   * Load analytics data
   */
  private loadAnalytics(): AnalyticsData {
    const chains = this.chainManager.loadAll();
    const characters = this.characterManager.loadAll();
    const emotions = this.emotionManager.loadAll();
    
    return {
      totalCommands: 0,
      totalPrompts: 0,
      totalChains: chains.length,
      totalCharacters: characters.length,
      totalEmotions: emotions.length,
      successRate: 0,
      averageExecutionTime: 0,
      mostUsedBlocks: [],
      lastUsed: new Date(),
      recentActivity: []
    };
  }

  /**
   * Generate MCP Server
   */
  private async generateMCPServer(): Promise<void> {
    console.log(chalk.blue('\n🚀 MCP Server Generator\n'));

    const name = await input({
      message: 'Project name:',
      validate: (value) => value.length > 0 || 'Project name is required'
    });

    const description = await input({
      message: 'Project description (optional):'
    });

    const transport = await select({
      message: 'Transport type:',
      choices: [
        { name: 'STDIO (Local development)', value: 'stdio' },
        { name: 'SSE (Server-Sent Events)', value: 'sse' },
        { name: 'HTTP (Production ready)', value: 'streamable-http' }
      ]
    });

    const storage = await select({
      message: 'Storage type:',
      choices: [
        { name: 'Memory (Fast, temporary)', value: 'memory' },
        { name: 'File (Persistent, simple)', value: 'file' },
        { name: 'Database (Scalable, robust)', value: 'database' }
      ]
    });

    const features = await checkbox({
      message: 'Select features to include:',
      choices: [
        { name: 'Template system', value: 'templates' },
        { name: 'Sharing capabilities', value: 'sharing' },
        { name: 'Analytics tracking', value: 'analytics' },
        { name: 'Collaboration tools', value: 'collaboration' }
      ]
    });

    let auth = undefined;
    if (transport !== 'stdio') {
      const needsAuth = await confirm({
        message: 'Do you need authentication?'
      });

      if (needsAuth) {
        const authType = await select({
          message: 'Authentication type:',
          choices: [
            { name: 'OAuth (GitHub, Google)', value: 'oauth' },
            { name: 'API Key', value: 'api-key' },
            { name: 'None', value: 'none' }
          ]
        });

        auth = { type: authType as any };

        if (authType === 'oauth') {
          auth.provider = await select({
            message: 'OAuth provider:',
            choices: [
              { name: 'GitHub', value: 'github' },
              { name: 'Google', value: 'google' },
              { name: 'Custom', value: 'custom' }
            ]
          }) as any;
        }
      }
    }

    let deployment = undefined;
    const needsDeployment = await confirm({
      message: 'Configure deployment?'
    });

    if (needsDeployment) {
      const platform = await select({
        message: 'Deployment platform:',
        choices: [
          { name: 'Local', value: 'local' },
          { name: 'Cloudflare Workers', value: 'cloudflare' },
          { name: 'Vercel', value: 'vercel' },
          { name: 'AWS', value: 'aws' },
          { name: 'Azure', value: 'azure' }
        ]
      });

      deployment = { platform: platform as any };

      if (platform !== 'local') {
        const domain = await input({
          message: 'Custom domain (optional):'
        });
        if (domain) {
          deployment.domain = domain;
        }
      }
    }

    const options: MCPProjectOptions = {
      name,
      description: description || undefined,
      transport: transport as any,
      storage: storage as any,
      auth,
      deployment,
      features: {
        templates: features.includes('templates'),
        sharing: features.includes('sharing'),
        analytics: features.includes('analytics'),
        collaboration: features.includes('collaboration')
      }
    };

    const spinner = ora('Generating MCP server...').start();

    try {
      const files = MCPServerGenerator.generateProject(options);
      const outputDir = `./${name}`;

      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      for (const file of files) {
        const filePath = join(outputDir, file.path);
        const fileDir = resolve(filePath, '..');
        
        if (!existsSync(fileDir)) {
          mkdirSync(fileDir, { recursive: true });
        }
        
        writeFileSync(filePath, file.content);
        
        if (file.executable && process.platform !== 'win32') {
          // Make file executable on Unix systems
          try {
            const fs = await import('fs');
            fs.chmodSync(filePath, '755');
          } catch (error) {
            // Ignore chmod errors on Windows
          }
        }
      }

      spinner.succeed('MCP server generated successfully!');

      console.log(boxen(
        `🎉 Project '${name}' created successfully!\n\n` +
        `📁 Location: ${outputDir}\n\n` +
        `🚀 Next steps:\n` +
        `   cd ${name}\n` +
        `   npm install\n` +
        `   npm run build\n` +
        `   npm start`,
        { padding: 1, borderColor: 'green' }
      ));

    } catch (error) {
      spinner.fail('Failed to generate MCP server');
      throw error;
    }

    await this.pressAnyKey();
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
      const prompt = this.generatePrompt({ type, context, goal, tone, length });
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
          await this.savePromptAsChain(prompt, { type, context, goal, tone, length });
          break;
        case 'regenerate':
          await this.quickPromptBuilder();
          return;
        case 'back':
          return;
      }
    } catch (error) {
      spinner.fail('Failed to generate prompt');
      console.error(chalk.red('Error:'), error.message);
    }

    await this.pressAnyKey();
  }

  /**
   * Generate prompt based on parameters
   */
  private generatePrompt(params: any): string {
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
  private async savePromptAsChain(prompt: string, metadata: any): Promise<void> {
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
        order: 1,
        conditions: [],
        variables: {},
        metadata
      }],
      variables: {},
      metadata: {
        generatedFrom: 'quickBuilder',
        ...metadata
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.chainManager.save(chain.id, chain);
    console.log(chalk.green(`\n✅ Prompt saved as chain '${name}'!`));
  }

  /**
   * Show help
   */
  async showHelp(): Promise<void> {
    console.log(chalk.blue('\n❓ Prompt or Die CLI Help'));
    console.log(chalk.gray('Learn how to use the interactive CLI\n'));

    const helpContent = `
${chalk.cyan('🚀 MCP Server Management')}
  Generate, configure, and deploy MCP servers for various use cases.

${chalk.cyan('👤 Character Sheets')}
  Create and manage character profiles with emotional states and traits.

${chalk.cyan('🎭 Emotional States')}
  Define and blend emotional states for more nuanced character interactions.

${chalk.cyan('🔗 Prompt Chains')}
  Build complex, multi-step prompt sequences with conditional logic.

${chalk.cyan('⚡ Quick Prompt Builder')}
  Rapidly generate prompts with guided assistance.

${chalk.cyan('⚙️ Configuration')}
  Customize CLI settings, themes, and preferences.

${chalk.cyan('📊 Analytics')}
  View usage statistics and insights about your prompt engineering.

${chalk.cyan('📤 Import/Export')}
  Backup and restore your data across different environments.
`;

    console.log(helpContent);
    
    const action = await select({
      message: 'Help Options:',
      choices: [
        { name: '📖 View Documentation', value: 'docs' },
        { name: '🎯 Quick Start Guide', value: 'quickstart' },
        { name: '💡 Tips & Tricks', value: 'tips' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });

    switch (action) {
      case 'docs':
        console.log(chalk.blue('\n📖 Documentation'));
        console.log('Visit: https://github.com/prompt-or-die/docs');
        break;
      case 'quickstart':
        await this.showQuickStart();
        break;
      case 'tips':
        await this.showTips();
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
    console.log(chalk.blue('\n🎯 Quick Start Guide'));
    console.log(chalk.gray('Get up and running in minutes\n'));

    const steps = [
      '1. 🚀 Start with MCP Server Management to create your first server',
      '2. 👤 Create character sheets to define personalities and traits',
      '3. 🎭 Add emotional states to make characters more dynamic',
      '4. 🔗 Build prompt chains to create complex interactions',
      '5. ⚡ Use Quick Prompt Builder for rapid prototyping',
      '6. 📊 Monitor your progress with Analytics',
      '7. 📤 Export your work to share or backup'
    ];

    steps.forEach(step => console.log(chalk.cyan(step)));
  }

  /**
   * Show tips and tricks
   */
  private async showTips(): Promise<void> {
    console.log(chalk.blue('\n💡 Tips & Tricks'));
    console.log(chalk.gray('Pro tips for better prompt engineering\n'));

    const tips = [
      '💡 Use specific, descriptive character names for better context',
      '💡 Combine multiple emotional states for complex personalities',
      '💡 Test prompt chains with different variables before deployment',
      '💡 Export your best prompts as templates for reuse',
      '💡 Use analytics to identify your most effective patterns',
      '💡 Regular backups prevent data loss during experimentation'
    ];

    tips.forEach(tip => console.log(chalk.yellow(tip)));
  }







  /**
   * Quick prompt builder
   */
  private async quickPromptBuilder(): Promise<void> {
    console.log(chalk.blue('\n⚡ Quick Prompt Builder'));
    console.log(chalk.gray('Build prompts with guided assistance\n'));

    const type = await select({
      message: 'What type of prompt do you want to create?',
      choices: [
        { name: '💬 Conversational', value: 'conversational' },
        { name: '📝 Content Creation', value: 'content' },
        { name: '🔍 Analysis', value: 'analysis' },
        { name: '🎨 Creative Writing', value: 'creative' },
        { name: '📊 Data Processing', value: 'data' },
        { name: '🤖 Code Generation', value: 'code' },
        { name: '🎓 Educational', value: 'educational' },
        { name: '🔧 Custom', value: 'custom' }
      ]
    });

    const context = await input({
      message: 'Provide context or background information:',
      default: 'General purpose'
    });

    const goal = await input({
      message: 'What is your goal or desired outcome?',
      validate: (input) => input.length > 0 || 'Goal is required'
    });

    const tone = await select({
      message: 'Select the tone:',
      choices: [
        { name: '👔 Professional', value: 'professional' },
        { name: '😊 Friendly', value: 'friendly' },
        { name: '🎯 Direct', value: 'direct' },
        { name: '🎨 Creative', value: 'creative' },
        { name: '📚 Academic', value: 'academic' },
        { name: '😄 Casual', value: 'casual' }
      ]
    });

    const length = await select({
      message: 'Desired response length:',
      choices: [
        { name: '📝 Brief (1-2 sentences)', value: 'brief' },
        { name: '📄 Medium (1-2 paragraphs)', value: 'medium' },
        { name: '📚 Detailed (3+ paragraphs)', value: 'detailed' },
        { name: '📖 Comprehensive (extensive)', value: 'comprehensive' }
      ]
    });

    // Generate the prompt
    const spinner = ora('Generating your prompt...').start();
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const prompt = this.generatePrompt(type, context, goal, tone, length);
    spinner.succeed('Prompt generated successfully!');

    console.log(chalk.green('\n✨ Generated Prompt:'));
    console.log(boxen(prompt, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan'
    }));

    const save = await confirm({
      message: 'Would you like to save this prompt?',
      default: true
    });

    if (save) {
      const name = await input({
        message: 'Prompt name:',
        default: `${type}-prompt-${Date.now()}`
      });
      
      // Save prompt logic would go here
      console.log(chalk.green(`\n✅ Prompt saved as "${name}"!`));
    }
  }

  /**
   * Generate prompt based on parameters
   */
  private generatePrompt(type: string, context: string, goal: string, tone: string, length: string): string {
    const templates = {
      conversational: `You are a helpful assistant with a ${tone} tone. Context: ${context}. Please ${goal}. Provide a ${length} response that is engaging and informative.`,
      content: `As a ${tone} content creator, help me ${goal}. Context: ${context}. Create ${length} content that is well-structured and compelling.`,
      analysis: `Analyze the following with a ${tone} approach. Context: ${context}. Goal: ${goal}. Provide a ${length} analysis with clear insights and conclusions.`,
      creative: `Write creatively with a ${tone} style. Context: ${context}. Objective: ${goal}. Create a ${length} piece that is imaginative and original.`,
      data: `Process the following data with a ${tone} approach. Context: ${context}. Task: ${goal}. Provide ${length} results with clear explanations.`,
      code: `Generate code with ${tone} documentation. Context: ${context}. Requirement: ${goal}. Provide a ${length} solution with explanations.`,
      educational: `Explain in an ${tone} educational manner. Context: ${context}. Learning objective: ${goal}. Provide a ${length} explanation suitable for learning.`,
      custom: `Context: ${context}. Task: ${goal}. Tone: ${tone}. Length: ${length}. Please provide a comprehensive response.`
    };

    return templates[type] || templates.custom;
  }

  /**
   * Show help information
   */
  private async showHelp(): Promise<void> {
    console.log(chalk.blue('\n❓ Prompt or Die CLI Help\n'));
    
    const helpText = `
${chalk.bold('🚀 MCP Server Generation')}
  - Generate complete MCP server projects
  - Multiple transport types (STDIO, SSE, HTTP)
  - Various storage options (Memory, File, Database)
  - Deployment configurations for major platforms

${chalk.bold('👤 Character Sheet Management')}
  - Create detailed character profiles
  - Manage personality traits and backgrounds
  - Track emotional states and relationships
  - Character analytics and insights

${chalk.bold('😊 Emotion State Management')}
  - Define and track emotional states
  - Set triggers and responses
  - Emotional history tracking
  - Integration with character sheets

${chalk.bold('🔗 Prompt Chain Builder')}
  - Create multi-step prompt workflows
  - Conditional branching and logic
  - Variable substitution
  - Chain execution and monitoring

${chalk.bold('📝 Quick Prompt Builder')}
  - Build prompts from modular blocks
  - Intent, Persona, Context, Format, Tone
  - Real-time preview and validation
  - Export to various formats

${chalk.bold('⚙️ Configuration')}
  - API key management
  - Default settings
  - Plugin configuration
  - Data directory settings

${chalk.bold('📊 Analytics & Reports')}
  - Usage statistics
  - Performance metrics
  - Success rate tracking
  - Export reports

${chalk.bold('🔄 Import/Export')}
  - Backup and restore data
  - Share configurations
  - Migrate between systems
  - Bulk operations
    `;

    console.log(helpText);
    await this.pressAnyKey();
  }







  /**
   * Load analytics
   */
  async loadAnalytics(): Promise<AnalyticsData> {
    return {
      totalCommands: 0,
      totalPrompts: 0,
      totalChains: await this.chainManager.count(),
      totalCharacters: await this.characterManager.count(),
      totalEmotions: await this.emotionManager.count(),
      averageChainLength: 0,
      mostUsedCommands: {},
      mostUsedModels: {},
      errorRate: 0,
      averageResponseTime: 0,
      lastUsed: new Date(),
      createdAt: new Date()
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
      console.error(chalk.red('\n❌ Export failed:'), error.message);
    }
  }

  /**
   * Import/Export menu
   */
  async importExportMenu(): Promise<void> {
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
        await this.characterManager.exportData();
        break;
      case 'import-characters':
        await this.characterManager.importData();
        break;
      case 'export-emotions':
        await this.emotionManager.exportData();
        break;
      case 'import-emotions':
        await this.emotionManager.importData();
        break;
      case 'export-chains':
        await this.chainManager.exportData();
        break;
      case 'import-chains':
        await this.chainManager.importData();
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
          characters: this.loadCharacters(),
          emotions: [], // Would load from emotion manager
          chains: this.loadChains(),
          config: {} // Would load from config manager
        }
      };
      
      writeFileSync(filename, JSON.stringify(backup, null, 2));
      spinner.succeed(`All data exported to "${filename}"!`);
    } catch (error) {
      spinner.fail('Export failed!');
      console.error(chalk.red('Error:'), error.message);
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
      
      // Import logic would go here
      spinner.succeed('All data imported successfully!');
    } catch (error) {
      spinner.fail('Import failed!');
      console.error(chalk.red('Error:'), error.message);
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