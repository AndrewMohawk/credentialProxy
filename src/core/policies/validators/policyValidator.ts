import Ajv, { ErrorObject } from 'ajv';
import { Policy, PolicyType } from '../policyEngine';
import { denyListSchema, DenyListPolicyConfig } from '../schemas/denyListSchema';
import { allowListSchema, AllowListPolicyConfig } from '../schemas/allowListSchema';
import { timeBasedSchema, TimeBasedPolicyConfig, validateTimeBasedPolicy } from '../schemas/timeBasedSchema';
import { countBasedSchema, CountBasedPolicyConfig } from '../schemas/countBasedSchema';
import { manualApprovalSchema, ManualApprovalPolicyConfig } from '../schemas/manualApprovalSchema';

// Initialize AJV instance
const ajv = new Ajv({ allErrors: true });
ajv.addFormat('email', /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
ajv.addFormat('uri', /^https?:\/\/.+/);
ajv.addFormat('date', /^\d{4}-\d{2}-\d{2}$/);

// Map policy types to their schemas
const policySchemas: Record<PolicyType, any> = {
  [PolicyType.DENY_LIST]: denyListSchema,
  [PolicyType.ALLOW_LIST]: allowListSchema,
  [PolicyType.TIME_BASED]: timeBasedSchema,
  [PolicyType.COUNT_BASED]: countBasedSchema,
  [PolicyType.MANUAL_APPROVAL]: manualApprovalSchema,
};

// Map policy types to additional custom validators
const customValidators: Partial<Record<PolicyType, (policy: any) => boolean>> = {
  [PolicyType.TIME_BASED]: validateTimeBasedPolicy,
};

/**
 * Validate a policy against its schema
 * @param policy The policy to validate
 * @returns An object containing validation result and any errors
 */
export function validatePolicy(policy: Policy): { 
  valid: boolean; 
  errors: Array<{path: string; message: string}>;
} {
  if (!policy || !policy.type) {
    return {
      valid: false,
      errors: [{ path: 'type', message: 'Policy type is required' }]
    };
  }

  const schema = policySchemas[policy.type as PolicyType];
  if (!schema) {
    return {
      valid: false,
      errors: [{ path: 'type', message: `Unknown policy type: ${policy.type}` }]
    };
  }

  // Validate against JSON schema
  const validate = ajv.compile(schema);
  const valid = validate(policy);
  
  // Format the errors
  const ajvErrors = validate.errors || [];
  const errors = ajvErrors.map((error: ErrorObject) => {
    // Extract path safely without relying on instancePath
    let path = '';
    
    // Try to get the path from params
    if (error.params) {
      if ('missingProperty' in error.params) {
        path = error.params.missingProperty as string;
      } else if ('additionalProperty' in error.params) {
        path = error.params.additionalProperty as string;
      }
    }
    
    // If no path found from params, try to use dataPath or other properties
    if (!path && error.dataPath) {
      path = error.dataPath.replace(/^\//, '');
    }
    
    return {
      path,
      message: error.message || 'Unknown error'
    };
  });

  // Apply custom validators if needed
  const customValidator = customValidators[policy.type as PolicyType];
  if (valid && customValidator) {
    const customValid = customValidator(policy);
    if (!customValid) {
      errors.push({
        path: '',
        message: `Policy does not pass custom validation for ${policy.type}`
      });
      return { valid: false, errors };
    }
  }

  return { valid: valid && errors.length === 0, errors };
}

/**
 * Get a template for a specific policy type with required fields
 * @param type The policy type
 * @returns A template policy with minimal required fields
 */
export function getPolicyTemplate(type: PolicyType): Partial<Policy> {
  const baseTemplate: Partial<Policy> = {
    name: '',
    description: '',
    type
  };

  switch (type) {
  case PolicyType.DENY_LIST:
    return {
      ...baseTemplate,
      ...(({
        deniedValues: [],
        targetField: ''
      } as unknown) as Partial<Policy>)
    };
  case PolicyType.ALLOW_LIST:
    return {
      ...baseTemplate,
      ...(({
        allowedValues: [],
        targetField: ''
      } as unknown) as Partial<Policy>)
    };
  case PolicyType.TIME_BASED:
    return {
      ...baseTemplate,
      ...(({
        allowedDays: [1, 2, 3, 4, 5],  // Mon-Fri
        allowedHoursStart: '09:00',
        allowedHoursEnd: '17:00'
      } as unknown) as Partial<Policy>)
    };
  case PolicyType.COUNT_BASED:
    return {
      ...baseTemplate,
      ...(({
        maxRequests: 100,
        timeWindowSeconds: 3600  // 1 hour
      } as unknown) as Partial<Policy>)
    };
  case PolicyType.MANUAL_APPROVAL:
    return {
      ...baseTemplate,
      ...(({
        approvers: []
      } as unknown) as Partial<Policy>)
    };
  default:
    return baseTemplate;
  }
}

/**
 * Get completion suggestions for a policy based on the schema
 * @param type The policy type
 * @param partialPath The current path being edited (e.g., "action", "allowedValues")
 * @returns Suggestions for field values or object keys
 */
export function getPolicySuggestions(
  type: PolicyType,
  partialPath?: string
): Array<{ label: string; description: string; value?: any }> {
  const schema = policySchemas[type];
  if (!schema) {
    return [];
  }

  // If no path provided, return top-level fields
  if (!partialPath) {
    const properties = schema.properties;
    return Object.keys(properties).map(key => ({
      label: key,
      description: properties[key].description || ''
    }));
  }

  // Navigate to the schema section for the given path
  const pathParts = partialPath.split('.');
  let currentSchema: any = schema;
  
  for (const part of pathParts) {
    if (currentSchema.properties && currentSchema.properties[part]) {
      currentSchema = currentSchema.properties[part];
    } else {
      return [];
    }
  }

  // Generate suggestions based on schema type
  if (currentSchema.enum) {
    return currentSchema.enum.map((value: any) => ({
      label: value,
      description: `Enum value: ${value}`,
      value
    }));
  }

  if (currentSchema.type === 'boolean') {
    return [
      { label: 'true', description: 'Boolean true value', value: true },
      { label: 'false', description: 'Boolean false value', value: false }
    ];
  }

  // For objects, return the properties
  if (currentSchema.properties) {
    return Object.keys(currentSchema.properties).map(key => ({
      label: key,
      description: currentSchema.properties[key].description || ''
    }));
  }

  return [];
}

/**
 * Get all valid field paths for a policy type
 * @param type The policy type
 * @returns Array of possible field paths
 */
export function getPolicyFieldPaths(type: PolicyType): string[] {
  const schema = policySchemas[type];
  if (!schema) {
    return [];
  }

  const paths: string[] = [];
  const properties = schema.properties;

  // Generate paths from properties
  Object.keys(properties).forEach(key => {
    paths.push(key);
    
    // If it's an object with properties, add nested paths
    if (properties[key].type === 'object' && properties[key].properties) {
      Object.keys(properties[key].properties).forEach(nestedKey => {
        paths.push(`${key}.${nestedKey}`);
      });
    }
  });

  return paths;
} 