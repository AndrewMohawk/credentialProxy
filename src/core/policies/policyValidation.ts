import Ajv from 'ajv';
import type { ErrorObject } from 'ajv';
import { Policy, PolicyType } from './policyEngine';
import { 
  allowListSchema, 
  denyListSchema, 
  timeBasedSchema, 
  countBasedSchema, 
  manualApprovalSchema,
  JSONSchema
} from './policySchemas';

// Initialize Ajv instance
const ajv = new Ajv({ allErrors: true });

// Type for validation result
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Validate a policy against its appropriate schema based on policy type
 * @param policy Policy to validate
 * @returns Validation result with errors if any
 */
export const validatePolicy = async (policy: Policy): Promise<ValidationResult> => {
  // Basic validation - policy must have a type
  if (!policy.type) {
    return {
      valid: false,
      errors: [{ path: 'type', message: 'Policy type is required' }]
    };
  }

  // Basic policy attributes
  const basicAttributes = policy.name && policy.description;
  if (!basicAttributes) {
    return {
      valid: false,
      errors: [{ path: '', message: 'Policy must have a name and description' }]
    };
  }
  
  // Get the appropriate schema based on policy type
  let schema: JSONSchema;
  
  switch (policy.type) {
  case PolicyType.ALLOW_LIST:
    schema = allowListSchema;
    break;
  case PolicyType.DENY_LIST:
    schema = denyListSchema;
    break;
  case PolicyType.TIME_BASED:
    schema = timeBasedSchema;
    break;
  case PolicyType.COUNT_BASED:
    schema = countBasedSchema;
    break;
  case PolicyType.MANUAL_APPROVAL:
    schema = manualApprovalSchema;
    break;
  default:
    return {
      valid: false,
      errors: [{ path: 'type', message: `Unsupported policy type: ${policy.type}` }]
    };
  }
  
  // Compile and validate against schema
  const validate = ajv.compile(schema);
  const valid = validate(policy);
  
  if (!valid) {
    const errors = validate.errors?.map(err => {
      // Extract path safely without relying on instancePath
      let path = '';
      
      // Try to get the path from params
      if (err.params) {
        if ('missingProperty' in err.params) {
          path = err.params.missingProperty as string;
        } else if ('additionalProperty' in err.params) {
          path = err.params.additionalProperty as string;
        }
      }
      
      // If no path found from params, try to use dataPath or other properties
      if (!path && (err as any).dataPath) {
        path = (err as any).dataPath.replace(/^\//, '');
      }
      
      return {
        path,
        message: err.message || 'Validation error'
      };
    }) || [];
    
    return {
      valid: false,
      errors
    };
  }
  
  return { valid: true, errors: [] };
};

/**
 * Get a policy template for a given policy type
 * @param type Policy type to get template for
 * @returns A template policy
 */
export const getPolicyTemplate = (type: PolicyType): Policy => {
  const baseTemplate: Partial<Policy> = {
    name: `New ${type} Policy`,
    description: `A policy that uses ${type} validation`,
    type: type,
    isActive: true
  };
  
  switch (type) {
  case PolicyType.ALLOW_LIST:
    return {
      ...baseTemplate,
      targetField: 'path',
      allowedValues: ['/example'],
    } as Policy;
      
  case PolicyType.DENY_LIST:
    return {
      ...baseTemplate,
      targetField: 'ip',
      deniedValues: ['192.168.1.1'],
    } as Policy;
      
  case PolicyType.TIME_BASED:
    return {
      ...baseTemplate,
      allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      allowedHoursStart: '09:00',
      allowedHoursEnd: '17:00',
      timezone: 'UTC',
    } as Policy;
      
  case PolicyType.COUNT_BASED:
    return {
      ...baseTemplate,
      maxRequests: 100,
      timeWindowSeconds: 3600, // 1 hour
    } as Policy;
      
  case PolicyType.MANUAL_APPROVAL:
    return {
      ...baseTemplate,
      approvers: ['admin@example.com'],
      expirationMinutes: 60, // 1 hour
    } as Policy;
      
  default:
    throw new Error(`Unsupported policy type: ${type}`);
  }
}; 