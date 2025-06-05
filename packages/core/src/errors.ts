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
 * Error thrown when a rate limit is exceeded
 */
export class RateLimitError extends PromptError {
  /**
   * Time in milliseconds until the rate limit resets
   */
  public resetInMs?: number;
  
  constructor(message: string, resetInMs?: number, details?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT_ERROR', { resetInMs, ...details });
    this.resetInMs = resetInMs;
  }
}

/**
 * Error thrown when a network-related issue occurs
 */
export class NetworkError extends PromptError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', details);
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends PromptError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', details);
  }
}

/**
 * Error recovery utilities
 */
export const ErrorRecovery = {
  /**
   * Attempt to recover from an error with a fallback value
   */
  withFallback: <T>(operation: () => T, fallback: T, logger?: (error: unknown) => void): T => {
    try {
      return operation();
    } catch (error) {
      if (logger) {
        logger(error);
      } else {
        console.warn('Operation failed, using fallback', error);
      }
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
      retryableErrors = [],
      onRetry,
    }: {
      maxRetries?: number;
      initialDelay?: number;
      maxDelay?: number;
      factor?: number;
      retryableErrors?: Array<string | RegExp>;
      onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
    } = {},
  ): Promise<T> => {
    let lastError: unknown;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        // Check if error is retryable if retryableErrors is provided
        if (retryableErrors.length > 0) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const isRetryable = retryableErrors.some(pattern => 
            typeof pattern === 'string' 
              ? errorMessage.includes(pattern)
              : pattern.test(errorMessage)
          );
          
          if (!isRetryable) {
            throw error; // Non-retryable error, rethrow immediately
          }
        }
        
        lastError = error;
        const delay = Math.min(initialDelay * Math.pow(factor, attempt), maxDelay);
        
        if (onRetry) {
          onRetry(error, attempt + 1, delay);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  },
  
  /**
   * Execute operations with timeout
   */
  withTimeout: async <T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    timeoutMessage = 'Operation timed out'
  ): Promise<T> => {
    let timeoutId: NodeJS.Timeout;
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new TimeoutError(timeoutMessage, { timeoutMs }));
      }, timeoutMs);
    });
    
    try {
      const result = await Promise.race([operation(), timeoutPromise]);
      clearTimeout(timeoutId);
      return result as T;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },
  
  /**
   * Execute with circuit breaker pattern
   */
  circuitBreaker: <T>(
    operation: () => Promise<T>,
    {
      failureThreshold = 5,
      resetTimeout = 30000,
      onStateChange,
    }: {
      failureThreshold?: number;
      resetTimeout?: number;
      onStateChange?: (state: 'open' | 'closed' | 'half-open') => void;
    } = {}
  ) => {
    let failures = 0;
    let circuitState: 'open' | 'closed' | 'half-open' = 'closed';
    let lastFailureTime = 0;
    
    return async (): Promise<T> => {
      // Check if circuit is open
      if (circuitState === 'open') {
        // Check if reset timeout has elapsed
        if (Date.now() - lastFailureTime > resetTimeout) {
          circuitState = 'half-open';
          if (onStateChange) onStateChange(circuitState);
        } else {
          throw new NetworkError('Circuit breaker is open', { 
            remainingMs: resetTimeout - (Date.now() - lastFailureTime) 
          });
        }
      }
      
      try {
        const result = await operation();
        
        // Reset on success if in half-open state
        if (circuitState === 'half-open') {
          circuitState = 'closed';
          failures = 0;
          if (onStateChange) onStateChange(circuitState);
        }
        
        return result;
      } catch (error) {
        lastFailureTime = Date.now();
        failures++;
        
        // Open circuit if failure threshold reached
        if (failures >= failureThreshold) {
          circuitState = 'open';
          if (onStateChange) onStateChange(circuitState);
        }
        
        throw error;
      }
    };
  },
  
  /**
   * Safely execute an operation and transform any error to a specific error type
   */
  mapError: async <T>(
    operation: () => Promise<T>,
    errorMapper: (error: unknown) => Error
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      throw errorMapper(error);
    }
  },
};

/**
 * Enrich an error with additional context
 */
export function enrichError<T extends Error>(error: T, context: Record<string, unknown>): T {
  // Add context to error details if it's a PromptError
  if (error instanceof PromptError) {
    error.details = {
      ...error.details,
      ...context
    };
  } else {
    // For standard errors, add context to a non-enumerable property
    Object.defineProperty(error, 'context', {
      value: context,
      enumerable: false,
      writable: true
    });
  }
  
  return error;
}

/**
 * Error classification helpers
 */
export const ErrorClassification = {
  /**
   * Check if an error is a specific type of PromptError
   */
  isErrorType: (error: unknown, errorCode: string): boolean => {
    return error instanceof PromptError && error.code === errorCode;
  },
  
  /**
   * Check if an error is retryable
   */
  isRetryable: (error: unknown): boolean => {
    if (error instanceof NetworkError || error instanceof TimeoutError) {
      return true;
    }
    
    if (error instanceof ApiError && (error.status === 429 || error.status >= 500)) {
      return true;
    }
    
    return false;
  },
  
  /**
   * Format error into consistent structure with proper stack trace and context
   */
  formatError: (error: unknown): {
    message: string;
    code: string;
    stack?: string;
    details?: Record<string, unknown>;
  } => {
    if (error instanceof PromptError) {
      return {
        message: error.message,
        code: error.code,
        stack: error.stack,
        details: error.details,
      };
    }
    
    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'UNKNOWN_ERROR',
        stack: error.stack,
      };
    }
    
    return {
      message: String(error),
      code: 'UNKNOWN_ERROR',
    };
  },
};

/**
 * Create an enriched error instance with additional context
 */
export function enrichError<T extends PromptError>(
  error: T, 
  context: Record<string, unknown>
): T {
  return Object.assign(error, { 
    details: { 
      ...error.details, 
      ...context 
    } 
  });
};
