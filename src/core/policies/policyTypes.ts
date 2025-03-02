// Policy type definitions for the Credential Proxy

/**
 * Enum defining all supported policy types
 */
export enum PolicyType {
  // Existing policy types
  ALLOW_LIST = 'ALLOW_LIST',
  DENY_LIST = 'DENY_LIST',
  TIME_BASED = 'TIME_BASED',
  COUNT_BASED = 'COUNT_BASED',
  MANUAL_APPROVAL = 'MANUAL_APPROVAL',
  PATTERN_MATCH = 'PATTERN_MATCH',
  
  // New policy types
  USAGE_THRESHOLD = 'USAGE_THRESHOLD',
  IP_RESTRICTION = 'IP_RESTRICTION',
  RATE_LIMITING = 'RATE_LIMITING',
  APPROVAL_CHAIN = 'APPROVAL_CHAIN',
  CONTEXT_AWARE = 'CONTEXT_AWARE',
}

/**
 * Policy status enum
 */
export enum PolicyStatus {
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  PENDING = 'PENDING',
}

/**
 * Policy scope - determines where the policy applies
 */
export enum PolicyScope {
  GLOBAL = 'GLOBAL',           // Applies to all credentials of a specific type
  CREDENTIAL = 'CREDENTIAL',   // Applies to a specific credential
  APPLICATION = 'APPLICATION',  // Applies to a specific application using a credential
}

/**
 * Information about each policy type including description and configuration schema
 */
