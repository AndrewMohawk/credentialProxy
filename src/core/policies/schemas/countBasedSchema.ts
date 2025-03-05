import { PolicyType } from '../policyEngine';
import { BasePolicyConfig, createPolicySchema } from './baseSchema';

/**
 * Configuration for a COUNT_BASED policy
 */
export interface CountBasedPolicyConfig extends BasePolicyConfig {
  type: PolicyType.COUNT_BASED;
  maxRequests: number;
  timeWindowSeconds: number;
  perUser?: boolean;
  perOperation?: boolean;
  perResource?: boolean;
  includeFailedRequests?: boolean;
  resetCountOnTimeWindow?: boolean;
  action?: 'BLOCK' | 'THROTTLE' | 'NOTIFY';
  message?: string;
}

/**
 * JSON Schema for COUNT_BASED policy
 */
export const countBasedSchema = createPolicySchema(
  {
    maxRequests: {
      type: 'integer',
      minimum: 1,
      description: 'Maximum number of requests allowed in the time window'
    },
    timeWindowSeconds: {
      type: 'integer',
      minimum: 1,
      description: 'Time window in seconds'
    },
    perUser: {
      type: 'boolean',
      default: true,
      description: 'Whether limit applies per user'
    },
    perOperation: {
      type: 'boolean',
      default: false,
      description: 'Whether limit applies per operation'
    },
    perResource: {
      type: 'boolean',
      default: false,
      description: 'Whether limit applies per credential/resource'
    },
    includeFailedRequests: {
      type: 'boolean',
      default: true,
      description: 'Whether to count failed requests toward the limit'
    },
    resetCountOnTimeWindow: {
      type: 'boolean',
      default: true,
      description: 'Whether to reset counter at the end of each time window'
    },
    action: {
      type: 'string',
      enum: ['BLOCK', 'THROTTLE', 'NOTIFY'],
      default: 'BLOCK',
      description: 'Action to take when limit is reached'
    },
    message: {
      type: 'string',
      description: 'Custom message to return when limit is reached'
    }
  },
  [
    'maxRequests',
    'timeWindowSeconds'
  ]
);

/**
 * Example of a valid COUNT_BASED policy
 */
export const countBasedExample = {
  name: 'Rate Limiting Policy',
  description: 'Limit API access to 100 requests per minute',
  type: PolicyType.COUNT_BASED,
  maxRequests: 100,
  timeWindowSeconds: 60,
  perUser: true,
  perOperation: false,
  action: 'BLOCK',
  message: 'Rate limit exceeded. Please try again in a few minutes.'
};