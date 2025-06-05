/**
 * @jest-environment node
 */
import {
  PromptError,
  ValidationError,
  PromptExecutionError,
  TimeoutError,
  ApiError,
  ConfigurationError,
  SDKError,
  PluginError,
  RateLimitError,
  NetworkError,
  AuthenticationError,
  ErrorRecovery,
  ErrorClassification,
  enrichError
} from '../errors';

describe('Error Classes', () => {
  describe('Base PromptError', () => {
    it('should create a proper error instance', () => {
      const error = new PromptError('Test error', 'TEST_ERROR', { test: true });
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('PromptError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details).toEqual({ test: true });
    });
  });

  describe('Specialized Error Classes', () => {
    it('should create ValidationError with correct code', () => {
      const error = new ValidationError('Invalid input', { field: 'name' });
      expect(error).toBeInstanceOf(PromptError);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'name' });
    });

    it('should create ApiError with status and response', () => {
      const response = { error: 'Invalid token' };
      const error = new ApiError('API request failed', 401, response);
      expect(error).toBeInstanceOf(PromptError);
      expect(error.code).toBe('API_ERROR');
      expect(error.status).toBe(401);
      expect(error.response).toEqual(response);
      expect(error.details).toEqual({ status: 401, response });
    });

    it('should create RateLimitError with resetInMs', () => {
      const error = new RateLimitError('Rate limit exceeded', 30000);
      expect(error).toBeInstanceOf(PromptError);
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.resetInMs).toBe(30000);
      expect(error.details).toEqual({ resetInMs: 30000 });
    });
  });

  describe('Error Classification', () => {
    it('should correctly identify error types', () => {
      const validationError = new ValidationError('Invalid input');
      const apiError = new ApiError('API error', 500);
      const timeout = new TimeoutError('Operation timed out');

      expect(ErrorClassification.isErrorType(validationError, 'VALIDATION_ERROR')).toBe(true);
      expect(ErrorClassification.isErrorType(validationError, 'API_ERROR')).toBe(false);
      expect(ErrorClassification.isErrorType(apiError, 'API_ERROR')).toBe(true);
    });

    it('should correctly identify retryable errors', () => {
      const networkError = new NetworkError('Connection error');
      const timeoutError = new TimeoutError('Request timed out');
      const validationError = new ValidationError('Invalid input');
      const apiError500 = new ApiError('Server error', 500);
      const apiError429 = new ApiError('Rate limited', 429);
      const apiError400 = new ApiError('Bad request', 400);

      expect(ErrorClassification.isRetryable(networkError)).toBe(true);
      expect(ErrorClassification.isRetryable(timeoutError)).toBe(true);
      expect(ErrorClassification.isRetryable(validationError)).toBe(false);
      expect(ErrorClassification.isRetryable(apiError500)).toBe(true);
      expect(ErrorClassification.isRetryable(apiError429)).toBe(true);
      expect(ErrorClassification.isRetryable(apiError400)).toBe(false);
    });

    it('should format errors consistently', () => {
      const promptError = new ValidationError('Invalid input', { field: 'name' });
      const regularError = new Error('Standard error');
      const stringError = 'Just a string';

      const formattedPromptError = ErrorClassification.formatError(promptError);
      expect(formattedPromptError.message).toBe('Invalid input');
      expect(formattedPromptError.code).toBe('VALIDATION_ERROR');
      expect(formattedPromptError.details).toEqual({ field: 'name' });

      const formattedRegularError = ErrorClassification.formatError(regularError);
      expect(formattedRegularError.message).toBe('Standard error');
      expect(formattedRegularError.code).toBe('UNKNOWN_ERROR');
      expect(formattedRegularError.stack).toBeDefined();

      const formattedStringError = ErrorClassification.formatError(stringError);
      expect(formattedStringError.message).toBe('Just a string');
      expect(formattedStringError.code).toBe('UNKNOWN_ERROR');
    });
  });
});

