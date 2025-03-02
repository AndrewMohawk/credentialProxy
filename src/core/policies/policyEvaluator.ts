import { Policy, PolicyEvaluationResult, PolicyStatus, PolicyType } from './policyTypes';
import { logger } from '../../utils/logger';
import { isInIPRange } from '../../utils/ipUtils';
import { getUsageMetrics } from '../../services/usageMetricsService';

/**
 * Proxy request interface
 */
export interface ProxyRequest {
  id: string;
  applicationId: string;
  credentialId: string;
  operation: string;
  parameters: Record<string, any>;
  ip?: string;
  timestamp: Date;
}

/**
 * Evaluates a request against the provided policies
 * @param request The request to evaluate
 * @param policies The policies to check against
 * @returns Evaluation result
 */
export async function evaluateRequest(
  request: ProxyRequest,
  policies: Policy[] = []
): Promise<PolicyEvaluationResult> {
  logger.info(`Evaluating request ${request.id} for application ${request.applicationId}`);
  
  if (policies.length === 0) {
    return {
      status: PolicyStatus.APPROVED,
      reason: 'No policies defined',
    };
  }
  
  // Sort policies by priority (higher priority first)
  const sortedPolicies = [...policies].sort((a, b) => b.priority - a.priority);
  
  // Check for manual approval policies first
  const manualApprovalPolicy = sortedPolicies.find(
    (p) => p.isActive && p.type === PolicyType.MANUAL_APPROVAL
  );
  
  if (manualApprovalPolicy) {
    return evaluateManualApprovalPolicy(request, manualApprovalPolicy);
  }
  
  // Check for approval chain policies
  const approvalChainPolicy = sortedPolicies.find(
    (p) => p.isActive && p.type === PolicyType.APPROVAL_CHAIN
  );
  
  if (approvalChainPolicy) {
    return evaluateApprovalChainPolicy(request, approvalChainPolicy);
  }
  
  // Evaluate each policy in order of priority
  for (const policy of sortedPolicies) {
    if (!policy.isActive) {
      continue;
    }
    
    const result = await evaluatePolicy(request, policy);
    
    // If the policy explicitly denies, return the result immediately
    if (result.status === PolicyStatus.DENIED) {
      return {
        status: PolicyStatus.DENIED,
        policyId: policy.id,
        reason: `Request denied by policy: ${policy.name} - ${result.reason || ''}`,
      };
    }
    
    // For approval-based policies, if pending, return immediately
    if (result.status === PolicyStatus.PENDING) {
      return result;
    }
  }
  
  // If we reach here, no policy denied the request, so it's approved
  return {
    status: PolicyStatus.APPROVED,
    reason: 'All policies passed',
  };
}

/**
 * Evaluates a single policy
 * @param request The request to evaluate
 * @param policy The policy to evaluate
 * @returns Evaluation result
 */
export async function evaluatePolicy(
  request: ProxyRequest,
  policy: Policy
): Promise<PolicyEvaluationResult> {
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
        return evaluateManualApprovalPolicy(request, policy);
      case PolicyType.PATTERN_MATCH:
        return evaluatePatternMatchPolicy(request, policy);
      case PolicyType.USAGE_THRESHOLD:
        return await evaluateUsageThresholdPolicy(request, policy);
      case PolicyType.IP_RESTRICTION:
        return evaluateIPRestrictionPolicy(request, policy);
      case PolicyType.RATE_LIMITING:
        return await evaluateRateLimitingPolicy(request, policy);
      case PolicyType.APPROVAL_CHAIN:
        return evaluateApprovalChainPolicy(request, policy);
      case PolicyType.CONTEXT_AWARE:
        return evaluateContextAwarePolicy(request, policy);
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
}

/**
 * Evaluates an allow list policy
 */
function evaluateAllowListPolicy(
  request: ProxyRequest,
  policy: Policy
): PolicyEvaluationResult {
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
}

/**
 * Evaluates a deny list policy
 */
