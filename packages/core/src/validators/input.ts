/**
 * Input sanitization and validation
 */

import { z } from 'zod';
import { CommonSchemas, validateWithSchema } from './schema';
import { ValidationErrorDetail } from '../types';

/**
 * Sanitizes and validates text input
 */
export function sanitizeText(
  input: string,
  options: {
    trim?: boolean;
    maxLength?: number;
    minLength?: number;
    allowHtml?: boolean;
    allowMarkdown?: boolean;
  } = {
    trim: true,
    maxLength: undefined,
    minLength: undefined,
    allowHtml: false,
    allowMarkdown: true,
  }
): { value: string; errors: ValidationErrorDetail[] } {
  let sanitized = input;
  const errors: ValidationErrorDetail[] = [];
  
  // Basic sanitization
  if (options.trim) {
    sanitized = sanitized.trim();
  }
  
  // Basic validation
  if (options.maxLength !== undefined && sanitized.length > options.maxLength) {
    errors.push({
      code: 'TEXT_TOO_LONG',
      message: `Text exceeds maximum length of ${options.maxLength}`,
      path: []
    });
  }
  
  if (options.minLength !== undefined && sanitized.length < options.minLength) {
    errors.push({
      code: 'TEXT_TOO_SHORT',
      message: `Text is shorter than minimum length of ${options.minLength}`,
      path: []
    });
  }
  
  // HTML sanitization if not allowed
  if (!options.allowHtml && /<[^>]*>/g.test(sanitized)) {
    // Basic HTML tag removal for sanitization
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    errors.push({
      code: 'HTML_NOT_ALLOWED',
      message: 'HTML tags are not allowed in this context',
      path: []
    });
  }
  
  return { value: sanitized, errors };
}

/**
 * Validates a prompt template string for variables
 */
export function validatePromptTemplate(
  template: string
): { valid: boolean; variables: string[]; errors: ValidationErrorDetail[] } {
  const variablePattern = /{{([^{}]+)}}/g;
  const variables: string[] = [];
  const errors: ValidationErrorDetail[] = [];
  let match;
  
  // Extract all variables from the template
  while ((match = variablePattern.exec(template)) !== null) {
    const variable = match[1].trim();
    
    if (variable.length === 0) {
      errors.push({
        code: 'EMPTY_VARIABLE',
        message: 'Empty variable placeholder in template',
        path: ['template', match.index.toString()]
      });
    } else if (variables.includes(variable)) {
      // This is just a warning, not an error
      // errors.push({
      //   code: 'DUPLICATE_VARIABLE',
      //   message: `Duplicate variable "${variable}" in template`,
      //   path: ['template', match.index.toString()]
      // });
    } else {
      variables.push(variable);
    }
  }
  
  // Check for unmatched brackets that might indicate template errors
  const openBracketCount = (template.match(/{{/g) || []).length;
  const closeBracketCount = (template.match(/}}/g) || []).length;
  
  if (openBracketCount !== closeBracketCount) {
    errors.push({
      code: 'MISMATCHED_BRACKETS',
      message: 'Mismatched curly braces in template',
      path: ['template']
    });
  }
  
  return { 
    valid: errors.length === 0, 
    variables,
    errors
  };
}

/**
 * Creates a schema for validating prompt variables
 */
export function createVariableSchema(
  variables: string[]
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const schema: Record<string, z.ZodTypeAny> = {};
  
  for (const variable of variables) {
    schema[variable] = z.any();
  }
  
  return z.object(schema).strict();
}

/**
 * Fills a template with provided variables
 * @throws Error if variables are missing or invalid
 */
export function fillTemplate(
  template: string,
  variables: Record<string, unknown>
): string {
  const { valid, variables: requiredVars, errors } = validatePromptTemplate(template);
  
  if (!valid) {
    throw new Error(`Invalid template: ${errors.map(e => e.message).join(', ')}`);
  }
  
  // Check for missing variables
  const missingVars = requiredVars.filter(v => !(v in variables));
  if (missingVars.length > 0) {
    throw new Error(`Missing variables: ${missingVars.join(', ')}`);
  }
  
  // Replace variables
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const stringValue = String(value);
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), stringValue);
  }
  
  return result;
}
