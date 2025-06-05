/**
 * Tests for the validator modules
 */
import { validateSchema, createSchemaValidator, z } from '../validators/schema';
import { 
  sanitizeText,
  extractTemplateVariables,
  fillTemplate,
  validateTemplateVariables
} from '../validators/input';
import { ValidationErrorDetail } from '../types';

describe('Schema Validation', () => {
  describe('validateSchema', () => {
    it('should validate objects against schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().int().positive(),
        email: z.string().email().optional(),
      });
      
      const validObject = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com'
      };
      
      const invalidObject = {
        name: 'Jane Doe',
        age: -5, // Invalid age
        email: 'not-an-email' // Invalid email
      };
      
      const validResult = validateSchema(validObject, schema);
      const invalidResult = validateSchema(invalidObject, schema);
      
      expect(validResult.success).toBe(true);
      expect(validResult.data).toEqual(validObject);
      expect(validResult.errors).toHaveLength(0);
      
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errors).toHaveLength(2);
      expect(invalidResult.errors[0].path).toContain('age');
      expect(invalidResult.errors[1].path).toContain('email');
    });
    
    it('should support nested objects and arrays', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          addresses: z.array(z.object({
            street: z.string(),
            city: z.string(),
            zipCode: z.string().regex(/^\d{5}$/)
          }))
        })
      });
      
      const validObject = {
        user: {
          name: 'John',
          addresses: [
            { street: '123 Main St', city: 'Anytown', zipCode: '12345' }
          ]
        }
      };
      
      const invalidObject = {
        user: {
          name: 'Jane',
          addresses: [
            { street: '456 Oak Ave', city: 'Somewhere', zipCode: 'ABC12' } // Invalid zip
          ]
        }
      };
      
      const validResult = validateSchema(validObject, schema);
      const invalidResult = validateSchema(invalidObject, schema);
      
      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errors[0].path).toContain('user.addresses[0].zipCode');
    });
    
    it('should handle transformations', () => {
      const schema = z.object({
        date: z.string().transform((str) => new Date(str)),
        tags: z.string().transform((str) => str.split(',').map((s) => s.trim()))
      });
      
      const input = {
        date: '2023-01-01',
        tags: 'tag1, tag2, tag3'
      };
      
      const result = validateSchema(input, schema);
      
      expect(result.success).toBe(true);
      expect(result.data.date).toBeInstanceOf(Date);
      expect(result.data.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });
  
  describe('createSchemaValidator', () => {
    it('should create a reusable validator function', () => {
      const userSchema = z.object({
        id: z.string().uuid(),
        name: z.string().min(2),
        role: z.enum(['admin', 'user', 'guest'])
      });
      
      const validateUser = createSchemaValidator(userSchema);
      
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Admin',
        role: 'admin'
      };
      
      const invalidUser = {
        id: 'not-a-uuid',
        name: 'A',
        role: 'superuser'
      };
      
      const validResult = validateUser(validUser);
      const invalidResult = validateUser(invalidUser);
      
      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errors).toHaveLength(3);
    });
  });
});

describe('Input Validation', () => {
  describe('sanitizeText', () => {
    it('should trim whitespace', () => {
      expect(sanitizeText('  hello world  ')).toBe('hello world');
    });
    
    it('should normalize line endings', () => {
      expect(sanitizeText('line1\r\nline2')).toBe('line1\nline2');
    });
    
    it('should collapse consecutive whitespace', () => {
      expect(sanitizeText('too    many    spaces')).toBe('too many spaces');
    });
    
    it('should handle multiple sanitization options', () => {
      const text = '  multiple  \r\n  issues  ';
      const sanitized = sanitizeText(text, {
        trim: true,
        normalizeLineEndings: true,
        collapseWhitespace: true
      });
      
      expect(sanitized).toBe('multiple\nissues');
    });
  });
  
  describe('Template Variables', () => {
    it('should extract template variables from string', () => {
      const template = 'Hello {{name}}, your order #{{orderId}} has been {{status}}.';
      const variables = extractTemplateVariables(template);
      
      expect(variables).toEqual(['name', 'orderId', 'status']);
    });
    
    it('should fill templates with provided variables', () => {
      const template = 'Hello {{name}}, welcome to {{service}}!';
      const variables = {
        name: 'John',
        service: 'Our Platform'
      };
      
      const filled = fillTemplate(template, variables);
      expect(filled).toBe('Hello John, welcome to Our Platform!');
    });
    
    it('should throw error for missing variables', () => {
      const template = 'Hello {{name}}, welcome to {{service}}!';
      const variables = {
        name: 'John'
        // Missing 'service'
      };
      
      expect(() => {
        fillTemplate(template, variables, { strict: true });
      }).toThrow();
      
      // In non-strict mode, should leave the template variable as is
      const filled = fillTemplate(template, variables, { strict: false });
      expect(filled).toBe('Hello John, welcome to {{service}}!');
    });
    
    it('should validate required template variables', () => {
      const template = 'Hello {{name}}, you have {{count}} new messages.';
      const requiredVars = ['name', 'count'];
      
      // All variables provided
      const validVars = { name: 'John', count: 5 };
      const validResult = validateTemplateVariables(template, validVars);
      expect(validResult).toEqual({
        valid: true,
        missing: []
      });
      
      // Missing variable
      const invalidVars = { name: 'John' };
      const invalidResult = validateTemplateVariables(template, invalidVars);
      expect(invalidResult).toEqual({
        valid: false,
        missing: ['count']
      });
    });
  });
});