export const POLICY_TYPE_INFO = {
  [PolicyType.ALLOW_LIST]: {
    name: 'Allow List',
    description: 'Allows only specified operations and parameters, denies everything else',
    configSchema: {
      type: 'object',
      properties: {
        operations: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of allowed operations'
        },
        parameters: {
          type: 'object',
          additionalProperties: true,
          description: 'Required parameter values'
        }
      },
      required: ['operations']
    }
  },
  
  [PolicyType.DENY_LIST]: {
    name: 'Deny List',
    description: 'Denies specified operations and parameters, allows everything else',
    configSchema: {
      type: 'object',
      properties: {
        operations: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of denied operations'
        },
        parameters: {
          type: 'object',
          additionalProperties: true,
          description: 'Denied parameter values'
        }
      },
      required: ['operations']
    }
  },
  
  [PolicyType.TIME_BASED]: {
    name: 'Time-Based Access',
    description: 'Allows access only during specific time periods',
    configSchema: {
      type: 'object',
      properties: {
        startTime: {
          type: 'string',
          format: 'date-time',
          description: 'Start time for allowed access'
        },
        endTime: {
          type: 'string',
          format: 'date-time',
          description: 'End time for allowed access'
        },
        timeZone: {
          type: 'string',
          description: 'Time zone for evaluating times'
        },
        recurringSchedule: {
          type: 'object',
          properties: {
            daysOfWeek: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
              }
            },
            hoursOfDay: {
              type: 'array',
              items: {
                type: 'integer',
                minimum: 0,
                maximum: 23
              }
            }
          }
        }
      }
    }
  },
  
  [PolicyType.COUNT_BASED]: {
    name: 'Count-Based Limit',
    description: 'Limits the number of times a credential can be used',
    configSchema: {
      type: 'object',
      properties: {
        maxCount: {
          type: 'integer',
          minimum: 1,
          description: 'Maximum number of allowed uses'
        },
        resetPeriod: {
          type: 'string',
          enum: ['never', 'daily', 'weekly', 'monthly'],
          description: 'Period after which the count resets'
        }
      },
      required: ['maxCount']
    }
  },
  
  [PolicyType.MANUAL_APPROVAL]: {
    name: 'Manual Approval',
    description: 'Requires manual approval for all operations',
    configSchema: {
      type: 'object',
      properties: {
        approvers: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of user IDs who can approve'
        },
        minimumApprovals: {
          type: 'integer',
          minimum: 1,
          description: 'Minimum number of approvals required'
        },
        autoExpireMinutes: {
          type: 'integer',
          minimum: 1,
          description: 'Minutes after which pending requests expire'
        }
      }
    }
  },
  
  [PolicyType.PATTERN_MATCH]: {
    name: 'Pattern Match',
    description: 'Allows or denies based on regex pattern matching on parameters',
    configSchema: {
      type: 'object',
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameterName: { type: 'string' },
              pattern: { type: 'string' },
              allow: { type: 'boolean' }
            },
            required: ['parameterName', 'pattern', 'allow']
          }
        }
      },
      required: ['patterns']
    }
  },
  
  [PolicyType.USAGE_THRESHOLD]: {
    name: 'Usage Threshold',
    description: 'Limits usage based on a measurable value (e.g., API calls, transaction costs)',
    configSchema: {
      type: 'object',
      properties: {
        thresholdType: {
          type: 'string',
          enum: ['request_count', 'eth_value', 'api_calls', 'data_transferred'],
          description: 'Type of threshold to measure'
        },
        maxValue: {
          type: 'number',
          minimum: 0,
          description: 'Maximum allowed value'
        },
        timeWindow: {
          type: 'string',
          enum: ['hourly', 'daily', 'weekly', 'monthly'],
          description: 'Time window for the threshold'
        }
      },
      required: ['thresholdType', 'maxValue', 'timeWindow']
    }
  },
  
  [PolicyType.IP_RESTRICTION]: {
    name: 'IP Restriction',
    description: 'Restricts access to specific IP addresses or ranges',
    configSchema: {
      type: 'object',
      properties: {
        allowedIps: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of allowed IP addresses or CIDR ranges'
        },
        deniedIps: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of denied IP addresses or CIDR ranges'
        },
        defaultAction: {
          type: 'string',
          enum: ['allow', 'deny'],
          description: 'Default action if no IP matches'
        }
      },
      required: ['defaultAction']
    }
  },
  
  [PolicyType.RATE_LIMITING]: {
    name: 'Rate Limiting',
    description: 'Limits the rate of requests per time period',
    configSchema: {
      type: 'object',
      properties: {
        maxRequests: {
          type: 'integer',
          minimum: 1,
          description: 'Maximum number of requests'
        },
        timeWindow: {
          type: 'integer',
          minimum: 1,
          description: 'Time window in seconds'
        },
        perIp: {
          type: 'boolean',
          description: 'Whether to apply rate limit per IP address'
        }
      },
      required: ['maxRequests', 'timeWindow']
    }
  },
  
  [PolicyType.APPROVAL_CHAIN]: {
    name: 'Approval Chain',
    description: 'Requires approval from multiple users in a specific order',
    configSchema: {
      type: 'object',
      properties: {
        approvalSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              approvers: {
                type: 'array',
                items: { type: 'string' }
              },
              minApprovals: { type: 'integer', minimum: 1 }
            },
            required: ['name', 'approvers', 'minApprovals']
          }
        },
        expirationHours: {
          type: 'integer',
          minimum: 1,
          description: 'Hours after which approval requests expire'
        }
      },
      required: ['approvalSteps']
    }
  },
  
  [PolicyType.CONTEXT_AWARE]: {
    name: 'Context-Aware',
    description: 'Makes decisions based on contextual factors',
    configSchema: {
      type: 'object',
      properties: {
        conditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: {
                type: 'string',
                enum: ['time_of_day', 'day_of_week', 'request_frequency', 'previous_usage', 'location']
              },
              operator: {
                type: 'string',
                enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'not_contains']
              },
              value: { type: 'any' },
              action: {
                type: 'string',
                enum: ['allow', 'deny', 'require_approval']
              }
            },
            required: ['factor', 'operator', 'value', 'action']
          }
        },
        defaultAction: {
          type: 'string',
          enum: ['allow', 'deny', 'require_approval'],
          description: 'Default action if no conditions match'
        }
      },
      required: ['conditions', 'defaultAction']
    }
  }
};

/**
 * Interface for policy evaluation results
 */
export interface PolicyEvaluationResult {
  status: PolicyStatus;
  policyId?: string;
  reason?: string;
  requiresApproval?: boolean;
}

/**
 * Interface for policy configuration
 */
export interface Policy {
  id: string;
  type: PolicyType;
  name: string;
  description?: string;
  scope: PolicyScope;
  applicationId?: string;
  credentialId?: string;
  credentialTypeId?: string; // For global policies that apply to all credentials of a type
  config: Record<string, any>;
  priority: number;
  isActive: boolean;
} 