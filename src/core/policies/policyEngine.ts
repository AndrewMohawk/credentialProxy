import { prisma } from '../../db/prisma';
import { logger } from '../../utils/logger';

// Policy types
export enum PolicyType {
  ALLOW_LIST = 'ALLOW_LIST',
  DENY_LIST = 'DENY_LIST',
  TIME_BASED = 'TIME_BASED',
  COUNT_BASED = 'COUNT_BASED',
  MANUAL_APPROVAL = 'MANUAL_APPROVAL',
}

// Policy status
export enum PolicyStatus {
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  PENDING = 'PENDING',
}

// Policy interface
export interface Policy {
  id: string;
  type: PolicyType;
  name: string;
  description?: string;
  applicationId?: string;
  credentialId?: string;
  config: Record<string, any>;
  priority: number;
  isActive: boolean;
}

// Proxy request interface
export interface ProxyRequest {
  id: string;
  applicationId: string;
  credentialId: string;
  operation: string;
  parameters: Record<string, any>;
  timestamp: Date;
}

// Policy evaluation result
export interface PolicyEvaluationResult {
  status: PolicyStatus;
  policyId?: string;
  reason?: string;
  requiresApproval?: boolean;
}

/**
 * Evaluate a request against a set of policies
 * @param request The request to evaluate
 * @param policies The policies to evaluate against
 * @returns The result of the policy evaluation
 */
export const evaluateRequest = async (
  request: ProxyRequest,
  policies: Policy[] = []
): Promise<PolicyEvaluationResult> => {
  logger.info(`Evaluating request ${request.id} for application ${request.applicationId}`);
  
  // If no policies are provided, fetch them from the database
  if (policies.length === 0) {
    try {
      // Fetch policies from the database
      const dbPolicies = await prisma.policy.findMany({
        where: {
          OR: [
            { applicationId: request.applicationId },
            { credentialId: request.credentialId },
            { 
              AND: [
                { applicationId: { equals: null } },
                { credentialId: request.credentialId }
              ]
            } // Global policies for this credential
          ]
        }
      });
      
      if (dbPolicies.length === 0) {
        logger.info(`No policies found for request ${request.id}, approving by default`);
        return {
          status: PolicyStatus.APPROVED,
          reason: 'No policies found, default approval',
        };
      }
      
      // Map database policies to our Policy interface
      policies = dbPolicies.map((dbPolicy: any) => ({
        id: dbPolicy.id,
        type: dbPolicy.type as PolicyType,
        name: dbPolicy.name,
        description: dbPolicy.name, // Use name as description if not available
        applicationId: dbPolicy.applicationId || undefined,
        credentialId: dbPolicy.credentialId,
        config: dbPolicy.configuration as Record<string, any>,
        priority: 0, // Default priority
        isActive: dbPolicy.isEnabled || false,
      }));
    } catch (error) {
      logger.error(`Error fetching policies: ${error}`);
      return {
        status: PolicyStatus.APPROVED,
        reason: 'No policies defined',
      };
    }
  }
  
  // Sort policies by priority (higher priority first)
  const sortedPolicies = [...policies].sort((a, b) => b.priority - a.priority);
  
  // Check for manual approval policies first
  const manualApprovalPolicy = sortedPolicies.find(
    (p) => p.isActive && p.type === PolicyType.MANUAL_APPROVAL
  );
  
  if (manualApprovalPolicy) {
    logger.info(`Request ${request.id} requires manual approval due to policy ${manualApprovalPolicy.id}`);
    return {
      status: PolicyStatus.PENDING,
      policyId: manualApprovalPolicy.id,
      reason: 'Request requires manual approval',
      requiresApproval: true,
    };
  }
  
  // Evaluate each policy in order of priority
  for (const policy of sortedPolicies) {
    if (!policy.isActive) {
      continue;
    }
    
    const result = await evaluatePolicy(request, policy);
    
    // If the policy explicitly approves or denies, return the result
    if (result.status === PolicyStatus.APPROVED) {
      return {
        status: PolicyStatus.APPROVED,
        policyId: policy.id,
        reason: `Request approved by policy: ${policy.name}`,
      };
    } else if (result.status === PolicyStatus.DENIED) {
      return {
        status: PolicyStatus.DENIED,
        policyId: policy.id,
        reason: `Request denied by policy: ${policy.name}`,
      };
    }
  }
  
  // If no policy explicitly approved or denied, deny by default
  return {
    status: PolicyStatus.DENIED,
    reason: 'No policy approved the request',
  };
};

/**
 * Evaluate a single policy against a request
 * @param request The request to evaluate
 * @param policy The policy to evaluate
 * @returns The result of the policy evaluation
 */
