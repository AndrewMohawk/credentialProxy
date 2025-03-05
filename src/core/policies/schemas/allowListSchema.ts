import { PolicyType } from '../policyEngine';
import { BasePolicyConfig, createPolicySchema } from './baseSchema';

/**
 * Configuration for an ALLOW_LIST policy
 */
export interface AllowListPolicyConfig extends BasePolicyConfig {
  type: PolicyType.ALLOW_LIST;
  allowedValues: string[];
  targetField: string;
  caseSensitive?: boolean;
  action?: 'DENY' | 'ALERT';
  message?: string;
}

/**
 * JSON Schema for ALLOW_LIST policy
 */
export const allowListSchema = createPolicySchema(
  {
    allowedValues: {
      type: 'array',
      items: {
        type: 'string'
      },
      minItems: 1,
      description: 'Array of values that are allowed'
    },
    targetField: {
      type: 'string',
      description: 'The field path to check against the allow list (e.g., "operation", "parameters.username")'
    },
    caseSensitive: {
      type: 'boolean',
      default: true,
      description: 'Whether to perform case-sensitive matching'
    },
    action: {
      type: 'string',
      enum: ['DENY', 'ALERT'],
      default: 'DENY',
      description: 'Action to take when value is not in the allow list'
    },
    message: {
      type: 'string',
      description: 'Custom message to return when value is not in the allow list'
    }
  },
  [
    'allowedValues',
    'targetField'
  ]
);

/**
 * Example of a valid ALLOW_LIST policy
 */
export const allowListExample = {
  name: 'Allowed Operations',
  description: 'Only allow read operations on this credential',
  type: PolicyType.ALLOW_LIST,
  allowedValues: ['READ', 'DESCRIBE'],
  targetField: 'operation',
  caseSensitive: true,
  action: 'DENY',
  message: 'This credential only allows read operations'
}; 