/**
 * Enhanced Type Definitions for Prompt-or-Die SDK
 * Maintains cult branding and adds comprehensive type safety
 */

// Core Prompt Block Types (as defined in the cult doctrine)
export type PromptBlockType = 'intent' | 'tone' | 'format' | 'context' | 'persona';

// Enhanced block interface with metadata
export interface PromptBlock<T = unknown> {
  readonly type: PromptBlockType;
  readonly content: string;
  readonly metadata?: PromptBlockMetadata;
  readonly validation?: PromptBlockValidation;
  readonly variables?: Record<string, T>;
}

// Block metadata for the Circle's tracking
export interface PromptBlockMetadata {
  readonly id?: string;
  readonly version?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
  readonly author?: string;
  readonly tags?: readonly string[];
  readonly category?: string;
  readonly description?: string;
  readonly isTemplate?: boolean;
  readonly usageCount?: number;
  readonly effectiveness?: number; // 0-1 score
}

// Validation rules for prompt blocks
export interface PromptBlockValidation {
  readonly required?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: RegExp;
  readonly customValidator?: (content: string) => ValidationResult;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors?: readonly string[];
  readonly warnings?: readonly string[];
  readonly suggestions?: readonly string[];
}

// Enhanced prompt output with comprehensive metadata
export interface PromptOutput<T = unknown> {
  readonly prompt: string;
  readonly blocks: readonly PromptBlock<T>[];
  readonly metadata: PromptOutputMetadata;
  readonly validation: ValidationResult;
  readonly performance?: PromptPerformanceMetrics;
}

export interface PromptOutputMetadata {
  readonly id: string;
  readonly version: string;
  readonly createdAt: Date;
  readonly buildTime: number; // milliseconds
  readonly blockCount: number;
  readonly totalLength: number;
  readonly hashId: string; // SHA-256 hash for caching
  readonly cultApproval?: CultApproval; // The Circle's blessing
}

// The Circle's approval system
export interface CultApproval {
  readonly approved: boolean;
  readonly approver?: string;
  readonly approvalDate?: Date;
  readonly sanctity: 'heretical' | 'acceptable' | 'blessed' | 'divine';
  readonly notes?: string;
}

export interface PromptPerformanceMetrics {
  readonly estimatedTokens: number;
  readonly estimatedCost: number;
  readonly qualityScore: number; // 0-1
  readonly clarityScore: number; // 0-1
  readonly specificityScore: number; // 0-1
  readonly biasScore: number; // 0-1 (lower is better)
  readonly expectedLatency: number; // milliseconds
}

// Injection modes for prompt modification
export type InjectionMode = 'prepend' | 'append' | 'replace' | 'merge' | 'overwrite';

export interface InjectionOptions {
  readonly mode: InjectionMode;
  readonly position?: number;
  readonly delimiter?: string;
  readonly preserveFormatting?: boolean;
  readonly validation?: PromptBlockValidation;
}

// Builder pattern interfaces
export interface PromptBuilder<T = unknown> {
  addBlock(block: PromptBlock<T>): PromptBuilder<T>;
  removeBlock(type: PromptBlockType): PromptBuilder<T>;
  setMetadata(metadata: Partial<PromptOutputMetadata>): PromptBuilder<T>;
  validate(): ValidationResult;
  build(): PromptOutput<T>;
  optimize(): Promise<PromptOutput<T>>;
  clone(): PromptBuilder<T>;
}

// Error types for the prompt system
export abstract class PromptError extends Error {
  abstract readonly code: string;
  abstract readonly severity: 'warning' | 'error' | 'critical';
  readonly timestamp: Date;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends PromptError {
  readonly code = 'VALIDATION_ERROR';
  readonly severity = 'error' as const;
  readonly field: string;
  readonly value: unknown;

  constructor(field: string, value: unknown, message: string) {
    super(`Validation failed for ${field}: ${message}`);
    this.field = field;
    this.value = value;
  }
}

export class BuildError extends PromptError {
  readonly code = 'BUILD_ERROR';
  readonly severity = 'critical' as const;
  readonly blocks: readonly PromptBlock[];

  constructor(blocks: readonly PromptBlock[], message: string) {
    super(`Build failed: ${message}`);
    this.blocks = blocks;
  }
}

export class InjectionError extends PromptError {
  readonly code = 'INJECTION_ERROR';
  readonly severity = 'error' as const;
  readonly mode: InjectionMode;
  readonly target: string;