const evaluatePolicy = async (
  request: ProxyRequest,
  policy: Policy
): Promise<PolicyEvaluationResult> => {
  try {
    switch (policy.type) {
      case PolicyType.ALLOW_LIST:
        return evaluateAllowListPolicy(request, policy);
      case PolicyType.DENY_LIST:
        return evaluateDenyListPolicy(request, policy);
      case PolicyType.TIME_BASED:
        return evaluateTimeBasedPolicy(request, policy);
      case PolicyType.COUNT_BASED:
        return evaluateCountBasedPolicy(request, policy);
      case PolicyType.MANUAL_APPROVAL:
        return {
          status: PolicyStatus.PENDING,
          policyId: policy.id,
          reason: 'Request requires manual approval',
          requiresApproval: true,
        };
      default:
        logger.warn(`Unknown policy type: ${policy.type}`);
        return {
          status: PolicyStatus.DENIED,
          policyId: policy.id,
          reason: `Unknown policy type: ${policy.type}`,
        };
    }
  } catch (error: any) {
    logger.error(`Error evaluating policy ${policy.id}: ${error.message}`);
    return {
      status: PolicyStatus.DENIED,
      policyId: policy.id,
      reason: `Error evaluating policy: ${error.message}`,
    };
  }
};

/**
 * Evaluate an allow list policy
 */
const evaluateAllowListPolicy = (
  request: ProxyRequest,
  policy: Policy
): PolicyEvaluationResult => {
  const { operations = [], parameters = {} } = policy.config;
  
  // Check if the operation is in the allow list
  if (operations.length > 0 && !operations.includes(request.operation)) {
    return {
      status: PolicyStatus.DENIED,
      policyId: policy.id,
      reason: `Operation ${request.operation} is not in the allow list`,
    };
  }
  
  // Check if the parameters match the required parameters
  for (const [key, value] of Object.entries(parameters)) {
    if (request.parameters[key] !== value) {
      return {
        status: PolicyStatus.DENIED,
        policyId: policy.id,
        reason: `Parameter ${key} does not match the required value`,
      };
    }
  }
  
  return {
    status: PolicyStatus.APPROVED,
    policyId: policy.id,
  };
};

/**
 * Evaluate a deny list policy
 */
const evaluateDenyListPolicy = (
  request: ProxyRequest,
  policy: Policy
): PolicyEvaluationResult => {
  const { operations = [], parameters = {} } = policy.config;
  
  // Check if the operation is in the deny list
  if (operations.includes(request.operation)) {
    return {
      status: PolicyStatus.DENIED,
      policyId: policy.id,
      reason: `Operation ${request.operation} is in the deny list`,
    };
  }
  
  // Check if any of the parameters match the denied parameters
  for (const [key, value] of Object.entries(parameters)) {
    if (request.parameters[key] === value) {
      return {
        status: PolicyStatus.DENIED,
        policyId: policy.id,
        reason: `Parameter ${key} matches a denied value`,
      };
    }
  }
  
  return {
    status: PolicyStatus.APPROVED,
    policyId: policy.id,
  };
};

/**
 * Evaluate a time-based policy
 */
const evaluateTimeBasedPolicy = (
  request: ProxyRequest,
  policy: Policy
): PolicyEvaluationResult => {
  const { startTime, endTime, daysOfWeek = [0, 1, 2, 3, 4, 5, 6] } = policy.config;
  const requestTime = request.timestamp;
  const currentDay = requestTime.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Check if the current day is allowed
  if (!daysOfWeek.includes(currentDay)) {
    return {
      status: PolicyStatus.DENIED,
      policyId: policy.id,
      reason: `Requests are not allowed on this day of the week`,
    };
  }
  
  // If start and end times are specified, check if the current time is within the allowed range
  if (startTime && endTime) {
    const currentHour = requestTime.getHours();
    const currentMinute = requestTime.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;
    
    if (currentTimeMinutes < startTimeMinutes || currentTimeMinutes > endTimeMinutes) {
      return {
        status: PolicyStatus.DENIED,
        policyId: policy.id,
        reason: `Requests are only allowed between ${startTime} and ${endTime}`,
      };
    }
  }
  
  return {
    status: PolicyStatus.APPROVED,
    policyId: policy.id,
  };
};

/**
 * Evaluate a count-based policy
 */
const evaluateCountBasedPolicy = (
  request: ProxyRequest,
  policy: Policy
): PolicyEvaluationResult => {
  const { maxRequests = 100, timeWindowMinutes = 60 } = policy.config;
  
  // In a real implementation, we would check the database for the number of requests
  // made by this application for this credential within the time window
  // For now, we'll just approve the request
  
  return {
    status: PolicyStatus.APPROVED,
    policyId: policy.id,
  };
};

// Log policy evaluation for audit purposes
const logPolicyEvaluation = async ({
  policyId,
  applicationId,
  credentialId,
  requestData,
  allowed,
  reason
}: {
  policyId?: string;
  applicationId: string;
  credentialId: string;
  requestData: ProxyRequest;
  allowed: boolean;
  reason: string;
}): Promise<void> => {
  try {
    await prisma.auditEvent.create({
      data: {
        type: 'policy_evaluation',
        details: JSON.stringify({
          requestData,
          allowed,
          reason
        }),
        policyId,
        applicationId,
        credentialId,
        requestStatus: allowed ? PolicyStatus.APPROVED : PolicyStatus.DENIED
      }
    });
  } catch (error) {
    logger.error(`Error logging policy evaluation: ${error}`);
  }
}; 