function evaluateDenyListPolicy(
  request: ProxyRequest,
  policy: Policy
): PolicyEvaluationResult {
  const { operations = [], parameters = {} } = policy.config;
  
  // Check if the operation is in the deny list
  if (operations.includes(request.operation)) {
    return {
      status: PolicyStatus.DENIED,
      policyId: policy.id,
      reason: `Operation ${request.operation} is in the deny list`,
    };
  }
  
  // Check if any parameters match denied values
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
}

/**
 * Evaluates a time-based policy
 */
function evaluateTimeBasedPolicy(
  request: ProxyRequest,
  policy: Policy
): PolicyEvaluationResult {
  const {
    startTime,
    endTime,
    timeZone = 'UTC',
    recurringSchedule,
  } = policy.config;
  
  // Use the request's timestamp instead of creating a new Date
  const now = request.timestamp;
  
  // Check specific start/end times if defined
  if (startTime && endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // If current time is outside the window, deny
    if (now < start || now > end) {
      return {
        status: PolicyStatus.DENIED,
        policyId: policy.id,
        reason: 'Access not allowed outside the scheduled time window',
      };
    }
  } else if (startTime && new Date(startTime) > now) {
    return {
      status: PolicyStatus.DENIED,
      policyId: policy.id,
      reason: 'Access not allowed before the scheduled start time',
    };
  } else if (endTime && new Date(endTime) < now) {
    return {
      status: PolicyStatus.DENIED,
      policyId: policy.id,
      reason: 'Access not allowed after the scheduled end time',
    };
  }
  
  // Check recurring schedule if defined
  if (recurringSchedule) {
    const { daysOfWeek = [], hoursOfDay = [] } = recurringSchedule;
    
    // If both days and hours are specified, both must match
    let dayMatches = true;
    let hourMatches = true;
    
    if (daysOfWeek.length > 0) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayName = dayNames[now.getDay()].toLowerCase();
      
      // Convert all day names to lowercase for case-insensitive comparison
      const lowerDaysOfWeek = daysOfWeek.map((day: string) => day.toLowerCase());
      
      if (!lowerDaysOfWeek.includes(todayName)) {
        dayMatches = false;
      }
    }
    
    if (hoursOfDay.length > 0) {
      const currentHour = now.getHours();
      
      if (!hoursOfDay.includes(currentHour)) {
        hourMatches = false;
      }
    }
    
    // If either day or hour doesn't match (when specified), deny
    if (!dayMatches || !hourMatches) {
      return {
        status: PolicyStatus.DENIED,
        policyId: policy.id,
        reason: `Access not allowed at current time (day: ${dayMatches}, hour: ${hourMatches})`,
      };
    }
  }
  
  return {
    status: PolicyStatus.APPROVED,
    policyId: policy.id,
  };
}

/**
 * Evaluates a count-based policy
 */
async function evaluateCountBasedPolicy(
  request: ProxyRequest,
  policy: Policy
): Promise<PolicyEvaluationResult> {
  const { maxCount = 0, resetPeriod = 'never' } = policy.config;
  
  // Get current count from the policy (would need to be in the database)
  const currentCount = 0; // TODO: Get this from the database
  
  if (currentCount >= maxCount) {
    return {
      status: PolicyStatus.DENIED,
      policyId: policy.id,
      reason: `Maximum usage count (${maxCount}) reached`,
    };
  }
  
  // TODO: Increment the count in the database
  
  return {
    status: PolicyStatus.APPROVED,
    policyId: policy.id,
  };
}

/**
 * Evaluates a manual approval policy
 */
function evaluateManualApprovalPolicy(
  request: ProxyRequest,
  policy: Policy
): PolicyEvaluationResult {
  const { operations = [] } = policy.config;
  
  // If operations are specified, only require approval for those operations
  if (operations.length > 0 && !operations.includes(request.operation)) {
    return {
      status: PolicyStatus.APPROVED,
      policyId: policy.id,
    };
  }
  
  return {
    status: PolicyStatus.PENDING,
    policyId: policy.id,
    reason: 'Request requires manual approval',
    requiresApproval: true,
  };
}

/**
 * Evaluates a pattern match policy
 */
