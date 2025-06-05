/**
 * Base error class for all prompt-or-die errors
 */
export class PromptError extends Error {
  public code: string;
  public details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends PromptError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

/**
 * Error thrown when prompt construction fails
 */
export class PromptConstructionError extends PromptError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PROMPT_CONSTRUCTION_ERROR', details);
  }
}

/**
 * Error thrown when prompt execution fails
 */
export class PromptExecutionError extends PromptError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PROMPT_EXECUTION_ERROR', details);
  }
}

/**
 * Error thrown when prompt serialization or deserialization fails
 */
export class SerializationError extends PromptError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SERIALIZATION_ERROR', details);
  }
}

/**
 * Error thrown when an operation times out
 */
export class TimeoutError extends PromptError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'TIMEOUT_ERROR', details);
  }
}

/**
 * Error thrown when an API request fails
 */
export class ApiError extends PromptError {
  public status?: number;
  public response?: unknown;

  constructor(message: string, status?: number, response?: unknown) {
    super(message, 'API_ERROR', { status, response });
    this.status = status;
    this.response = response;
  }
}

/**
 * Error thrown when SDK configuration is invalid
 */
export class ConfigurationError extends PromptError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', details);
  }
}

/**
 * Error thrown for general SDK errors
 */
export class SDKError extends PromptError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SDK_ERROR', details);
  }
}

/**
 * Error thrown when a plugin operation fails
 */
export class PluginError extends PromptError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PLUGIN_ERROR', details);
  }
}

/**
 * Error recovery utilities
 */
export const ErrorRecovery = {
  /**
   * Attempt to recover from an error with a fallback value
   */
  withFallback: <T>(operation: () => T, fallback: T): T => {
    try {
      return operation();
    } catch (error) {
      console.warn('Operation failed, using fallback', error);
      return fallback;
    }
  },

  /**
   * Retry an operation with exponential backoff
   */
  retry: async <T>(
    operation: () => Promise<T>,
    {
      maxRetries = 3,
      initialDelay = 300,
      maxDelay = 3000,
      factor = 2,
    }: {
      maxRetries?: number;
      initialDelay?: number;
      maxDelay?: number;
      factor?: number;
    } = {},
  ): Promise<T> => {
    let lastError: unknown;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const delay = Math.min(initialDelay * Math.pow(factor, attempt), maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  },
};
