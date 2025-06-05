/**
 * Represents metadata about a prompt block
 */
export interface PromptBlockMetadata {
  id: string;
  type: string;
  version: string;
  created: Date;
  modified: Date;
  tags: string[];
}

/**
 * Represents a block of content in a prompt
 */
export interface PromptBlock<T = unknown> {
  metadata: PromptBlockMetadata;
  content: T;
}

/**
 * Represents the output of a prompt with rich metadata
 */
export interface PromptOutput<T = unknown> {
  result: T;
  metadata: {
    timestamp: Date;
    duration: number;
    model: string;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    cost: number;
  };
}

/**
 * Represents validation options for prompt blocks
 */
export interface ValidationOptions {
  strict: boolean;
  allowUnknownKeys: boolean;
  customValidators?: Array<(block: PromptBlock) => boolean>;
}

/**
 * Represents error details for prompt validation
 */
export interface ValidationError {
  code: string;
  message: string;
  path: string[];
  block?: PromptBlock;
}

/**
 * Represents a prompt template with typed parameters
 */
export type PromptTemplate<P = Record<string, unknown>, R = unknown> = {
  (params: P): Promise<PromptOutput<R>>;
  metadata: PromptBlockMetadata;
};