function evaluatePatternMatchPolicy(
  request: ProxyRequest,
  policy: Policy
): PolicyEvaluationResult {
  const { patterns = [] } = policy.config;
  
  for (const patternConfig of patterns) {
    const { parameterName, pattern, allow } = patternConfig;
    
    // Check if the parameter exists
    const paramValue = request.parameters[parameterName];
    if (paramValue === undefined) {
      continue;
    }
    
    // Convert to string if it's not already
    const stringValue = String(paramValue);
    
    // Test the pattern
    const regex = new RegExp(pattern);
    const matches = regex.test(stringValue);
    
    if (matches && !allow) {
      return {
        status: PolicyStatus.DENIED,
        policyId: policy.id,
        reason: `Parameter ${parameterName} matches denied pattern: ${pattern}`,
      };
    } else if (matches && allow) {
      // Continue checking other patterns, even if this one matched and is allowed
      continue;
    }
  }
  
  return {
    status: PolicyStatus.APPROVED,
    policyId: policy.id,
  };
}

/**
 * Evaluates a usage threshold policy
 */
async function evaluateUsageThresholdPolicy(
  request: ProxyRequest,
  policy: Policy
): Promise<PolicyEvaluationResult> {
  const { thresholdType, maxValue, timeWindow } = policy.config;
  
  try {
    // Get current usage metrics for the appropriate threshold type
    const usage = await getUsageMetrics(request.credentialId, thresholdType, timeWindow);
    
    if (usage >= maxValue) {
      return {
        status: PolicyStatus.DENIED,
        policyId: policy.id,
        reason: `Usage threshold of ${maxValue} for ${thresholdType} has been reached`,
      };
    }
    
    return {
      status: PolicyStatus.APPROVED,
      policyId: policy.id,
    };
  } catch (error) {
    logger.error(`Error evaluating usage threshold: ${error}`);
    // Default to deny if we can't determine the usage
    return {
      status: PolicyStatus.DENIED,
      policyId: policy.id,
      reason: `Unable to determine current usage: ${error}`,
    };
  }
}

/**
 * Evaluates an IP restriction policy
 */
function evaluateIPRestrictionPolicy(
  request: ProxyRequest,
  policy: Policy
): PolicyEvaluationResult {
  const { allowedIps = [], deniedIps = [], defaultAction = 'deny' } = policy.config;
  
  // If no IP provided in request, deny by default
  if (!request.ip) {
    return {
      status: PolicyStatus.DENIED,
      policyId: policy.id,
      reason: 'No IP address provided in request',
    };
  }
  
  // Check denied IPs first
  for (const ipRange of deniedIps) {
    if (isInIPRange(request.ip, ipRange)) {
      return {
        status: PolicyStatus.DENIED,
        policyId: policy.id,
        reason: `IP ${request.ip} is in denied range ${ipRange}`,
      };
    }
  }
  
  // If there are no allowed IPs specified, and the IP is not in the denied list, approve
  if (allowedIps.length === 0) {
    return {
      status: PolicyStatus.APPROVED,
      policyId: policy.id,
    };
  }
  
  // Then check allowed IPs
  for (const ipRange of allowedIps) {
    if (isInIPRange(request.ip, ipRange)) {
      return {
        status: PolicyStatus.APPROVED,
        policyId: policy.id,
      };
    }
  }
  
  // If IP is not in either list, use the default action
  if (defaultAction === 'allow') {
    return {
      status: PolicyStatus.APPROVED,
      policyId: policy.id,
    };
  } else {
    return {
      status: PolicyStatus.DENIED,
      policyId: policy.id,
      reason: `IP ${request.ip} is not in the allowed list`,
    };
  }
}

/**
 * Evaluates a rate limiting policy
 */
async function evaluateRateLimitingPolicy(
  request: ProxyRequest,
  policy: Policy
): Promise<PolicyEvaluationResult> {
  const { maxRequests = 100, timeWindow = '1h', operation = null } = policy.config;
  
  // If operation is specified, only apply rate limiting to that operation
  if (operation && operation !== request.operation) {
    return {
      status: PolicyStatus.APPROVED,
      policyId: policy.id,
    };
  }
  
  try {
    // Get the current request count
    const requestCount = await getUsageMetrics(
      request.credentialId,
      'request_count',
      timeWindow
    );
    
    // Check if the request count exceeds the maximum
    if (requestCount >= maxRequests) {
      return {
        status: PolicyStatus.DENIED,
        policyId: policy.id,
        reason: `Rate limit exceeded: ${requestCount}/${maxRequests} requests in ${timeWindow}`,
      };
    }
    
    return {
      status: PolicyStatus.APPROVED,
      policyId: policy.id,
    };
  } catch (error) {
    logger.error(`Error evaluating rate limit: ${error}`);
    // Default to approve if we can't determine the usage
    return {
      status: PolicyStatus.APPROVED,
      policyId: policy.id,
    };
  }
}

