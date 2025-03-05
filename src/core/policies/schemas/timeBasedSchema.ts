import { PolicyType } from '../policyEngine';
import { BasePolicyConfig, createPolicySchema } from './baseSchema';

/**
 * Configuration for a TIME_BASED policy
 */
export interface TimeBasedPolicyConfig extends BasePolicyConfig {
  type: PolicyType.TIME_BASED;
  allowedDays?: number[];
  allowedHoursStart?: string;
  allowedHoursEnd?: string;
  timezone?: string;
  startDate?: string;
  endDate?: string;
  expiresAfterDays?: number;
  action?: 'ALLOW' | 'DENY';
  message?: string;
}

/**
 * JSON Schema for TIME_BASED policy
 */
export const timeBasedSchema = createPolicySchema(
  {
    allowedDays: {
      type: 'array',
      items: {
        type: 'integer',
        minimum: 0,
        maximum: 6
      },
      description: 'Days of the week when access is allowed (0 = Sunday, 1 = Monday, etc.)'
    },
    allowedHoursStart: {
      type: 'string',
      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
      description: 'Start time for allowed access in 24-hour format (HH:MM)'
    },
    allowedHoursEnd: {
      type: 'string',
      pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
      description: 'End time for allowed access in 24-hour format (HH:MM)'
    },
    timezone: {
      type: 'string',
      default: 'UTC',
      description: 'Timezone for time-based restrictions (e.g., "America/New_York", "Europe/London")'
    },
    startDate: {
      type: 'string',
      format: 'date',
      description: 'Date when policy starts to be effective (YYYY-MM-DD)'
    },
    endDate: {
      type: 'string',
      format: 'date',
      description: 'Date when policy stops being effective (YYYY-MM-DD)'
    },
    expiresAfterDays: {
      type: 'integer',
      minimum: 1,
      description: 'Number of days after which the policy expires'
    },
    action: {
      type: 'string',
      enum: ['ALLOW', 'DENY'],
      default: 'DENY',
      description: 'Action to take when time conditions are met (ALLOW) or not met (DENY)'
    },
    message: {
      type: 'string',
      description: 'Custom message to return when policy is not satisfied'
    }
  },
  // At least one time restriction must be specified
  []
);

/**
 * Custom validation for TIME_BASED policies to ensure at least one time restriction is specified
 */
export function validateTimeBasedPolicy(config: TimeBasedPolicyConfig): boolean {
  return !!(
    config.allowedDays ||
    (config.allowedHoursStart && config.allowedHoursEnd) ||
    config.startDate ||
    config.endDate ||
    config.expiresAfterDays
  );
}

/**
 * Example of a valid TIME_BASED policy
 */
export const timeBasedExample = {
  name: 'Business Hours Only',
  description: 'Allow access only during business hours',
  type: PolicyType.TIME_BASED,
  allowedDays: [1, 2, 3, 4, 5], // Monday to Friday
  allowedHoursStart: '09:00',
  allowedHoursEnd: '17:00',
  timezone: 'America/New_York',
  action: 'DENY',
  message: 'Access is only allowed during business hours (9 AM - 5 PM ET, Mon-Fri)'
}; 