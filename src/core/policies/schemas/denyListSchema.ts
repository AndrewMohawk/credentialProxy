import { PolicyType } from '../policyEngine';
import { BasePolicyConfig, createPolicySchema } from './baseSchema';

/**
 * Configuration for a DENY_LIST policy
 */
export interface DenyListPolicyConfig extends BasePolicyConfig {
  type: PolicyType.DENY_LIST;
  deniedValues: string[];
  targetField: string;
  caseSensitive?: boolean;
  action?: 'ALLOW' | 'DENY';
  message?: string;
}

/**
 * JSON Schema for DENY_LIST policy
 */
export const denyListSchema = createPolicySchema(
  {
    deniedValues: {
      type: 'array',
      items: {
        type: 'string'
      },
      minItems: 1,
      description: 'List of denied values'
    },
    targetField: {
      type: 'string',
      description: 'The field in the request to check (e.g., "ip", "operation", "parameters.userId")'
    },
    caseSensitive: {
      type: 'boolean',
      default: true,
      description: 'Whether value comparison should be case-sensitive'
    },
    action: {
      type: 'string',
      enum: ['ALLOW', 'DENY'],
      default: 'DENY',
      description: 'Action to take when value is in list (DENY) or not in list (ALLOW)'
    },
    message: {
      type: 'string',
      description: 'Custom message to return when policy is not satisfied'
    }
  },
  ['deniedValues', 'targetField']
);

/**
 * Example of a valid DENY_LIST policy
 */
export const denyListExample = {
  name: 'Blocked Countries',
  description: 'Block requests from specific countries',
  type: PolicyType.DENY_LIST,
  deniedValues: ['CN', 'RU', 'KP'],
  targetField: 'headers.cf-ipcountry',
  caseSensitive: false,
  action: 'DENY',
  message: 'Access from your country is not allowed'
}; 