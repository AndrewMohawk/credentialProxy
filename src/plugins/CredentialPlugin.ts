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
 * Complete policy configuration with safe defaults
 */
export interface PolicyBlueprint {
  /**
   * Unique identifier for the blueprint
   */
  id: string;
  
  /**
   * Human-readable name for the blueprint
   */
  name: string;
  
  /**
   * Detailed description of what the policy does
   */
  description: string;
  
  /**
   * The type of policy
   */
  type: PolicyType;
  
  /**
   * Complete configuration for the policy
   */
  configuration: Record<string, any>;
  
  /**
   * Schema for customizable fields in the configuration
   * Uses JSON Schema format
   */
  customizationSchema: Record<string, any>;
  
  /**
   * Level of security provided by this policy
   */
  securityLevel: 'basic' | 'standard' | 'high';
  
  /**
   * Numeric risk level (1-10)
   */
  riskLevel: number;
  
  /**
   * Human-readable explanations of what this policy does
   */
  explanation: string[];
  
  /**
   * Credential types this policy is recommended for
   */
  recommendedFor: string[];
  
  /**
   * Operations this policy is particularly effective for
   */
  targetOperations?: string[];
  
  /**
   * Other policy IDs this shouldn't be used with
   */
  incompatibleWith?: string[];
  
  /**
   * Metadata for UI display or categorization
   */
  metadata?: {
    category?: string;
    icon?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
    [key: string]: any;
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
 * Result of a risk assessment for an operation
 */
export interface OperationRiskAssessment {
  /**
   * Overall risk score (1-10)
   */
  score: number;
  
  /**
   * Explanation of factors affecting the risk score
   */
  factors: string[];
  
  /**
   * Recommended policies to mitigate risk
   */
  recommendations: PolicyBlueprint[];
  
  /**
   * Detailed breakdown of the risk assessment
   */
  details?: {
    credentialRisk: number;
    operationRisk: number;
    contextRisk: number;
    mitigations: Array<{
      type: string;
      impact: number;
      description: string;
    }>;
  };
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

  /**
   * Get policy blueprints - complete policy configurations with safe defaults
   * @returns Array of policy blueprints for this credential type
   */
  getPolicyBlueprints(): PolicyBlueprint[];
  
  /**
   * Get operations that can be performed with this credential type
   * Includes detailed metadata about each operation
   * @returns Map of operation name to operation metadata
   */
  getOperationsMap(): Map<string, OperationMetadata>;
  
  /**
   * Get risk assessment for specific credential configuration and operation
   * @param credentialData The credential data
   * @param operation The operation to assess
   * @returns Risk assessment with score and explanation
   */
  assessOperationRisk(
    credentialData: Record<string, any>,
    operation: string
  ): Promise<OperationRiskAssessment>;
} 