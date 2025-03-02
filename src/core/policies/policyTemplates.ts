import { PolicyType, PolicyScope } from './policyTypes';

/**
 * Template category for organizing policy templates
 */
export enum TemplateCategory {
  SECURITY = 'Security',
  ACCESS_CONTROL = 'Access Control',
  USAGE_LIMITS = 'Usage Limits',
  MONITORING = 'Monitoring',
  APPROVAL = 'Approval Workflow',
}

/**
 * Interface for a policy template
 */
export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  type: PolicyType;
  category: TemplateCategory;
  credentialTypes: string[];  // List of credential type IDs this template applies to
  configTemplate: Record<string, any>;
  scope: PolicyScope;
  priority: number;
  isRecommended: boolean;
}

/**
 * Base templates available for all credential types
 */
export const BASE_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'read-only',
    name: 'Read-Only Access',
    description: 'Allow only read operations, deny all write/modify operations',
    type: PolicyType.ALLOW_LIST,
    category: TemplateCategory.ACCESS_CONTROL,
    credentialTypes: ['api-key', 'oauth', 'ethereum', 'database'],
    configTemplate: {
      operations: [], // Will be populated based on credential type
    },
    scope: PolicyScope.CREDENTIAL,
    priority: 100,
    isRecommended: true,
  },
  {
    id: 'business-hours-only',
    name: 'Business Hours Only',
    description: 'Allow access only during business hours (9 AM - 5 PM, Monday-Friday)',
    type: PolicyType.TIME_BASED,
    category: TemplateCategory.ACCESS_CONTROL,
    credentialTypes: ['api-key', 'oauth', 'ethereum', 'database'],
    configTemplate: {
      recurringSchedule: {
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        hoursOfDay: [9, 10, 11, 12, 13, 14, 15, 16, 17],
      },
      timeZone: 'UTC',
    },
    scope: PolicyScope.CREDENTIAL,
    priority: 90,
    isRecommended: false,
  },
  {
    id: 'manual-approval-sensitive',
    name: 'Manual Approval for Sensitive Operations',
    description: 'Require manual approval for sensitive operations',
    type: PolicyType.MANUAL_APPROVAL,
    category: TemplateCategory.APPROVAL,
    credentialTypes: ['api-key', 'oauth', 'ethereum', 'database'],
    configTemplate: {
      autoExpireMinutes: 60,
      operations: [], // Will be populated based on credential type
    },
    scope: PolicyScope.CREDENTIAL,
    priority: 100,
    isRecommended: true,
  },
];

/**
 * Templates for API Key credentials
 */
export const API_KEY_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'api-key-rate-limit',
    name: 'API Key Rate Limiting',
    description: 'Limit API requests to prevent abuse',
    type: PolicyType.RATE_LIMITING,
    category: TemplateCategory.USAGE_LIMITS,
    credentialTypes: ['api-key'],
    configTemplate: {
      maxRequests: 100,
      timeWindow: 60, // 1 minute
      perIp: true,
    },
    scope: PolicyScope.CREDENTIAL,
    priority: 80,
    isRecommended: true,
  },
  {
    id: 'api-key-usage-threshold',
    name: 'API Key Monthly Usage Threshold',
    description: 'Limit monthly API calls to control costs',
    type: PolicyType.USAGE_THRESHOLD,
    category: TemplateCategory.USAGE_LIMITS,
    credentialTypes: ['api-key'],
    configTemplate: {
      thresholdType: 'api_calls',
      maxValue: 10000,
      timeWindow: 'monthly',
    },
    scope: PolicyScope.CREDENTIAL,
    priority: 70,
    isRecommended: true,
  },
];

/**
 * Templates for OAuth credentials
 */
export const OAUTH_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'oauth-token-refresh-only',
    name: 'Token Refresh Only',
    description: 'Allow only token refresh operations',
    type: PolicyType.ALLOW_LIST,
    category: TemplateCategory.ACCESS_CONTROL,
    credentialTypes: ['oauth'],
    configTemplate: {
      operations: ['refreshToken'],
    },
    scope: PolicyScope.CREDENTIAL,
    priority: 100,
    isRecommended: false,
  },
  {
    id: 'oauth-deny-sensitive',
    name: 'Deny Sensitive Operations',
    description: 'Deny access to sensitive operations',
    type: PolicyType.DENY_LIST,
    category: TemplateCategory.SECURITY,
    credentialTypes: ['oauth'],
    configTemplate: {
      operations: ['writeData', 'deleteData', 'modifySettings'],
    },
    scope: PolicyScope.CREDENTIAL,
    priority: 90,
    isRecommended: true,
  },
];

