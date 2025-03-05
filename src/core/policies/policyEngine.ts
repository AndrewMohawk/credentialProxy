import { prisma } from '../../db/prisma';
import { logger } from '../../utils/logger';

/**
 * Policy Engine - Core types and interfaces for policy management
 */

/**
 * Policy Types Enum
 */
export enum PolicyType {
  ALLOW_LIST = 'ALLOW_LIST',
  DENY_LIST = 'DENY_LIST',
  TIME_BASED = 'TIME_BASED',
  COUNT_BASED = 'COUNT_BASED',
  MANUAL_APPROVAL = 'MANUAL_APPROVAL'
}

/**
 * Base Policy Interface - Common to all policy types
 */
export interface Policy {
  id?: string;
  name: string;
  description: string;
  type: PolicyType;
  version?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  message?: string; // Custom message to display when policy denies access
  
  // ALLOW_LIST specific properties
  targetField?: string;
  allowedValues?: string[];
  
  // DENY_LIST specific properties
  deniedValues?: string[];
  
  // TIME_BASED specific properties
  allowedDays?: string[];
  allowedHoursStart?: string;
  allowedHoursEnd?: string;
  timezone?: string;
  
  // COUNT_BASED specific properties
  maxRequests?: number;
  timeWindowSeconds?: number;
  
  // MANUAL_APPROVAL specific properties
  approvers?: string[];
  expirationMinutes?: number;
}

/**
 * Policy Request - Request context passed to policy evaluation
 */
export interface PolicyRequest {
  path?: string;
  method?: string;
  ip?: string;
  user?: {
    id?: string;
    email?: string;
    roles?: string[];
  };
  headers?: Record<string, string>;
  timestamp?: string;
  credential?: {
    id: string;
    type: string;
    name: string;
  };
  [key: string]: any;
}

/**
 * Policy Result - Result of a policy evaluation
 */
export interface PolicyResult {
  allowed: boolean;
  reason: string;
  policyId?: string;
}

/**
 * Policy Blueprint - Template for creating policies
 */
export interface PolicyBlueprint {
  id: string;
  name: string;
  description: string;
  pluginType?: string;
  policyConfig: Partial<Policy>;
  isDefault?: boolean;
  tags?: string[];
}

/**
 * Policy status
 */