describe('Error Recovery', () => {
  describe('withFallback', () => {
    it('should return operation result on success', () => {
      const result = ErrorRecovery.withFallback(() => 'success', 'fallback');
      expect(result).toBe('success');
    });

    it('should return fallback value on error', () => {
      const result = ErrorRecovery.withFallback(() => {
        throw new Error('Operation failed');
      }, 'fallback');
      expect(result).toBe('fallback');
    });

    it('should call custom logger when provided', () => {
      const mockLogger = jest.fn();
      const result = ErrorRecovery.withFallback(() => {
        throw new Error('Logged error');
      }, 'fallback', mockLogger);
      
      expect(result).toBe('fallback');
      expect(mockLogger).toHaveBeenCalledTimes(1);
      expect(mockLogger.mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });

  describe('retry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should retry failed operations up to maxRetries', async () => {
      const mockOperation = jest.fn();
      mockOperation
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValueOnce('success');

      const promise = ErrorRecovery.retry(mockOperation, { maxRetries: 3 });
      
      // Advance timers for each retry
      jest.advanceTimersByTime(300); // First retry delay
      await Promise.resolve();
      jest.advanceTimersByTime(600); // Second retry delay
      await Promise.resolve();

      const result = await promise;
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should respect retryableErrors configuration', async () => {
      const mockOperation = jest.fn();
      mockOperation.mockRejectedValue(new Error('Non-retryable error'));

      await expect(ErrorRecovery.retry(mockOperation, { 
        maxRetries: 3,
        retryableErrors: ['retryable'] 
      })).rejects.toThrow('Non-retryable error');
      
      expect(mockOperation).toHaveBeenCalledTimes(1); // Should not retry
    });

    it('should call onRetry callback with proper details', async () => {
      const mockOnRetry = jest.fn();
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Retry me'))
        .mockResolvedValueOnce('success');

      const promise = ErrorRecovery.retry(mockOperation, { 
        maxRetries: 2,
        onRetry: mockOnRetry,
        retryableErrors: ['Retry']
      });
      
      jest.advanceTimersByTime(300);
      await Promise.resolve();

      await promise;
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
      expect(mockOnRetry.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(mockOnRetry.mock.calls[0][1]).toBe(1); // attempt number
      expect(mockOnRetry.mock.calls[0][2]).toBe(300); // delay time
    });
  });

  describe('withTimeout', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should resolve if operation completes within timeout', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const promise = ErrorRecovery.withTimeout(operation, 1000);
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      
      const result = await promise;
      expect(result).toBe('success');
    });

    it('should throw TimeoutError if operation exceeds timeout', async () => {
      const slowOperation = () => new Promise(resolve => setTimeout(() => resolve('too late'), 2000));
      
      const promise = ErrorRecovery.withTimeout(slowOperation, 1000, 'Custom timeout message');
      
      jest.advanceTimersByTime(1001);
      await Promise.resolve();
      
      await expect(promise).rejects.toThrow(TimeoutError);
      await expect(promise).rejects.toMatchObject({
        message: 'Custom timeout message',
        code: 'TIMEOUT_ERROR',
        details: { timeoutMs: 1000 }
      });
    });
  });

  describe('circuitBreaker', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should execute operation normally when circuit is closed', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const circuitBreaker = ErrorRecovery.circuitBreaker(operation);
      
      const result = await circuitBreaker();
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });
    
    it('should open circuit after failure threshold is reached', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      const mockStateChange = jest.fn();
      
      const circuitBreaker = ErrorRecovery.circuitBreaker(mockOperation, {
        failureThreshold: 2,
        onStateChange: mockStateChange
      });
      
      await expect(circuitBreaker()).rejects.toThrow('Service unavailable');
      await expect(circuitBreaker()).rejects.toThrow('Service unavailable');
      
      // Circuit should be open now
      expect(mockStateChange).toHaveBeenLastCalledWith('open');
      
      // Next call should throw circuit open error without calling operation
      mockOperation.mockClear();
      await expect(circuitBreaker()).rejects.toThrow(NetworkError);
      await expect(circuitBreaker()).rejects.toThrow('Circuit breaker is open');
      expect(mockOperation).not.toHaveBeenCalled();
    });
    
    it('should transition to half-open after reset timeout', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success');
        
      const mockStateChange = jest.fn();
      
      const circuitBreaker = ErrorRecovery.circuitBreaker(mockOperation, {
        failureThreshold: 2,
        resetTimeout: 10000,
        onStateChange: mockStateChange
      });
      
      // Trigger circuit to open
      await expect(circuitBreaker()).rejects.toThrow();
      await expect(circuitBreaker()).rejects.toThrow();
      expect(mockStateChange).toHaveBeenLastCalledWith('open');
      
      // Fast-forward time past reset timeout
      jest.advanceTimersByTime(10001);
      
      // Next call should try the operation (half-open state)
      const result = await circuitBreaker();
      expect(result).toBe('success');
      expect(mockStateChange).toHaveBeenCalledWith('half-open');
      expect(mockStateChange).toHaveBeenLastCalledWith('closed');
    });
  });
});

describe('Helper Functions', () => {
  describe('enrichError', () => {
    it('should add context to error details', () => {
      const error = new ValidationError('Invalid input');
      const enrichedError = enrichError(error, {
        userId: '123',
        requestId: 'abc-xyz'
      });
      
      expect(enrichedError).toBe(error); // Same instance
      expect(enrichedError.details).toEqual({
        userId: '123',
        requestId: 'abc-xyz'
      });
    });
    
    it('should merge with existing details', () => {
      const error = new ValidationError('Invalid format', { field: 'email' });
      const enrichedError = enrichError(error, { severity: 'warning' });
      
      expect(enrichedError.details).toEqual({
        field: 'email',
        severity: 'warning'
      });
    });
  });
});