/**
 * Templates for Ethereum credentials
 */
export const ETHEREUM_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'ethereum-read-only',
    name: 'Read-Only Blockchain Access',
    description: 'Allow only read operations on the blockchain',
    type: PolicyType.ALLOW_LIST,
    category: TemplateCategory.ACCESS_CONTROL,
    credentialTypes: ['ethereum'],
    configTemplate: {
      operations: ['getBalance', 'call', 'getTransactionCount', 'getCode', 'getStorageAt'],
    },
    scope: PolicyScope.CREDENTIAL,
    priority: 100,
    isRecommended: true,
  },
  {
    id: 'ethereum-transaction-limit',
    name: 'Ethereum Transaction Value Limit',
    description: 'Limit the value of Ethereum transactions',
    type: PolicyType.USAGE_THRESHOLD,
    category: TemplateCategory.USAGE_LIMITS,
    credentialTypes: ['ethereum'],
    configTemplate: {
      thresholdType: 'eth_value',
      maxValue: 0.1, // 0.1 ETH
      timeWindow: 'daily',
    },
    scope: PolicyScope.CREDENTIAL,
    priority: 95,
    isRecommended: true,
  },
  {
    id: 'ethereum-transaction-approval',
    name: 'Approve All Transactions',
    description: 'Require manual approval for all blockchain transactions',
    type: PolicyType.MANUAL_APPROVAL,
    category: TemplateCategory.APPROVAL,
    credentialTypes: ['ethereum'],
    configTemplate: {
      operations: ['sendTransaction', 'signTransaction', 'sign'],
      autoExpireMinutes: 30,
    },
    scope: PolicyScope.CREDENTIAL,
    priority: 100,
    isRecommended: true,
  },
];

/**
 * Templates for Database credentials
 */
export const DATABASE_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'database-read-only',
    name: 'Read-Only Database Access',
    description: 'Allow only SELECT queries, deny all write operations',
    type: PolicyType.PATTERN_MATCH,
    category: TemplateCategory.ACCESS_CONTROL,
    credentialTypes: ['database'],
    configTemplate: {
      patterns: [
        {
          parameterName: 'query',
          pattern: '^\\s*SELECT\\s+',
          allow: true,
        },
        {
          parameterName: 'query',
          pattern: '^\\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\\s+',
          allow: false,
        },
      ],
    },
    scope: PolicyScope.CREDENTIAL,
    priority: 100,
    isRecommended: true,
  },
  {
    id: 'database-business-hours',
    name: 'Database Business Hours Only',
    description: 'Allow database access only during business hours',
    type: PolicyType.TIME_BASED,
    category: TemplateCategory.ACCESS_CONTROL,
    credentialTypes: ['database'],
    configTemplate: {
      recurringSchedule: {
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        hoursOfDay: [9, 10, 11, 12, 13, 14, 15, 16, 17],
      },
      timeZone: 'UTC',
    },
    scope: PolicyScope.CREDENTIAL,
    priority: 50,
    isRecommended: false,
  },
];

/**
 * All policy templates
 */
export const ALL_TEMPLATES: PolicyTemplate[] = [
  ...BASE_TEMPLATES,
  ...API_KEY_TEMPLATES,
  ...OAUTH_TEMPLATES,
  ...ETHEREUM_TEMPLATES,
  ...DATABASE_TEMPLATES,
];

/**
 * Get templates for a specific credential type
 * @param credentialType The credential type ID
 * @returns Array of applicable policy templates
 */
export function getTemplatesForCredentialType(credentialType: string): PolicyTemplate[] {
  return ALL_TEMPLATES.filter(template => 
    template.credentialTypes.includes(credentialType)
  );
}

/**
 * Get a specific template by ID
 * @param templateId The template ID
 * @returns The policy template or undefined if not found
 */
export function getTemplateById(templateId: string): PolicyTemplate | undefined {
  return ALL_TEMPLATES.find(template => template.id === templateId);
}

/**
 * Get recommended templates for a specific credential type
 * @param credentialType The credential type ID
 * @returns Array of recommended policy templates
 */
export function getRecommendedTemplates(credentialType: string): PolicyTemplate[] {
  return getTemplatesForCredentialType(credentialType)
    .filter(template => template.isRecommended);
} 