/**
 * Evaluates an approval chain policy
 */
function evaluateApprovalChainPolicy(
  request: ProxyRequest,
  policy: Policy
): PolicyEvaluationResult {
  // Default implementation: require approval
  return {
    status: PolicyStatus.PENDING,
    policyId: policy.id,
    reason: 'Request requires approval through approval chain',
    requiresApproval: true,
  };
}

/**
 * Evaluates a context-aware policy
 */
function evaluateContextAwarePolicy(
  request: ProxyRequest,
  policy: Policy
): PolicyEvaluationResult {
  const { conditions = [], defaultAction = 'deny' } = policy.config;
  
  for (const condition of conditions) {
    const { factor, operator, value, action } = condition;
    
    let conditionMet = false;
    
    switch (factor) {
      case 'time_of_day':
        // Example: Check if current hour matches
        const currentHour = new Date().getHours();
        conditionMet = evaluateCondition(currentHour, operator, value);
        break;
        
      case 'day_of_week':
        // Example: Check if current day matches
        const currentDay = new Date().getDay(); // 0-6, 0 is Sunday
        conditionMet = evaluateCondition(currentDay, operator, value);
        break;
        
      case 'request_frequency':
        // This would require tracking request frequency in the database
        conditionMet = false;
        break;
        
      case 'previous_usage':
        // This would require checking previous request history
        conditionMet = false;
        break;
        
      case 'location':
        // This would require GeoIP lookup of the request IP
        conditionMet = false;
        break;
        
      default:
        logger.warn(`Unknown context factor: ${factor}`);
        conditionMet = false;
    }
    
    if (conditionMet) {
      switch (action) {
        case 'allow':
          return {
            status: PolicyStatus.APPROVED,
            policyId: policy.id,
          };
          
        case 'deny':
          return {
            status: PolicyStatus.DENIED,
            policyId: policy.id,
            reason: `Context condition for ${factor} resulted in deny`,
          };
          
        case 'require_approval':
          return {
            status: PolicyStatus.PENDING,
            policyId: policy.id,
            reason: 'Context condition requires manual approval',
            requiresApproval: true,
          };
      }
    }
  }
  
  // No conditions matched, use default action
  switch (defaultAction) {
    case 'allow':
      return {
        status: PolicyStatus.APPROVED,
        policyId: policy.id,
      };
      
    case 'deny':
      return {
        status: PolicyStatus.DENIED,
        policyId: policy.id,
        reason: 'No context conditions matched, default action is deny',
      };
      
    case 'require_approval':
      return {
        status: PolicyStatus.PENDING,
        policyId: policy.id,
        reason: 'No context conditions matched, default action is manual approval',
        requiresApproval: true,
      };
      
    default:
      return {
        status: PolicyStatus.DENIED,
        policyId: policy.id,
        reason: `Unknown default action: ${defaultAction}`,
      };
  }
}

/**
 * Evaluate a condition based on operator
 */
function evaluateCondition(actual: any, operator: string, expected: any): boolean {
  switch (operator) {
    case 'equals':
      return actual === expected;
      
    case 'not_equals':
      return actual !== expected;
      
    case 'greater_than':
      return actual > expected;
      
    case 'less_than':
      return actual < expected;
      
    case 'contains':
      if (typeof actual === 'string' && typeof expected === 'string') {
        return actual.includes(expected);
      }
      return false;
      
    case 'not_contains':
      if (typeof actual === 'string' && typeof expected === 'string') {
        return !actual.includes(expected);
      }
      return true;
      
    default:
      logger.warn(`Unknown operator: ${operator}`);
      return false;
  }
} 