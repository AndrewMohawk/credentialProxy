// Define all policy-related types in one place

// Valid policy types to match backend expectations
export const POLICY_TYPES = {
  ALLOW_LIST: 'ALLOW_LIST',
  DENY_LIST: 'DENY_LIST',
  TIME_BASED: 'TIME_BASED',
  COUNT_BASED: 'COUNT_BASED',
  RATE_LIMITING: 'RATE_LIMITING',
  PATTERN_MATCH: 'PATTERN_MATCH',
  IP_RESTRICTION: 'IP_RESTRICTION',
  MANUAL_APPROVAL: 'MANUAL_APPROVAL',
  CUSTOM: 'PATTERN_MATCH' // Default to PATTERN_MATCH for custom policies
} as const;

// Define the policy type
export type Policy = {
  id: string;
  name: string;
  type: string;
  description: string;
  scope: string;
  credentialId?: string;
  credentialName?: string;
  pluginId?: string;
  pluginName?: string;
  applicationId?: string;
  applicationName?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
};

// Define policy template type
export type PolicyTemplate = {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  credentialTypes: string[];
  configTemplate: Record<string, any>;
  scope: string;
  priority: number;
  isRecommended: boolean;
};

// Define credential type
export type Credential = {
  id: string;
  name: string;
  type: string;
  description?: string;
};

// Define plugin type
export type Plugin = {
  id: string;
  name: string;
  description?: string;
  type?: string;
  version?: string;
  enabled?: boolean;
};

// Define type for policy creation data
export type PolicyData = {
  name: string;
  description: string;
  type: string;
  scope: "GLOBAL" | "PLUGIN" | "CREDENTIAL";
  priority: number;
  isEnabled: boolean;
  config: Record<string, any>;
  credentialId?: string;
  pluginId?: string;
};

// Mock templates for the UI demo
export const MOCK_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'read-only',
    name: 'Read-Only Access',
    description: 'Allow only read operations, deny all write/modify operations',
    type: 'ALLOW_LIST',
    category: 'Access Control',
    credentialTypes: ['api-key', 'oauth', 'ethereum', 'database'],
    configTemplate: {
      operations: ['GET', 'READ', 'VIEW'],
    },
    scope: 'CREDENTIAL',
    priority: 100,
    isRecommended: true,
  },
  {
    id: 'business-hours',
    name: 'Business Hours Only',
    description: 'Allow access only during business hours (9 AM - 5 PM, Monday-Friday)',
    type: 'TIME_BASED',
    category: 'Access Control',
    credentialTypes: ['api-key', 'oauth', 'ethereum', 'database'],
    configTemplate: {
      recurringSchedule: {
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        hoursOfDay: [9, 10, 11, 12, 13, 14, 15, 16, 17],
      },
      timeZone: 'UTC',
    },
    scope: 'CREDENTIAL',
    priority: 90,
    isRecommended: false,
  },
  {
    id: 'rate-limit',
    name: 'API Rate Limiting',
    description: 'Limit API requests to prevent abuse',
    type: 'RATE_LIMITING',
    category: 'Usage Limits',
    credentialTypes: ['api-key'],
    configTemplate: {
      maxRequests: 100,
      timeWindow: 60, // 1 minute
      perIp: true,
    },
    scope: 'CREDENTIAL',
    priority: 80,
    isRecommended: true,
  },
];

// Mock for policy types available in the system
export const POLICY_TYPES_DISPLAY = [
  { id: 'ALLOW_LIST', name: 'Allow List', description: 'Allows only specified operations and parameters' },
  { id: 'DENY_LIST', name: 'Deny List', description: 'Denies specified operations and parameters' },
  { id: 'TIME_BASED', name: 'Time-Based Access', description: 'Allows access only during specific time periods' },
  { id: 'COUNT_BASED', name: 'Count-Based Access', description: 'Limits access based on count of operations' },
  { id: 'MANUAL_APPROVAL', name: 'Manual Approval', description: 'Requires manual approval for operations' },
  { id: 'PATTERN_MATCH', name: 'Pattern Match', description: 'Allows/denies access based on parameter patterns' },
  { id: 'RATE_LIMITING', name: 'Rate Limiting', description: 'Limits request rate for operations' },
  { id: 'IP_RESTRICTION', name: 'IP Restriction', description: 'Restricts access to specific IP addresses' }
]; 