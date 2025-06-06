/**
 * @fileoverview Type definitions for interactive CLI modules
 * @module @prompt-or-die/cli/modules/types
 */

// Project generation interfaces
export interface MCPProjectOptions {
  name: string;
  description?: string;
  transport: string;
  storage: string;
  auth?: { 
    type: string; 
    provider?: string;
  };
  deployment?: { 
    platform: string;
    domain?: string;
  };
  features?: {
    templates?: boolean;
    sharing?: boolean;
    analytics?: boolean;
    collaboration?: boolean;
  };
}

export interface PromptParameters {
  type: string;
  context: string;
  goal: string;
  tone: string;
  length: string;
  [key: string]: string;
}
