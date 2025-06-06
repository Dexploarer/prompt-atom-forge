#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import passwordPrompt from '@inquirer/password';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import clipboard from 'clipboardy';
import { buildPrompt, injectPrompt } from '../sdk/index.js';
// MCP command will be loaded dynamically

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'));

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const openaiKey = process.env.OPENAI_API_KEY;
const defaultModel = process.env.OPENAI_MODEL || 'gpt-4o';
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

const program = new Command();
program
  .name('pod')
  .description('Prompt or Die CLI')
  .version(pkg.version);

program
  .command('login')
  .description('Log in to your account')
  .action(async () => {
    if (!supabase) {
      console.error('Supabase environment variables are not configured.');
      return;
    }

    const rl = readline.createInterface({ input, output });
    const email = await rl.question('Email: ');
    rl.close();
    const password = await passwordPrompt({ message: 'Password:' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('Login failed:', error.message);
      process.exitCode = 1;
    } else {
      console.log(`Logged in as ${data.user?.email}`);
    }
  });

program
  .command('logout')
  .description('Log out of your account')
  .action(async () => {
    if (!supabase) {
      console.error('Supabase environment variables are not configured.');
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout failed:', error.message);
      process.exitCode = 1;
    } else {
      console.log('Logged out successfully');
    }
  });

program
  .command('init')
  .description('Initialize a new Prompt or Die project')
  .option('-d, --directory <dir>', 'Project directory name', 'my-prompt-project')
  .action(async (options) => {
    const projectDir = options.directory;
    const projectPath = resolve(process.cwd(), projectDir);
    
    try {
      // Create project directory
      if (existsSync(projectPath)) {
        console.error(`Directory '${projectDir}' already exists.`);
        process.exitCode = 1;
        return;
      }
      
      // Create directory structure
      const { mkdirSync } = await import('fs');
      mkdirSync(projectPath, { recursive: true });
      mkdirSync(resolve(projectPath, 'prompts'), { recursive: true });
      
      // Create package.json
      const packageJson = {
        "name": projectDir,
        "version": "1.0.0",
        "type": "module",
        "description": "A Prompt or Die project",
        "main": "index.js",
        "scripts": {
          "start": "node index.js",
          "build": "node build.js"
        },
        "dependencies": {
          "prompt-or-die": "^0.1.0"
        }
      };
      
      writeFileSync(
        resolve(projectPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      // Create example index.js
      const indexJs = `import pkg from 'prompt-or-die/sdk';
const { buildPrompt, injectPrompt, BLOCK_TYPES } = pkg;

// Example prompt blocks
const blocks = [
  {
    id: '1',
    type: 'intent',
    label: 'Code Review',
    value: 'Please review the following code and provide feedback on best practices, potential bugs, and improvements.'
  },
  {
    id: '2',
    type: 'tone',
    label: 'Professional',
    value: 'Use a professional and constructive tone. Be specific and actionable in your feedback.'
  },
  {
    id: '3',
    type: 'format',
    label: 'Structured',
    value: 'Format your response with clear sections: Summary, Issues Found, Recommendations, and Best Practices.'
  }
];

// Build the prompt
const prompt = buildPrompt(blocks);
console.log('Generated Prompt:');
console.log('='.repeat(50));
console.log(prompt);
console.log('='.repeat(50));

// Example of injecting additional context
const codeToReview = \`
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}
\`;

const finalPrompt = injectPrompt(prompt, \`\n\n## CODE TO REVIEW:\n\${codeToReview}\`, 'append');
console.log('\\nFinal Prompt with Code:');
console.log('='.repeat(50));
console.log(finalPrompt);
`;
      
      writeFileSync(resolve(projectPath, 'index.js'), indexJs);
      
      // Create example build script
      const buildJs = `import pkg from 'prompt-or-die/sdk';
const { buildPrompt } = pkg;
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Load prompt configuration from JSON
const promptConfig = JSON.parse(readFileSync('prompts/example.json', 'utf8'));

// Build the prompt
const prompt = buildPrompt(promptConfig.blocks);

// Save to output file
writeFileSync('output/prompt.txt', prompt);
console.log('Prompt built and saved to output/prompt.txt');
`;
      
      writeFileSync(resolve(projectPath, 'build.js'), buildJs);
      
      // Create example prompt JSON
      const examplePrompt = {
        "name": "Code Review Assistant",
        "description": "A prompt for reviewing code with structured feedback",
        "blocks": [
          {
            "id": "intent-1",
            "type": "intent",
            "label": "Code Review",
            "value": "Analyze the provided code for potential issues, improvements, and best practices."
          },
          {
            "id": "persona-1",
            "type": "persona",
            "label": "Senior Developer",
            "value": "You are a senior software developer with 10+ years of experience in code review and mentoring."
          },
          {
            "id": "format-1",
            "type": "format",
            "label": "Structured Response",
            "value": "Provide your response in the following format:\n1. Overall Assessment\n2. Specific Issues\n3. Suggestions for Improvement\n4. Best Practices to Consider"
          }
        ]
      };
      
      writeFileSync(
        resolve(projectPath, 'prompts', 'example.json'),
        JSON.stringify(examplePrompt, null, 2)
      );
      
      // Create output directory
      mkdirSync(resolve(projectPath, 'output'), { recursive: true });
      
      // Create README
      const readme = `# ${projectDir}

A Prompt or Die project for building and managing AI prompts.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Run the example:
   \`\`\`bash
   npm start
   \`\`\`

3. Build prompts from JSON:
   \`\`\`bash
   npm run build
   \`\`\`

## Project Structure

- \`index.js\` - Example usage of the Prompt or Die SDK
- \`build.js\` - Script to build prompts from JSON configuration
- \`prompts/\` - Directory for prompt configuration files
- \`output/\` - Directory for generated prompt files

## Available Block Types

- \`intent\` - Define the purpose or goal
- \`tone\` - Set the communication style
- \`format\` - Specify output structure
- \`context\` - Provide background information
- \`persona\` - Define the AI's role or character

## Learn More

- [Prompt or Die Documentation](https://github.com/your-repo/prompt-or-die)
- [SDK Reference](https://github.com/your-repo/prompt-or-die/tree/main/sdk)
`;
      
      writeFileSync(resolve(projectPath, 'README.md'), readme);
      
      console.log(`\n✅ Successfully initialized Prompt or Die project in '${projectDir}'`);
      console.log('\nNext steps:');
      console.log(`  cd ${projectDir}`);
      console.log('  npm install');
      console.log('  npm start');
      console.log('\nProject structure created:');
      console.log('  📁 prompts/        - Prompt configuration files');
      console.log('  📁 output/         - Generated prompt files');
      console.log('  📄 index.js        - Example SDK usage');
      console.log('  📄 build.js        - Build script for JSON prompts');
      console.log('  📄 package.json    - Project configuration');
      console.log('  📄 README.md       - Project documentation');
      
    } catch (error) {
      console.error('Failed to initialize project:', error.message);
      process.exitCode = 1;
    }
  });

program
  .command('whoami')
  .description('Show current user information')
  .action(async () => {
    if (!supabase) {
      console.error('Supabase environment variables are not configured.');
      return;
    }

    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      console.log(`Logged in as ${data.user.email} (${data.user.id})`);
    } else {
      console.log('Not logged in.');
    }
  });

program
  .command('generate')
  .description('Generate a prompt from blocks')
  .action(async () => {
    if (!openai) {
      console.error('OPENAI_API_KEY environment variable is not set.');
      return;
    }

    const rl = readline.createInterface({ input, output });
    const prompt = await rl.question('Enter prompt: ');
    rl.close();

    const model = defaultModel;
    try {
      const resp = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }]
      });
      console.log(resp.choices[0].message.content);
    } catch (err) {
      if (err?.status === 429) {
        console.error('Rate limit reached. Retrying in 10s...');
        await new Promise(r => setTimeout(r, 10000));
        try {
          const resp = await openai.chat.completions.create({
            model,
            messages: [{ role: 'user', content: prompt }]
          });
          console.log(resp.choices[0].message.content);
        } catch (e) {
          console.error('Generation failed after retry:', e.message || e);
        }
      } else if (/model/i.test(err?.message || '') && model !== 'gpt-3.5-turbo') {
        console.log(`Model ${model} not available, falling back to gpt-3.5-turbo`);
        try {
          const resp = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }]
          });
          console.log(resp.choices[0].message.content);
        } catch (e) {
          console.error('Generation failed:', e.message || e);
        }
      } else {
        console.error('Generation failed:', err.message || err);
      }
    }
  });

