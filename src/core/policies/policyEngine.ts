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
      
      // @ts-ignore - we're using raw query which might return different shapes
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
    let whereCondition: any = {
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
      
      const result = await evaluatePolicy(request as ProxyRequest, policy);
      
      // If this policy triggered, return its result
      if (result.status !== PolicyStatus.APPROVED) {
        // Add the policy id for reference (especially important for simulations)
        result.policyId = policy.id;
        return result;
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
 * Evaluates a single policy against a request
 * @param request The request to evaluate
 * @param policy The policy to evaluate against
 * @returns PolicyEvaluationResult indicating if the policy allows the request
 */
export const evaluatePolicy = async (
  request: ProxyRequest,
  policy: Policy
): Promise<PolicyEvaluationResult> => {
  try {
    const { operation, parameters } = request;
    
    // Evaluate based on policy type
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
          reason: 'Request requires manual approval',
          requiresApproval: true
        };
      
      default:
        logger.warn(`Unknown policy type: ${policy.type}`);
        // Default to allow if policy type is unknown
        return { status: PolicyStatus.APPROVED };
    }
  } catch (error) {
    logger.error(`Error evaluating policy: ${error}`);
    // Default to deny on error
    return {
      status: PolicyStatus.DENIED,
      reason: 'Error evaluating policy'
    };
  }
};

/**
 * Evaluates an allow list policy
 */
const evaluateAllowListPolicy = (
  request: ProxyRequest,
  policy: Policy
): PolicyEvaluationResult => {
  const { operation, parameters } = request;
  const config = policy.config || {};
  
  // Check if operation is in allowed operations
  if (config.operations && Array.isArray(config.operations)) {
    if (!config.operations.includes(operation)) {
      return {
        status: PolicyStatus.DENIED,
        reason: `Operation '${operation}' is not in the allowed operations list`
      };
    }
  }
  
  // Check parameter constraints if defined
  if (config.parameterConstraints && typeof config.parameterConstraints === 'object') {
    for (const [param, constraint] of Object.entries(config.parameterConstraints)) {
      // Skip if parameter is not in the request
      if (!(param in parameters)) continue;
      
      const paramValue = parameters[param];
      
      // Check constraint type
      if (Array.isArray(constraint)) {
        // Allowed values list
        if (!constraint.includes(paramValue)) {
          return {
            status: PolicyStatus.DENIED,
            reason: `Parameter '${param}' value '${paramValue}' is not in the allowed values list`
          };
        }
      } else if (constraint && typeof constraint === 'object') {
        // Type guard to ensure constraint is treated as ParameterConstraint
        const typedConstraint = constraint as ParameterConstraint;
        
        // Complex constraint (ranges, patterns, etc.)
        if (typedConstraint.min !== undefined && paramValue < typedConstraint.min) {
          return {
            status: PolicyStatus.DENIED,
            reason: `Parameter '${param}' value ${paramValue} is less than minimum ${typedConstraint.min}`
          };
        }
        
        if (typedConstraint.max !== undefined && paramValue > typedConstraint.max) {
          return {
            status: PolicyStatus.DENIED,
            reason: `Parameter '${param}' value ${paramValue} is greater than maximum ${typedConstraint.max}`
          };
        }
        
        if (typedConstraint.pattern && typeof paramValue === 'string') {
          const regex = new RegExp(typedConstraint.pattern);
          if (!regex.test(paramValue)) {
            return {
              status: PolicyStatus.DENIED,
              reason: `Parameter '${param}' value '${paramValue}' does not match required pattern`
            };
          }
        }
      }
    }
  }
  
  // All checks passed
  return { status: PolicyStatus.APPROVED };
};

/**
 * Evaluates a deny list policy
 */
