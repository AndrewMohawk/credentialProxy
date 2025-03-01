import { PolicyType } from '../core/policies/policyEngine';

/**
 * Interface for policy configuration
 */
export interface PolicyConfig {
  type: PolicyType;
  description: string;
  defaultConfig?: Record<string, any>;
}

/**
 * Interface for operation metadata
 */
export interface OperationMetadata {
  name: string;
  description: string;
  requiredParams: string[];
  optionalParams?: string[];
  returns?: string;
  /**
   * Risk level associated with this operation (1-10)
   * 1 = Minimal risk (e.g., reading public information)
   * 10 = Maximum risk (e.g., transferring funds)
   */
  riskLevel: number;
  /**
   * Policy types that can be effectively applied to this operation
   */
  applicablePolicies: PolicyType[];
  /**
   * Default recommended policies for this operation
   */
  recommendedPolicies?: PolicyType[];
  /**
   * Suggested rate limits for the operation
   */
  suggestedRateLimits?: {
    perMinute?: number;
    perHour?: number;
    perDay?: number;
  };
}

/**
 * Risk assessment information for a credential type
 */
export interface RiskAssessment {
  /**
   * Base risk score for this credential type (1-10)
   */
  baseScore: number;
  /**
   * Context factors that affect risk assessment
   */
  contextualFactors?: {
    networkRestrictions?: boolean;
    timeRestrictions?: boolean;
    dataAccess?: 'read' | 'write' | 'admin';
  };
  /**
   * Calculate risk score for a specific operation in a given context
   */
  calculateRiskForOperation: (operation: string, context?: any) => number;
}

/**
 * Information about how to acquire this type of credential
 */
export interface CredentialAcquisitionInfo {
  /**
   * Type of credential acquisition flow
   */
  type: 'oauth' | 'manual' | 'generated' | 'custom';
  /**
   * Configuration for OAuth flows
   */
  oauthConfig?: {
    authorizationUrl: string;
    tokenUrl: string;
    scopes: string[];
    redirectUri: string;
  };
  /**
   * For manual entry credentials
   */
  manualFields?: Record<string, any>;
  /**
   * For generated credentials (like keypairs)
   */
  generationOptions?: Record<string, any>;
  /**
   * Instructions for the user on how to acquire credentials
   */
  instructions?: string;
}

/**
 * Policy templates recommended for this credential type
 */
export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  policyType: PolicyType;
  configuration: Record<string, any>;
  riskLevel: number;
  recommendedFor: string[]; // Operation names
}

/**
 * Interface that all credential plugins must implement
 */
export interface CredentialPlugin {
  /**
   * Unique identifier for the plugin
   */
  id: string;
  
  /**
   * Human-readable name for the plugin
   */
  name: string;
  
  /**
   * Description of the plugin
   */
  description: string;
  
  /**
   * Version of the plugin
   */
  version: string;
  
  /**
   * Schema for credential data validation
   */
  credentialSchema: Record<string, any>;
  
  /**
   * List of operations supported by this plugin
   */
  supportedOperations: OperationMetadata[];
  
  /**
   * List of policy types that can be applied to this credential type
   */
  supportedPolicies: PolicyConfig[];
  
  /**
   * Risk assessment information for this credential type
   */
  riskAssessment: RiskAssessment;
  
  /**
   * Information about how to acquire this type of credential
   */
  acquisitionInfo?: CredentialAcquisitionInfo;
  
  /**
   * Recommended policy templates for this credential type
   */
  policyTemplates?: PolicyTemplate[];
  
  /**
   * Method to validate credential data
   * @param credentialData The credential data to validate
   * @returns null if valid, or error message if invalid
   */
  validateCredential: (credentialData: Record<string, any>) => Promise<string | null>;
  
  /**
   * Method to execute an operation
   * @param operation Name of the operation to perform
   * @param credentialData The decrypted credential data
   * @param parameters Additional parameters for the operation
   * @returns Result of the operation
   */
  executeOperation: (
    operation: string,
    credentialData: Record<string, any>,
    parameters: Record<string, any>
  ) => Promise<any>;
  
  /**
   * Check the health of a credential (e.g., if it's expired, revoked, etc.)
   * @param credentialData The decrypted credential data
   * @returns Health information about the credential
   */
  checkCredentialHealth?: (
    credentialData: Record<string, any>
  ) => Promise<{
    isValid: boolean;
    expiresAt?: Date;
    issues: string[];
    recommendations: string[];
    lastChecked: Date;
  }>;
  
  /**
   * Initialize the plugin with any necessary setup
   */
  initialize?: () => Promise<void>;
} 