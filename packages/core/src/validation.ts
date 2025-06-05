import { z } from 'zod';
import type { PromptBlock, ValidationError, ValidationOptions } from './types';

/**
 * Base schema for prompt block metadata
 */
export const promptBlockMetadataSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  version: z.string(),
  created: z.date(),
  modified: z.date(),
  tags: z.array(z.string()),
});

/**
 * Generic schema for prompt blocks
 */
export const promptBlockSchema = z.object({
  metadata: promptBlockMetadataSchema,
  content: z.unknown(),
});

/**
 * Validates a prompt block against the schema and custom validators
 */
export function validatePromptBlock(
  block: PromptBlock,
  options: ValidationOptions = { strict: true, allowUnknownKeys: false },
): ValidationError[] {
  const errors: ValidationError[] = [];

  try {
    // Schema validation
    const result = promptBlockSchema.safeParse(block);
    if (!result.success) {
      errors.push(
        ...result.error.errors.map(err => ({
          code: 'SCHEMA_ERROR',
          message: err.message,
          path: err.path.map(String),
          block,
        })),
      );
    }

    // Custom validators
    if (options.customValidators) {
      for (const validator of options.customValidators) {
        try {
          const isValid = validator(block);
          if (!isValid) {
            errors.push({
              code: 'CUSTOM_VALIDATION_ERROR',
              message: 'Custom validation failed',
              path: [],
              block,
            });
          }
        } catch (err) {
          errors.push({
            code: 'CUSTOM_VALIDATOR_ERROR',
            message: err instanceof Error ? err.message : 'Unknown error in custom validator',
            path: [],
            block,
          });
        }
      }
    }
  } catch (err) {
    errors.push({
      code: 'VALIDATION_ERROR',
      message: err instanceof Error ? err.message : 'Unknown validation error',
      path: [],
      block,
    });
  }

  return errors;
}

/**
 * Creates a type-safe validator for a specific prompt block type
 */
export function createPromptBlockValidator<T>(schema: z.ZodType<T>) {
  return (block: PromptBlock<T>, options?: ValidationOptions): ValidationError[] => {
    const baseErrors = validatePromptBlock(block, options);

    try {
      const contentResult = schema.safeParse(block.content);
      if (!contentResult.success) {
        baseErrors.push(
          ...contentResult.error.errors.map(err => ({
            code: 'CONTENT_ERROR',
            message: err.message,
            path: ['content', ...err.path.map(String)],
            block,
          })),
        );
      }
    } catch (err) {
      baseErrors.push({
        code: 'CONTENT_VALIDATION_ERROR',
        message: err instanceof Error ? err.message : 'Unknown content validation error',
        path: ['content'],
        block,
      });
    }

    return baseErrors;
  };
}
