import { PolicyType } from '../policyEngine';
import { BasePolicyConfig, createPolicySchema } from './baseSchema';

/**
 * Configuration for a MANUAL_APPROVAL policy
 */
export interface ManualApprovalPolicyConfig extends BasePolicyConfig {
  type: PolicyType.MANUAL_APPROVAL;
  approvers: string[];
  minimumApprovers?: number;
  expirationMinutes?: number;
  requireJustification?: boolean;
  restrictedOperations?: string[];
  bypassEmails?: string[];
  notificationChannel?: 'email' | 'slack' | 'teams' | 'webhook';
  webhookUrl?: string;
  message?: string;
}

/**
 * JSON Schema for MANUAL_APPROVAL policy
 */
export const manualApprovalSchema = createPolicySchema(
  {
    approvers: {
      type: 'array',
      items: {
        type: 'string',
        format: 'email'
      },
      minItems: 1,
      description: 'List of approver email addresses'
    },
    minimumApprovers: {
      type: 'integer',
      minimum: 1,
      description: 'Minimum number of approvals required'
    },
    expirationMinutes: {
      type: 'integer',
      minimum: 1,
      default: 60,
      description: 'How long the approval request remains valid, in minutes'
    },
    requireJustification: {
      type: 'boolean',
      default: true,
      description: 'Whether user must provide justification for the request'
    },
    restrictedOperations: {
      type: 'array',
      items: {
        type: 'string'
      },
      description: 'List of operations that require approval (if empty, all operations require approval)'
    },
    bypassEmails: {
      type: 'array',
      items: {
        type: 'string',
        format: 'email'
      },
      description: 'List of user emails that can bypass approval'
    },
    notificationChannel: {
      type: 'string',
      enum: ['email', 'slack', 'teams', 'webhook'],
      default: 'email',
      description: 'Channel to send approval notifications'
    },
    webhookUrl: {
      type: 'string',
      format: 'uri',
      description: 'Webhook URL for approval notifications (required if notificationChannel is webhook)'
    },
    message: {
      type: 'string',
      description: 'Custom message to display when approval is required'
    }
  },
  [
    'approvers'
  ]
);

/**
 * Example of a valid MANUAL_APPROVAL policy
 */
export const manualApprovalExample = {
  name: 'Approval for Sensitive Operations',
  description: 'Requires manual approval for sensitive operations on production credentials',
  type: PolicyType.MANUAL_APPROVAL,
  approvers: ['secops@example.com', 'admin@example.com'],
  minimumApprovers: 2,
  expirationMinutes: 120,
  requireJustification: true,
  restrictedOperations: ['UPDATE', 'DELETE', 'CREATE'],
  notificationChannel: 'slack',
  message: 'This operation requires approval from the security team'
}; 