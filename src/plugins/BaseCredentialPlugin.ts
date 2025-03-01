import { CredentialPlugin, OperationMetadata, PolicyConfig, RiskAssessment } from './CredentialPlugin';
import { logger } from '../utils/logger';

/**
 * Abstract base class for credential plugins
 * Implements common functionality to make it easier to create new plugins
 */
export abstract class BaseCredentialPlugin implements CredentialPlugin {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract version: string;
  abstract credentialSchema: Record<string, any>;
  abstract supportedOperations: OperationMetadata[];
  abstract supportedPolicies: PolicyConfig[];
  abstract riskAssessment: RiskAssessment;
  
  /**
   * Get an operation by name
   */
  protected getOperation(name: string): OperationMetadata | undefined {
    return this.supportedOperations.find(op => op.name === name);
  }
  
  /**
   * Check if the plugin supports a specific operation
   */
  public supportsOperation(operation: string): boolean {
    return this.supportedOperations.some(op => op.name === operation);
  }
  
  /**
   * Validate that an operation has all required parameters
   */
  protected validateOperationParameters(
    operation: string,
    parameters: Record<string, any>
  ): string | null {
    const opMetadata = this.getOperation(operation);
    
    if (!opMetadata) {
      return `Operation ${operation} is not supported by this plugin`;
    }
    
    // Check if all required parameters are present
    for (const param of opMetadata.requiredParams) {
      if (parameters[param] === undefined) {
        return `Missing required parameter: ${param}`;
      }
    }
    
    return null;
  }
  
  /**
   * Validate credential data against the schema
   * Default implementation performs basic validation based on required fields
   * Plugins should override this method if they need more complex validation
   */
  public async validateCredential(credentialData: Record<string, any>): Promise<string | null> {
    try {
      // Simple validation based on required fields in schema
      for (const [key, config] of Object.entries(this.credentialSchema)) {
        if (config.required && credentialData[key] === undefined) {
          return `Missing required field: ${key}`;
        }
      }
      
      return null;
    } catch (error: any) {
      logger.error(`Error validating credential: ${error.message}`);
      return `Validation error: ${error.message}`;
    }
  }
  
  /**
   * Execute an operation using this plugin
   * This is the main method that needs to be implemented by concrete plugins
   */
  public abstract executeOperation(
    operation: string,
    credentialData: Record<string, any>,
    parameters: Record<string, any>
  ): Promise<any>;
  
  /**
   * Basic implementation of credential health check
   * Plugins should override this for more specific health checks
   */
  public async checkCredentialHealth(
    credentialData: Record<string, any>
  ): Promise<{
    isValid: boolean;
    expiresAt?: Date;
    issues: string[];
    recommendations: string[];
    lastChecked: Date;
  }> {
    try {
      // Perform basic validation
      const validationResult = await this.validateCredential(credentialData);
      
      return {
        isValid: !validationResult, 
        issues: validationResult ? [validationResult] : [],
        recommendations: validationResult ? ['Update the credential with valid information'] : [],
        lastChecked: new Date()
      };
    } catch (error: any) {
      logger.error(`Error checking credential health: ${error.message}`);
      return {
        isValid: false,
        issues: [`Error checking credential health: ${error.message}`],
        recommendations: ['Try again later or contact support'],
        lastChecked: new Date()
      };
    }
  }
  
  /**
   * Initialize the plugin
   * Default implementation does nothing
   * Plugins can override this for any initialization logic
   */
  public async initialize(): Promise<void> {
    // Default implementation does nothing
    logger.debug(`Initializing plugin: ${this.name}`);
  }
} 