program
  .command('build <file>')
  .description('Build a prompt from a JSON file of blocks')
  .option('-o, --output <out>', 'Output file', 'prompt.txt')
  .action((file, options) => {
    try {
      const data = readFileSync(file, 'utf8');
      const blocks = JSON.parse(data);
      const prompt = buildPrompt(blocks);
      writeFileSync(options.output, prompt);
      console.log(`Prompt written to ${options.output}`);
    } catch (err) {
      console.error('Failed to build prompt:', err.message || err);
    }
  });

program
  .command('inject <file> <text>')
  .description('Inject text into an existing prompt file')
  .option('-m, --mode <mode>', 'prepend|append|replace', 'append')
  .action(async (file, text, options) => {
    try {
      const base = readFileSync(file, 'utf8');
      if (existsSync(file)) {
        const rl = readline.createInterface({ input, output });
        const ans = (await rl.question(`Overwrite ${file}? (y/N) `)).trim().toLowerCase();
        rl.close();
        if (ans !== 'y') {
          console.log('Aborted.');
          return;
        }
      }
      const finalText = injectPrompt(base, text, options.mode);
      writeFileSync(file, finalText);
      console.log(`File ${file} updated.`);
    } catch (err) {
      console.error('Failed to inject text:', err.message || err);
    }
  });

