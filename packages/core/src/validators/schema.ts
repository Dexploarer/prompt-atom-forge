/**
 * Schema-based validation using Zod
 */

import { z } from 'zod';
import { ValidationErrorDetail } from '../types';

/**
 * Validates data against a Zod schema and returns formatted errors
 */
export function validateWithSchema<T>(
  data: unknown, 
  schema: z.ZodType<T>,
  options: {
    path?: string[];
    abortEarly?: boolean;
    errorPrefix?: string;
  } = {}
): { valid: boolean; errors: ValidationErrorDetail[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { valid: true, errors: [] };
  }
  
  const basePath = options.path || [];
  const prefix = options.errorPrefix ? `${options.errorPrefix}: ` : '';
  
  const errors: ValidationErrorDetail[] = result.error.errors.map(err => ({
    code: 'SCHEMA_VALIDATION_ERROR',
    message: `${prefix}${err.message}`,
    path: [...basePath, ...err.path.map(String)],
  }));
  
  return { valid: false, errors };
}

/**
 * Creates a validator function from a Zod schema
 */
export function createSchemaValidator<T>(
  schema: z.ZodType<T>,
  options: {
    path?: string[];
    errorPrefix?: string;
  } = {}
): (data: unknown) => { valid: boolean; errors: ValidationErrorDetail[]; value?: T } {
  return (data: unknown) => {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { valid: true, errors: [], value: result.data };
    }
    
    const basePath = options.path || [];
    const prefix = options.errorPrefix ? `${options.errorPrefix}: ` : '';
    
    const errors: ValidationErrorDetail[] = result.error.errors.map(err => ({
      code: 'SCHEMA_VALIDATION_ERROR',
      message: `${prefix}${err.message}`,
      path: [...basePath, ...err.path.map(String)],
    }));
    
    return { valid: false, errors };
  };
}

/**
 * Common schema patterns for reuse
 */
export const CommonSchemas = {
  nonEmptyString: z.string().min(1, 'Cannot be empty'),
  naturalNumber: z.number().int().positive(),
  isoDateString: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Must be a valid ISO date string' }
  ),
  uuid: z.string().uuid('Must be a valid UUID'),
  email: z.string().email('Must be a valid email address'),
  url: z.string().url('Must be a valid URL'),
  semver: z.string().regex(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
    'Must be a valid semantic version'
  ),
};

/**
 * Create a refined schema with custom validation
 */
export function refinedSchema<T>(
  schema: z.ZodType<T>,
  refinement: (value: T) => boolean,
  errorMessage: string
): z.ZodType<T> {
  return schema.refine(refinement, { message: errorMessage });
}
