import { PolicyType } from '../policyEngine';

/**
 * Base policy configuration properties shared across all policy types
 */
export interface BasePolicyConfig {
  name: string;
  description?: string;
  type: PolicyType;
  isActive?: boolean;
  priority?: number;
}

/**
 * Schema for base policy configuration
 */
export const basePolicySchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'The name of the policy'
    },
    description: {
      type: 'string',
      maxLength: 500,
      description: 'A description of what the policy does'
    },
    type: {
      type: 'string',
      enum: Object.values(PolicyType),
      description: 'The type of policy'
    },
    isActive: {
      type: 'boolean',
      default: true,
      description: 'Whether the policy is active'
    },
    priority: {
      type: 'integer',
      minimum: 0,
      maximum: 1000,
      default: 100,
      description: 'The priority of the policy (higher numbers have higher priority)'
    }
  },
  required: ['name', 'type'],
  additionalProperties: false
};

/**
 * Utility function to create a policy schema with type-specific properties
 * @param typeSpecificProperties The properties specific to a policy type
 * @param typeSpecificRequired Required properties specific to a policy type
 * @returns A complete policy schema
 */
export function createPolicySchema(
  typeSpecificProperties: Record<string, any>,
  typeSpecificRequired: string[] = []
): any {
  return {
    type: 'object',
    properties: {
      ...basePolicySchema.properties,
      ...typeSpecificProperties
    },
    required: [...basePolicySchema.required, ...typeSpecificRequired],
    additionalProperties: false
  };
}

/**
 * Generate documentation for a policy schema
 * @param schema The policy schema
 * @returns Documentation object with property descriptions
 */
export function generateSchemaDocumentation(schema: any): Record<string, string> {
  const documentation: Record<string, string> = {};
  
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
      if (value.description) {
        documentation[key] = value.description;
      }
    });
  }
  
  return documentation;
}

/**
 * Generate completion suggestions for a schema property
 * @param schema The schema or subschema
 * @param path The current path in the schema
 * @returns Autocompletion suggestions
 */
export function generateCompletionSuggestions(
  schema: any,
  path: string[] = []
): Record<string, any> {
  const suggestions: Record<string, any> = {};
  
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
      const propertyPath = [...path, key];
      
      suggestions[key] = {
        path: propertyPath.join('.'),
        type: value.type,
        description: value.description || '',
        enum: value.enum || [],
        default: value.default,
        isRequired: schema.required?.includes(key) || false
      };
      
      // Process nested objects
      if (value.type === 'object' && value.properties) {
        const nestedSuggestions = generateCompletionSuggestions(value, propertyPath);
        Object.entries(nestedSuggestions).forEach(([nestedKey, nestedValue]) => {
          suggestions[`${key}.${nestedKey}`] = nestedValue;
        });
      }
      
      // Process array items
      if (value.type === 'array' && value.items) {
        suggestions[`${key}[]`] = {
          path: `${propertyPath.join('.')}[]`,
          type: 'array-item',
          itemType: value.items.type,
          description: `Item in ${key} array`,
          enum: value.items.enum || [],
          isRequired: false
        };
      }
    });
  }
  
  return suggestions;
} 