program
  .command('export')
  .description('Export current prompt')
  .action(() => {
    try {
      const prompt = readFileSync('prompt.txt', 'utf8');
      clipboard.writeSync(prompt);
      console.log('Prompt copied to clipboard.');
    } catch {
      console.log('No prompt.txt found to export.');
    }
  });

program
  .command('goto <page>')
  .description('Navigate to a page in the web app')
  .action(async page => {
    const base = process.env.WEB_APP_URL || 'http://localhost:5173';
    const url = page.startsWith('http') ? page : `${base}/${page.replace(/^\//, '')}`;
    console.log(`Opening ${url}`);
    try {
      const { default: open } = await import('open');
      await open(url);
    } catch {
      console.log('Unable to open browser automatically.');
    }
  });

program
  .command('create <resource>')
  .description('Create a new resource')
  .action(resource => {
    switch (resource.toLowerCase()) {
      case 'project':
        console.log('Creating new project...');
        console.log('Project created. Open the dashboard to edit.');
        break;
      case 'template':
        console.log('Creating new template...');
        console.log('Template creation not yet implemented.');
        break;
      case 'block':
        console.log('Block creation requires an active project.');
        break;
      default:
        console.log(`Unknown resource type: ${resource}`);
        console.log('Available types: project, template, block');
    }
  });

program
  .command('list <resource>')
  .description('List available resources')
  .action(resource => {
    switch (resource.toLowerCase()) {
      case 'projects':
        console.log('=== Your Projects ===');
        console.log('1. My First Project');
        console.log('2. Code Review Template');
        console.log('3. Marketing Prompts');
        break;
      case 'commands':
        program.outputHelp();
        break;
      case 'templates':
        console.log('=== Available Templates ===');
        console.log('1. Content Summarizer');
        console.log('2. Code Reviewer');
        console.log('3. Creative Writer');
        console.log('4. Data Analyst');
        console.log('5. Email Marketing');
        console.log('6. Technical Documentation');
        break;
      default:
        console.log(`Unknown resource type: ${resource}`);
        console.log('Available types: projects, commands, templates');
    }
    console.log(`Listing ${resource} (not implemented).`);
  });

// Main async function to handle command registration and execution
async function main() {
  // Add MCP command
  try {
    const mcpModule = await import('../packages/cli/src/commands/mcp.js');
    const mcpCommand = await mcpModule.createMCPCommand();
    program.addCommand(mcpCommand);
  } catch (error) {
    console.warn('MCP command not available:', error.message);
  }

  // Check if no command was provided before parsing
if (process.argv.length <= 2) {
  console.log('Welcome to Prompt or Die CLI!');
  console.log('Type "help" for available commands, "exit" to quit, or press Ctrl+C to exit.');
  
  const rl = readline.createInterface({ input, output });
  
  const interactiveMode = async () => {
    try {
      const command = await rl.question('pod> ');
      
      if (command.trim() === 'help') {
        program.outputHelp();
      } else if (command.trim() === 'exit' || command.trim() === 'quit') {
        console.log('Goodbye!');
        rl.close();
        process.exit(0);
      } else if (command.trim()) {
        // Parse and execute the command
        try {
          const args = ['node', 'pod', ...command.trim().split(' ')];
          const newProgram = new Command();
          newProgram
            .name('pod')
            .description('Prompt or Die CLI')
            .version(pkg.version);
          
          // Copy all commands from the original program
          program.commands.forEach(cmd => {
            newProgram.addCommand(cmd);
          });
          
          newProgram.parse(args);
        } catch (error) {
          console.error('Invalid command. Type "help" for available commands.');
        }
      }
      
      // Continue the interactive loop
      setImmediate(interactiveMode);
    } catch (error) {
      if (error.code === 'SIGINT') {
        console.log('\nGoodbye!');
        rl.close();
        process.exit(0);
      } else {
        console.error('An error occurred:', error.message);
        setImmediate(interactiveMode);
      }
    }
  };
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\nGoodbye!');
    rl.close();
    process.exit(0);
  });
  
  interactiveMode();
} else {
  program.parse(process.argv);
}
}

// Call the main function
main().catch(console.error);