export enum PolicyStatus {
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  PENDING = 'PENDING',
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
 * Interface for policy evaluation request
 */
export interface PolicyEvaluationRequest {
  applicationId: string;
  credentialId: string;
  operation: string;
  parameters: Record<string, any>;
  simulate?: boolean; // Flag to indicate if this is a simulation request
}

/**
 * Interface for parameter constraint 
 */
export interface ParameterConstraint {
  min?: number;
  max?: number;
  pattern?: string;
  [key: string]: any;
}

/**
 * Check if an application has access to a credential
 * This function abstracts the database check, making it more adaptable to schema changes
 */
export const checkApplicationCredentialAccess = async (
  applicationId: string,
  credentialId: string
): Promise<boolean> => {
  try {
    // Check through direct relationship first
    // Uncomment the approach that matches your schema
    
    // Approach 1: Checking through Application model
    const appWithCredential = await prisma.application.findFirst({
      where: {
        id: applicationId,
        credentials: {
          some: {
            id: credentialId
          }
        }
      }
    });

    if (appWithCredential) return true;
    
    // Approach 2: Using a join table if it exists
    try {
      // This is a fallback approach in case the schema has a join table
      const result = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM "ApplicationCredential" 
        WHERE "applicationId" = ${applicationId} AND "credentialId" = ${credentialId}
      `;
      
      // @ts-expect-error - we're using raw query which might return different shapes
      if (result && result[0] && result[0].count > 0) return true;
    } catch (err) {
      // Suppress errors from this approach - it's just a fallback
    }
    
    // No access found
    return false;
  } catch (error) {
    logger.error(`Error checking application-credential access: ${error}`);
    return false;
  }
};

/**
 * Get applicable policies for a credential and application
 * @param credentialId The credential ID
 * @param applicationId The application ID
 * @returns List of policies that apply to this credential and application
 */
export const getApplicablePolicies = async (
  credentialId: string, 
  applicationId: string
): Promise<Policy[]> => {
  try {
    // Create a flexible query to handle different schema structures
    const whereCondition: any = {
      OR: [
        // Specific to this credential and application
        { 
          AND: [
            { credentialId: { equals: credentialId } },
            { applicationId: { equals: applicationId } }
          ]
        },
        // Global policies for this credential
        { 
          AND: [
            { credentialId: { equals: credentialId } },
            { applicationId: { equals: null } }
          ] 
        },
        // Global policies for this application
        { 
          AND: [
            { applicationId: { equals: applicationId } },
            { credentialId: { equals: null } }
          ] 
        }
      ]
    };
    
    // Add active/enabled condition based on your schema
    try {
      // Try with isEnabled first
      whereCondition.isEnabled = true;
      const testQuery = await prisma.policy.findFirst({ where: whereCondition });
      
      // If it works, continue with this approach
    } catch (err) {
      // If isEnabled doesn't exist, try with isActive
      delete whereCondition.isEnabled;
      whereCondition.isActive = true;
    }
    
    const dbPolicies = await prisma.policy.findMany({ where: whereCondition });
    
    // Map database policies to our Policy interface
    const policies = dbPolicies.map((dbPolicy: any) => ({
      id: dbPolicy.id,
      type: dbPolicy.type as PolicyType,
      name: dbPolicy.name,
      description: dbPolicy.description || dbPolicy.name,
      applicationId: dbPolicy.applicationId || undefined,
      credentialId: dbPolicy.credentialId || undefined,
      // Handle config/configuration field based on schema
      config: (dbPolicy.config || dbPolicy.configuration) as Record<string, any>,
      priority: dbPolicy.priority || 0,
      isActive: dbPolicy.isActive || dbPolicy.isEnabled || false,
    }));
    
    // Sort policies by priority (higher priority first)
    return policies.sort((a, b) => b.priority - a.priority);
  } catch (error) {
    logger.error(`Error fetching policies: ${error}`);
    return [];
  }
};

/**
 * Evaluates a request against applicable policies
 * @param request The request to evaluate
 * @returns PolicyEvaluationResult indicating if the request is allowed
 */
export const evaluateRequest = async (
  request: PolicyEvaluationRequest | ProxyRequest
): Promise<PolicyEvaluationResult> => {
  try {
    const { applicationId, credentialId, operation, parameters } = request;
    const simulate = 'simulate' in request ? request.simulate : false;
    
    // Get the credential
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId }
    });
    
    if (!credential) {
      return {
        status: PolicyStatus.DENIED,
        reason: `Credential with id ${credentialId} not found`
      };
    }
    
    // Get the application
    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    });
    
    if (!application) {
      return {
        status: PolicyStatus.DENIED,
        reason: `Application with id ${applicationId} not found`
      };
    }
    
    // Check if the application has access to this credential
    const hasAccess = await checkApplicationCredentialAccess(applicationId, credentialId);
    
    if (!hasAccess) {
      return {
        status: PolicyStatus.DENIED,
        reason: `Application ${applicationId} does not have access to credential ${credentialId}`
      };
    }
    
    // Get applicable policies
    const policies = await getApplicablePolicies(credentialId, applicationId);
    
    if (policies.length === 0) {
      // If no policies, check if this is a simulation
      if (simulate) {
        return {
          status: PolicyStatus.APPROVED,
          reason: 'No policies found, default is to allow'
        };
      }
      
      // Default allow if no policies
      return {
        status: PolicyStatus.APPROVED
      };
    }
    
    // Evaluate the policies
    for (const policy of policies) {
      // Skip inactive policies
      if (!policy.isActive) continue;
      
      const result = evaluatePolicy(policy, request as PolicyRequest);
      
      // If this policy triggered, return its result
      if (!result.allowed) {
        // Add the policy id for reference (especially important for simulations)
        return {
          status: result.allowed ? PolicyStatus.APPROVED : PolicyStatus.DENIED,
          policyId: policy.id,
          reason: result.reason
        };
      }
    }
    
    // All policies passed or none were applicable
    return {
      status: PolicyStatus.APPROVED
    };
  } catch (error) {
    console.error('Error evaluating request against policies:', error);
    return {
      status: PolicyStatus.DENIED,
      reason: 'Error evaluating policies'
    };
  }
};

/**
 * Evaluates a policy against a request
 * @param policy The policy to evaluate
 * @param request The request context to evaluate against
 * @returns PolicyResult with decision and reason
 */
export const evaluatePolicy = (policy: Policy, request: PolicyRequest): PolicyResult => {
  // Don't evaluate inactive policies
  if (!policy.isActive) {
    return {
      allowed: true,
      reason: `Policy ${policy.id || policy.name} is inactive`,
      policyId: policy.id
    };
  }
  
  switch (policy.type) {
  case PolicyType.ALLOW_LIST:
    return evaluateAllowListPolicy(policy, request);
  case PolicyType.DENY_LIST:
    return evaluateDenyListPolicy(policy, request);
  case PolicyType.TIME_BASED:
    return evaluateTimeBasedPolicy(policy, request);
  case PolicyType.COUNT_BASED:
    return evaluateCountBasedPolicy(policy, request);
  case PolicyType.MANUAL_APPROVAL:
    return evaluateManualApprovalPolicy(policy, request);
  default:
    return {
      allowed: false,
      reason: `Unknown policy type: ${policy.type}`,
      policyId: policy.id
    };
  }
};

/**
 * Evaluate an ALLOW_LIST policy
 */
const evaluateAllowListPolicy = (policy: Policy, request: PolicyRequest): PolicyResult => {
  if (!policy.targetField || !policy.allowedValues || !policy.allowedValues.length) {
    return {
      allowed: false,
      reason: 'Policy is missing targetField or allowedValues',
      policyId: policy.id
    };
  }
  
  // Extract the target value from the request
  const targetValue = getNestedValue(request, policy.targetField);
  
  if (targetValue === undefined) {
    return {
      allowed: false,
      reason: `Request does not contain field '${policy.targetField}'`,
      policyId: policy.id
    };
  }
  
  // Check if target value is in the allowed list
  const allowed = policy.allowedValues.some(value => 
    typeof targetValue === 'string' 
      ? matchValue(targetValue, value)
      : targetValue === value
  );
  
  return {
    allowed,
    reason: allowed 
      ? `${policy.targetField} value is allowed` 
      : `${policy.targetField} value is not in allowed list`,
    policyId: policy.id
  };
};

/**
 * Evaluate a DENY_LIST policy
 */
const evaluateDenyListPolicy = (policy: Policy, request: PolicyRequest): PolicyResult => {
  if (!policy.targetField || !policy.deniedValues || !policy.deniedValues.length) {
    return {
      allowed: false,
      reason: 'Policy is missing targetField or deniedValues',
      policyId: policy.id
    };
  }
  
  // Extract the target value from the request
  const targetValue = getNestedValue(request, policy.targetField);
  
  if (targetValue === undefined) {
    return {
      allowed: true, // No value to deny against
      reason: `Request does not contain field '${policy.targetField}'`,
      policyId: policy.id
    };
  }
  
  // Check if target value is in the denied list
  const denied = policy.deniedValues.some(value => 
    typeof targetValue === 'string' 
      ? matchValue(targetValue, value)
      : targetValue === value
  );
  
  return {
    allowed: !denied,
    reason: denied 
      ? `${policy.targetField} value is in deny list` 
      : `${policy.targetField} value is not denied`,
    policyId: policy.id
  };
};

/**
 * Evaluate a TIME_BASED policy
 */
const evaluateTimeBasedPolicy = (policy: Policy, request: PolicyRequest): PolicyResult => {
  // Use request timestamp or current time
  const requestTime = request.timestamp 
    ? new Date(request.timestamp) 
    : new Date();
  
  // Set timezone if specified
  if (policy.timezone) {
    // Note: In a real implementation, we'd use a proper timezone library
    // such as date-fns-tz or moment-timezone
    console.log(`Using timezone: ${policy.timezone}`);
  }
  
  // Check day restrictions if specified
  if (policy.allowedDays && policy.allowedDays.length) {
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = daysOfWeek[requestTime.getDay()].toLowerCase();
    
    if (!policy.allowedDays.map(d => d.toLowerCase()).includes(currentDay)) {
      return {
        allowed: false,
        reason: `Access not allowed on ${currentDay}`,
        policyId: policy.id
      };
    }
  }
  
  // Check time restrictions if specified
  if (policy.allowedHoursStart && policy.allowedHoursEnd) {
    const [startHour, startMinute] = policy.allowedHoursStart.split(':').map(Number);
    const [endHour, endMinute] = policy.allowedHoursEnd.split(':').map(Number);
    
    const currentHour = requestTime.getHours();
    const currentMinute = requestTime.getMinutes();
    
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    
    if (currentTimeMinutes < startTimeMinutes || currentTimeMinutes > endTimeMinutes) {
      return {
        allowed: false,
        reason: `Access not allowed at this time (allowed between ${policy.allowedHoursStart} and ${policy.allowedHoursEnd})`,
        policyId: policy.id
      };
    }
  }
  
  return {
    allowed: true,
    reason: 'Time-based restrictions passed',
    policyId: policy.id
  };
};

/**
 * Evaluate a COUNT_BASED policy
 * Note: This is a simplified implementation. A real implementation would
 * need to track request counts in a database or cache.
 */
const evaluateCountBasedPolicy = (policy: Policy, request: PolicyRequest): PolicyResult => {
  if (!policy.maxRequests || !policy.timeWindowSeconds) {
    return {
      allowed: false,
      reason: 'Policy is missing maxRequests or timeWindowSeconds',
      policyId: policy.id
    };
  }
  
  // In a real implementation, we would:
  // 1. Get the credential or user ID to track
  // 2. Check the recent request count in Redis/DB
  // 3. Increment the counter if allowed
  // 4. Set expiry for the counter
  
  // Mock implementation for demo purposes
  const mockCurrentCount = Math.floor(Math.random() * (policy.maxRequests * 1.2));
  const allowed = mockCurrentCount < policy.maxRequests;
  
  return {
    allowed,
    reason: allowed 
      ? `Request count within limits (${mockCurrentCount}/${policy.maxRequests})` 
      : `Rate limit exceeded (${mockCurrentCount}/${policy.maxRequests} in ${policy.timeWindowSeconds} seconds)`,
    policyId: policy.id
  };
};

/**
 * Evaluate a MANUAL_APPROVAL policy
 * Note: This is a simplified implementation. A real implementation would
 * need to check approvals from a database.
 */
const evaluateManualApprovalPolicy = (policy: Policy, request: PolicyRequest): PolicyResult => {
  if (!policy.approvers || !policy.approvers.length) {
    return {
      allowed: false,
      reason: 'Policy is missing approvers',
      policyId: policy.id
    };
  }
  
  // In a real implementation, we would:
  // 1. Check if there's an existing approval request
  // 2. If not, create a new one and return not allowed
  // 3. If yes, check the status and update if necessary
  
  // Mock implementation for demo purposes
  const mockApproved = Math.random() > 0.5;
  
  return {
    allowed: mockApproved,
    reason: mockApproved 
      ? 'Request was manually approved' 
      : 'Waiting for manual approval',
    policyId: policy.id
  };
};

/**
 * Helper to match string values, including wildcards
 */
const matchValue = (actual: string, pattern: string): boolean => {
  // Handle wildcards (* for any characters)
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(actual);
  }
  
  return actual === pattern;
};

/**
 * Helper to get a nested value from an object using dot notation
 */
const getNestedValue = (obj: Record<string, any>, path: string): any => {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[key];
  }
  
  return current;
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