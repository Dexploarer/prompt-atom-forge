/**
 * @fileoverview Type definitions for Prompt or Die CLI
 * @module @prompt-or-die/cli/types
 */

/**
 * Character sheet interface
 */
export interface CharacterSheet {
  id: string;
  name: string;
  description: string;
  personality: string[];
  background: string;
  goals: string[];
  relationships: Record<string, string>;
  traits: {
    strengths: string[];
    weaknesses: string[];
    quirks: string[];
  };
  emotionalState: EmotionalState;
  aiModel?: {
    provider: 'openai' | 'anthropic' | 'google' | 'groq' | 'cohere' | 'local';
    model: string;
    apiKey?: string;
    baseUrl?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Emotional state interface
 */
export interface EmotionalState {
  id: string;
  name: string;
  description?: string;
  primaryEmotion: string;
  intensity: number; // 1-10
  valence: number; // -1 to 1
  arousal: number; // 0 to 1
  dominance: number; // 0 to 1
  secondaryEmotions: string[];
  context: string[];
  triggers: string[];
  responses: string[];
  createdAt: Date;
  updatedAt: Date;
  history?: {
    emotion: string;
    timestamp: Date;
    context: string;
  }[];
}

/**
 * Prompt chain interface
 */
export interface PromptChain {
  id: string;
  name: string;
  description: string;
  steps: PromptChainStep[];
  variables: Record<string, any>;
  conditions: ChainCondition[];
  metadata: {
    tags: string[];
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number; // minutes
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Prompt chain step interface
 */
export interface PromptChainStep {
  id: string;
  name: string;
  prompt: string;
  expectedOutput?: string;
  nextSteps: string[];
  conditions?: ChainCondition[];
  timeout?: number;
  retries?: number;
}

/**
 * Chain condition interface
 */
export interface ChainCondition {
  type: 'contains' | 'equals' | 'regex' | 'length' | 'custom';
  value: any;
  action: 'continue' | 'skip' | 'retry' | 'branch';
  target?: string;
}

/**
 * Contact interface
 */
export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  role?: string;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CLI configuration interface
 */
export interface CLIConfig {
  apiKey: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  outputFormat: string;
  autoSave: boolean;
  backupCount: number;
  theme: string;
  language: string;
  timezone: string;
  dataDir: string;
  editor: string;
  pager: string;
  apiKeys: {
    openai?: string;
    anthropic?: string;
    google?: string;
  };
  defaultSettings: {
    theme: 'light' | 'dark';
    autoSave: boolean;
    verboseOutput: boolean;
  };
  analytics: {
    enabled: boolean;
    trackUsage: boolean;
    trackErrors: boolean;
    shareAnonymous: boolean;
  };
  ui: {
    showIcons: boolean;
    showProgress: boolean;
    colorOutput: boolean;
    compactMode: boolean;
    animateSpinners: boolean;
    showTimestamps: boolean;
  };
  performance: {
    cacheEnabled: boolean;
    cacheSize: number;
    cacheTTL: number;
    parallelRequests: number;
    requestTimeout: number;
  };
  security: {
    encryptData: boolean;
    requireAuth: boolean;
    sessionTimeout: number;
    logSensitiveData: boolean;
  };
  plugins: string[];
  webAppUrl?: string;
}

/**
 * Analytics data interface
 */
export interface AnalyticsData {
  totalPrompts: number;
  totalChains: number;
  totalCharacters: number;
  totalEmotions: number;
  totalCommands: number;
  successRate: number;
  averageExecutionTime: number;
  mostUsedBlocks: string[];
  lastUsed: Date;
  recentActivity: {
    date: Date;
    action: string;
    target: string;
  }[];
}