const evaluateDenyListPolicy = (
  request: ProxyRequest,
  policy: Policy
): PolicyEvaluationResult => {
  const { operation, parameters } = request;
  const config = policy.config || {};
  
  // Check if operation is in denied operations
  if (config.operations && Array.isArray(config.operations)) {
    if (config.operations.includes(operation)) {
      return {
        status: PolicyStatus.DENIED,
        reason: `Operation '${operation}' is denied by policy`
      };
    }
  }
  
  // Check parameter blacklist if defined
  if (config.blockedParameters && typeof config.blockedParameters === 'object') {
    for (const [param, blockedValues] of Object.entries(config.blockedParameters)) {
      // Skip if parameter is not in the request
      if (!(param in parameters)) continue;
      
      const paramValue = parameters[param];
      
      // Check if the parameter value is blocked
      if (Array.isArray(blockedValues) && blockedValues.includes(paramValue)) {
        return {
          status: PolicyStatus.DENIED,
          reason: `Parameter '${param}' value '${paramValue}' is blocked by policy`
        };
      }
    }
  }
  
  // All checks passed
  return { status: PolicyStatus.APPROVED };
};

/**
 * Evaluates a time-based policy
 */
const evaluateTimeBasedPolicy = (
  request: ProxyRequest,
  policy: Policy
): PolicyEvaluationResult => {
  const config = policy.config || {};
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentDay = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  
  // Check allowed days
  if (config.allowedDays && Array.isArray(config.allowedDays)) {
    if (!config.allowedDays.includes(currentDay)) {
      return {
        status: PolicyStatus.DENIED,
        reason: `Access not allowed on this day of the week`
      };
    }
  }
  
  // Check allowed hours
  if (config.allowedHours) {
    const { start = 0, end = 24 } = config.allowedHours;
    
    if (currentHour < start || currentHour >= end) {
      return {
        status: PolicyStatus.DENIED,
        reason: `Access not allowed during this time (${currentHour}:00 UTC)`
      };
    }
  }
  
  // Check specific access windows
  if (config.accessWindows && Array.isArray(config.accessWindows)) {
    // Convert current time to timestamp for comparison
    const nowTimestamp = now.getTime();
    
    // Check if current time falls within any access window
    const isInWindow = config.accessWindows.some((window: any) => {
      const startTime = new Date(window.start).getTime();
      const endTime = new Date(window.end).getTime();
      
      return nowTimestamp >= startTime && nowTimestamp <= endTime;
    });
    
    if (!isInWindow) {
      return {
        status: PolicyStatus.DENIED,
        reason: `Access not allowed outside defined access windows`
      };
    }
  }
  
  // All checks passed
  return { status: PolicyStatus.APPROVED };
};

/**
 * Evaluates a count-based policy
 */
const evaluateCountBasedPolicy = async (
  request: ProxyRequest,
  policy: Policy
): Promise<PolicyEvaluationResult> => {
  const { applicationId, credentialId, operation } = request;
  const config = policy.config || {};
  
  // Get the time window in milliseconds (default: 1 hour)
  const timeWindowMs = (config.timeWindowMinutes || 60) * 60 * 1000;
  const maxCount = config.maxCount || 100;
  
  try {
    // Calculate the time threshold
    const timeThreshold = new Date(Date.now() - timeWindowMs);
    
    // Count requests in the time window using AuditEvent
    const requestCount = await prisma.auditEvent.count({
      where: {
        type: 'credential_access',
        applicationId,
        credentialId,
        details: config.countAllOperations ? undefined : {
          path: ['operation'],
          equals: operation
        },
        createdAt: {
          gte: timeThreshold
        }
      }
    });
    
    // Check if count exceeds the limit
    if (requestCount >= maxCount) {
      return {
        status: PolicyStatus.DENIED,
        reason: `Request limit exceeded (${requestCount}/${maxCount} in the last ${config.timeWindowMinutes} minutes)`
      };
    }
    
    // Within limits
    return { status: PolicyStatus.APPROVED };
  } catch (error) {
    logger.error(`Error evaluating count-based policy: ${error}`);
    
    // Default behavior on error (configurable)
    if (config.denyOnError) {
      return {
        status: PolicyStatus.DENIED,
        reason: 'Error evaluating request count limits'
      };
    }
    
    // Default to allow on error
    return { status: PolicyStatus.APPROVED };
  }
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