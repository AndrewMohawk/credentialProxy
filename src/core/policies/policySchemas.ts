import { Policy, PolicyType } from './policyEngine';

// Type for JSON Schema
export type JSONSchema = {
  type: string;
  required?: string[];
  properties: Record<string, any>;
  additionalProperties?: boolean;
  oneOf?: JSONSchema[];
};

/**
 * Base policy schema with common properties
 */
const baseSchema: JSONSchema = {
  type: 'object',
  required: ['name', 'description', 'type', 'isActive'],
  properties: {
    id: { type: 'string', nullable: true },
    name: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    type: { type: 'string', enum: Object.values(PolicyType) },
    version: { type: 'number', nullable: true },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', nullable: true },
    updatedAt: { type: 'string', nullable: true },
    message: { type: 'string', nullable: true },
    priority: { type: 'number', minimum: 0, default: 100, nullable: true }
  },
  additionalProperties: false
};

/**
 * ALLOW_LIST policy schema
 */
export const allowListSchema: JSONSchema = {
  ...baseSchema,
  required: ['name', 'description', 'type', 'isActive', 'targetField', 'allowedValues'],
  properties: {
    ...baseSchema.properties,
    targetField: { type: 'string', minLength: 1 },
    allowedValues: { 
      type: 'array', 
      items: { type: 'string' },
      minItems: 1
    }
  }
};

/**
 * DENY_LIST policy schema
 */
export const denyListSchema: JSONSchema = {
  ...baseSchema,
  required: ['name', 'description', 'type', 'isActive', 'targetField', 'deniedValues'],
  properties: {
    ...baseSchema.properties,
    targetField: { type: 'string', minLength: 1 },
    deniedValues: { 
      type: 'array', 
      items: { type: 'string' },
      minItems: 1
    }
  }
};

/**
 * TIME_BASED policy schema
 */
export const timeBasedSchema: JSONSchema = {
  ...baseSchema,
  required: ['name', 'description', 'type', 'isActive', 'allowedDays', 'allowedHoursStart', 'allowedHoursEnd'],
  properties: {
    ...baseSchema.properties,
    allowedDays: { 
      type: 'array', 
      items: { 
        type: 'string',
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      },
      minItems: 1
    },
    allowedHoursStart: { 
      type: 'string',
      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' // HH:MM format
    },
    allowedHoursEnd: { 
      type: 'string',
      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' // HH:MM format
    },
    timezone: { 
      type: 'string',
      default: 'UTC'
    }
  }
};

/**
 * COUNT_BASED policy schema
 */
export const countBasedSchema: JSONSchema = {
  ...baseSchema,
  required: ['name', 'description', 'type', 'isActive', 'maxRequests', 'timeWindowSeconds'],
  properties: {
    ...baseSchema.properties,
    maxRequests: { 
      type: 'number',
      minimum: 1 
    },
    timeWindowSeconds: { 
      type: 'number',
      minimum: 1 
    }
  }
};

/**
 * MANUAL_APPROVAL policy schema
 */
export const manualApprovalSchema: JSONSchema = {
  ...baseSchema,
  required: ['name', 'description', 'type', 'isActive', 'approvers'],
  properties: {
    ...baseSchema.properties,
    approvers: { 
      type: 'array', 
      items: { type: 'string' },
      minItems: 1
    },
    expirationMinutes: { 
      type: 'number',
      minimum: 1,
      nullable: true 
    }
  }
}; 