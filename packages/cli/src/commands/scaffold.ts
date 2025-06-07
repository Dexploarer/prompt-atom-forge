/**
 * @fileoverview Scaffold Command for generating web UI projects
 * @module @prompt-or-die/cli/commands/scaffold
 */

import { Command } from 'commander';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { input, select, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';

interface ScaffoldOptions {
  name: string;
  template: 'basic' | 'full' | 'minimal';
  features: string[];
  directory?: string;
  interactive?: boolean;
}

/**
 * Create scaffold command
 */
export function createScaffoldCommand(): Command {
  const scaffold = new Command('scaffold');
  scaffold.description('Generate web UI projects and components');

  // Web subcommand
  scaffold
    .command('web')
    .description('Generate a new web UI project')
    .option('-n, --name <name>', 'Project name')
    .option('-d, --dir <directory>', 'Output directory')
    .option('-t, --template <template>', 'Template type (basic|full|minimal)', 'basic')
    .option('--no-interactive', 'Skip interactive prompts')
    .action(async (options) => {
      try {
        const projectOptions = await gatherWebProjectOptions(options);
        const outputDir = options.dir || projectOptions.name;
        
        await generateWebProject(projectOptions, outputDir);
        
        console.log(chalk.green(`\n✅ Web UI project '${projectOptions.name}' generated successfully!`));
        console.log(chalk.blue(`\n📁 Project location: ${outputDir}`));
        console.log(chalk.yellow(`\n🚀 Next steps:`));
        console.log(`   cd ${outputDir}`);
        console.log(`   npm install`);
        console.log(`   npm run dev`);
        
      } catch (error) {
        console.error(chalk.red('❌ Failed to generate web project:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Component subcommand
  scaffold
    .command('component')
    .alias('comp')
    .description('Generate a new component')
    .option('-n, --name <name>', 'Component name')
    .option('-t, --type <type>', 'Component type (page|component|hook)', 'component')
    .option('-d, --dir <directory>', 'Output directory', './src/components')
    .action(async (options) => {
      try {
        const componentOptions = await gatherComponentOptions(options);
        await generateComponent(componentOptions);
        
        console.log(chalk.green(`\n✅ Component '${componentOptions.name}' generated successfully!`));
        
      } catch (error) {
        console.error(chalk.red('❌ Failed to generate component:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return scaffold;
}

/**
 * Gather web project options through interactive prompts
 */
async function gatherWebProjectOptions(options: any): Promise<ScaffoldOptions> {
  const projectOptions: ScaffoldOptions = {
    name: '',
    template: 'basic',
    features: []
  };

  if (options.interactive !== false) {
    // Project name
    projectOptions.name = options.name || await input({
      message: 'What is your project name?',
      default: 'my-prompt-or-die-app',
      validate: (input: string) => {
        if (!input.trim()) return 'Project name is required';
        if (!/^[a-z0-9-_]+$/i.test(input)) return 'Project name can only contain letters, numbers, hyphens, and underscores';
        return true;
      }
    });

    // Template selection
    projectOptions.template = options.template || await select({
      message: 'Choose a template:',
      choices: [
        { name: 'Basic - Essential components and routing', value: 'basic' },
        { name: 'Full - Complete Prompt-or-Die experience', value: 'full' },
        { name: 'Minimal - Bare bones setup', value: 'minimal' }
      ]
    });

    // Feature selection
    if (projectOptions.template !== 'minimal') {
      const availableFeatures = [
        { name: 'Authentication (Supabase)', value: 'auth' },
        { name: 'Database Integration', value: 'database' },
        { name: 'MCP Server Support', value: 'mcp' },
        { name: 'Analytics Dashboard', value: 'analytics' },
        { name: 'Import/Export', value: 'import-export' },
        { name: 'Dark Mode', value: 'dark-mode' }
      ];

      projectOptions.features = await select({
        message: 'Select features to include:',
        choices: availableFeatures
      }) as any;
    }
  } else {
    projectOptions.name = options.name || 'my-prompt-or-die-app';
    projectOptions.template = options.template || 'basic';
  }

  return projectOptions;
}

/**
 * Gather component options
 */
async function gatherComponentOptions(options: any) {
  return {
    name: options.name || await input({
      message: 'Component name:',
      validate: (input: string) => input.trim() ? true : 'Component name is required'
    }),
    type: options.type || await select({
      message: 'Component type:',
      choices: [
        { name: 'React Component', value: 'component' },
        { name: 'Page Component', value: 'page' },
        { name: 'Custom Hook', value: 'hook' }
      ]
    }),
    directory: options.dir
  };
}

/**
 * Generate web project files
 */
async function generateWebProject(options: ScaffoldOptions, outputDir: string): Promise<void> {
  const spinner = ora('Generating web project...').start();

  try {
    // Create project directory
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Generate package.json
    await generatePackageJson(options, outputDir);
    
    // Generate basic project structure
    await generateProjectStructure(options, outputDir);
    
    // Generate configuration files
    await generateConfigFiles(options, outputDir);
    
    // Generate source files based on template
    await generateSourceFiles(options, outputDir);
    
    spinner.succeed('Web project generated successfully!');
  } catch (error) {
    spinner.fail('Failed to generate web project');
    throw error;
  }
}

/**
 * Generate package.json for the web project
 */
async function generatePackageJson(options: ScaffoldOptions, outputDir: string): Promise<void> {
  const packageJson = {
    name: options.name,
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
      'lint:fix': 'eslint . --ext ts,tsx --fix',
      format: 'prettier --write .'
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      'react-router-dom': '^6.20.0',
      '@radix-ui/react-slot': '^1.0.2',
      'class-variance-authority': '^0.7.0',
      clsx: '^2.0.0',
      'tailwind-merge': '^2.0.0'
    } as Record<string, string>,
    devDependencies: {
      '@types/react': '^18.2.37',
      '@types/react-dom': '^18.2.15',
      '@typescript-eslint/eslint-plugin': '^6.10.0',
      '@typescript-eslint/parser': '^6.10.0',
      '@vitejs/plugin-react-swc': '^3.5.0',
      autoprefixer: '^10.4.16',
      eslint: '^8.53.0',
      'eslint-plugin-react-hooks': '^4.6.0',
      'eslint-plugin-react-refresh': '^0.4.4',
      postcss: '^8.4.31',
      prettier: '^3.1.0',
      tailwindcss: '^3.3.5',
      typescript: '^5.2.2',
      vite: '^5.0.0'
    }
  };

  // Add conditional dependencies based on features
  if (options.features.includes('auth') || options.features.includes('database')) {
    packageJson.dependencies['@supabase/supabase-js'] = '^2.38.0';
  }

  if (options.features.includes('mcp')) {
    packageJson.dependencies['@prompt-or-die/core'] = '^1.0.0';
  }

  writeFileSync(
    join(outputDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

/**
 * Generate basic project structure
 */
async function generateProjectStructure(options: ScaffoldOptions, outputDir: string): Promise<void> {
  const directories = [
    'src',
    'src/components',
    'src/components/ui',
    'src/hooks',
    'src/lib',
    'src/pages',
    'src/types',
    'public'
  ];

  if (options.features.includes('auth') || options.features.includes('database')) {
    directories.push('src/integrations', 'src/integrations/supabase');
  }

  directories.forEach(dir => {
    const fullPath = join(outputDir, dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
    }
  });
}

/**
 * Generate configuration files
 */
async function generateConfigFiles(options: ScaffoldOptions, outputDir: string): Promise<void> {
  // Vite config
  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
`;

  // Tailwind config
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'death-black': '#000000',
        'bone-white': '#FFFFFF',
        'inferno-red': '#FF2E2E',
        'glitch-blue': '#00F0FF',
      },
    },
  },
  plugins: [],
}
`;

  // TypeScript config
  const tsConfig = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
`;

  writeFileSync(join(outputDir, 'vite.config.ts'), viteConfig);
  writeFileSync(join(outputDir, 'tailwind.config.js'), tailwindConfig);
  writeFileSync(join(outputDir, 'tsconfig.json'), tsConfig);
  writeFileSync(join(outputDir, 'index.html'), generateIndexHtml(options));
}

/**
 * Generate source files based on template
 */
async function generateSourceFiles(options: ScaffoldOptions, outputDir: string): Promise<void> {
  // Generate main App component
  writeFileSync(join(outputDir, 'src/App.tsx'), generateAppComponent(options));
  writeFileSync(join(outputDir, 'src/main.tsx'), generateMainFile(options));
  writeFileSync(join(outputDir, 'src/index.css'), generateIndexCSS());
  
  // Generate basic components based on template
  if (options.template === 'full' || options.template === 'basic') {
    writeFileSync(join(outputDir, 'src/components/Header.tsx'), generateHeaderComponent());
    writeFileSync(join(outputDir, 'src/pages/Home.tsx'), generateHomeComponent());
  }

  // Generate utility files
  writeFileSync(join(outputDir, 'src/lib/utils.ts'), generateUtilsFile());
}

/**
 * Generate component files
 */
async function generateComponent(options: any): Promise<void> {
  const { name, type, directory } = options;
  const componentName = name.charAt(0).toUpperCase() + name.slice(1);
  
  let content = '';
  let fileName = '';
  
  switch (type) {
    case 'component':
      fileName = `${componentName}.tsx`;
      content = generateReactComponent(componentName);
      break;
    case 'page':
      fileName = `${componentName}.tsx`;
      content = generatePageComponent(componentName);
      break;
    case 'hook':
      fileName = `use${componentName}.ts`;
      content = generateCustomHook(componentName);
      break;
  }
  
  const fullPath = join(directory, fileName);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
  
  writeFileSync(fullPath, content);
}

// Template generation functions
function generateIndexHtml(options: ScaffoldOptions): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${options.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

function generateAppComponent(options: ScaffoldOptions): string {
  if (options.template === 'minimal') {
    return `import './index.css'

function App() {
  return (
    <div className="min-h-screen bg-death-black text-bone-white">
      <h1 className="text-4xl font-bold text-center py-8">
        Welcome to ${options.name}
      </h1>
    </div>
  )
}

export default App
`;
  }

  return `import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import './index.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-death-black text-bone-white">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
`;
}

function generateMainFile(options: ScaffoldOptions): string {
  return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
}

function generateIndexCSS(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --death-black: 0 0% 0%;
    --bone-white: 0 0% 100%;
    --inferno-red: 0 82% 59%;
    --glitch-blue: 186 100% 50%;
  }

  * {
    @apply border-border;
  }
  
  body {
    @apply bg-death-black text-bone-white;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
`;
}

function generateHeaderComponent(): string {
  return `export default function Header() {
  return (
    <header className="border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-inferno-red">
          Prompt or Die
        </h1>
        <nav>
          <a href="/" className="text-bone-white hover:text-glitch-blue transition-colors">
            Home
          </a>
        </nav>
      </div>
    </header>
  )
}
`;
}

function generateHomeComponent(): string {
  return `export default function Home() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-6 text-inferno-red">
          Welcome to Prompt or Die
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          The ultimate prompt engineering toolkit
        </p>
        <button className="bg-inferno-red hover:bg-red-600 text-bone-white px-8 py-3 rounded-lg font-semibold transition-colors">
          Get Started
        </button>
      </div>
    </div>
  )
}
`;
}

function generateUtilsFile(): string {
  return `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;
}

function generateReactComponent(name: string): string {
  return `interface ${name}Props {
  // Add your props here
}

export default function ${name}({}: ${name}Props) {
  return (
    <div>
      <h2>${name} Component</h2>
    </div>
  )
}
`;
}

function generatePageComponent(name: string): string {
  return `export default function ${name}() {
  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-6">${name}</h1>
      <p>Welcome to the ${name} page.</p>
    </div>
  )
}
`;
}

function generateCustomHook(name: string): string {
  return `import { useState, useEffect } from 'react'

export function use${name}() {
  const [state, setState] = useState(null)

  useEffect(() => {
    // Add your hook logic here
  }, [])

  return {
    state,
    setState
  }
}
`;
}