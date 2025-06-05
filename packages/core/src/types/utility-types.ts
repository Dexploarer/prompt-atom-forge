/**
 * Advanced TypeScript utility types for prompt building
 */

/**
 * A branded type for enforcing type safety on string IDs
 */
export type Brand<K, T> = K & { __brand: T };

/**
 * A branded type for prompt block IDs
 */
export type PromptBlockId = Brand<string, 'PromptBlockId'>;

/**
 * Represents a value that can be memoized/cached
 */
export interface Cacheable<T> {
  value: T;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Makes all properties of T required and non-nullable
 */
export type Required<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

/**
 * Template literal type for validating prompt patterns
 */
export type PromptPattern = `{{${string}}}`;

/**
 * Extracts variables from a prompt template pattern
 */
export type ExtractVariables<T extends string> = 
  T extends `${infer _Start}{{${infer Var}}}${infer Rest}` 
    ? Var | ExtractVariables<Rest>
    : never;

/**
 * Maps template variable names to their value types
 */
export type TemplateVariables<T extends string> = {
  [K in ExtractVariables<T>]: string | number | boolean;
};

/**
 * Special type to enforce model compatibility
 */
export type ModelCompatible<M extends string> = {
  compatibleModels: M[];
};

/**
 * Conditional type for feature flags
 */
export type WithFeatureFlag<T, Flag extends boolean> = Flag extends true ? T : never;

/**
 * Type for versioned entities
 */
export type Versioned<T> = T & {
  version: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Mapped type for transformations
 */
export type Transform<T, U> = {
  [K in keyof T]: (value: T[K]) => U;
};

/**
 * Discriminated union for prompt block types
 */
export type PromptBlockType = 
  | { type: 'text'; content: string }
  | { type: 'system'; content: string }
  | { type: 'user'; content: string }
  | { type: 'assistant'; content: string }
  | { type: 'function'; content: Record<string, unknown> };

/**
 * Deep partial type for nested objects
 */
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

/**
 * Type for async prompt results
 */
export type AsyncPromptResult<T> = Promise<{
  data?: T;
  error?: Error;
  loading: boolean;
}>;

/**
 * Type for validating metadata fields
 */
export type MetadataField<T> = {
  value: T;
  required: boolean;
  validate: (value: T) => boolean;
};