  constructor(mode: InjectionMode, target: string, message: string) {
    super(`Injection failed (${mode}): ${message}`);
    this.mode = mode;
    this.target = target;
  }
}

// Terminal and CLI types
export interface TerminalCommand {
  readonly name: string;
  readonly description: string;
  readonly aliases?: readonly string[];
  readonly usage?: string;
  readonly examples?: readonly string[];
  readonly requiredAuth?: boolean;
  readonly category: 'auth' | 'navigation' | 'prompt' | 'system' | 'cult' | 'token';
}

export interface TerminalOutput {
  readonly text: string;
  readonly type: 'command' | 'output' | 'error' | 'success' | 'warning' | 'prompt' | 'cult';
  readonly timestamp: Date;
  readonly metadata?: Record<string, unknown>;
}

export interface CommandResult {
  readonly success: boolean;
  readonly output: readonly TerminalOutput[];
  readonly error?: Error;
  readonly executionTime: number;
}

// Token and wallet types (for the $POD ecosystem)
export interface TokenData {
  readonly symbol: string;
  readonly price: number;
  readonly marketCap: number;
  readonly volume24h: number;
  readonly change24h: number;
  readonly totalSupply: number;
  readonly circulatingSupply: number;
  readonly holders: number;
  readonly network: 'solana' | 'ethereum' | 'polygon';
}

export interface WalletState {
  readonly connected: boolean;
  readonly address?: string;
  readonly balance: number;
  readonly podBalance: number;
  readonly network: string;
  readonly provider?: string;
}

export interface Transaction {
  readonly id: string;
  readonly type: 'buy' | 'sell' | 'transfer';
  readonly amount: number;
  readonly price: number;
  readonly fee: number;
  readonly timestamp: Date;
  readonly status: 'pending' | 'confirmed' | 'failed';
  readonly hash?: string;
}

// Configuration and settings
export interface SDKConfig {
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly timeout: number;
  readonly retryAttempts: number;
  readonly enableCaching: boolean;
  readonly enableAnalytics: boolean;
  readonly cultMode: boolean; // Enables special cult features
  readonly debug: boolean;
}

export interface CultSettings {
  readonly enableMysticism: boolean;
  readonly phraseRotation: boolean;
  readonly terminalSacrifice: boolean; // Special terminal mode
  readonly sanctityChecking: boolean;
  readonly autoApproval: boolean;
}

// Utility types for enhanced type safety
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type NonEmptyArray<T> = [T, ...T[]];

export type PromptBlockMap = {
  readonly [K in PromptBlockType]: PromptBlock<unknown>[];
};

export type CommandHandler<T = unknown> = (
  args: readonly string[],
  context: T,
) => Promise<CommandResult> | CommandResult;

// Brand types for type safety
declare const __brand: unique symbol;
export type Brand<K, T> = K & { readonly [__brand]: T };

export type PromptId = Brand<string, 'PromptId'>;
export type UserId = Brand<string, 'UserId'>;
export type ProjectId = Brand<string, 'ProjectId'>;
export type WalletAddress = Brand<string, 'WalletAddress'>;

// Template and project types
export interface PromptTemplate {
  readonly id: PromptId;
  readonly name: string;
  readonly description: string;
  readonly blocks: readonly PromptBlock[];
  readonly category: string;
  readonly tags: readonly string[];
  readonly author: UserId;
  readonly isPublic: boolean;
  readonly usageCount: number;
  readonly rating: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly cultStatus: CultApproval;
}

export interface Project {
  readonly id: ProjectId;
  readonly name: string;
  readonly description: string;
  readonly templates: readonly PromptTemplate[];
  readonly owner: UserId;
  readonly collaborators: readonly UserId[];
  readonly settings: ProjectSettings;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ProjectSettings {
  readonly visibility: 'private' | 'public' | 'circle-only';
  readonly allowForking: boolean;
  readonly enableComments: boolean;
  readonly autoBackup: boolean;
  readonly cultIntegration: boolean;
}

// Event types for analytics and monitoring
export interface PromptEvent {
  readonly type: string;
  readonly promptId?: PromptId;
  readonly userId?: UserId;
  readonly data: Record<string, unknown>;
  readonly timestamp: Date;
  readonly session: string;
}

export type EventHandler<T extends PromptEvent = PromptEvent> = (event: T) => void;

// Export utility type guards
export const isPromptBlock = (obj: unknown): obj is PromptBlock =>
  typeof obj === 'object' &&
  obj !== null &&
  'type' in obj &&
  'content' in obj &&
  typeof (obj as any).type === 'string' &&
  typeof (obj as any).content === 'string';

export const isValidBlockType = (type: string): type is PromptBlockType =>
  ['intent', 'tone', 'format', 'context', 'persona'].includes(type);

export const isValidInjectionMode = (mode: string): mode is InjectionMode =>
  ['prepend', 'append', 'replace', 'merge', 'overwrite'].includes(mode);
