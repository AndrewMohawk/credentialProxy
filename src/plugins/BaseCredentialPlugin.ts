import { Request } from 'express';

/**
 * Abstract base class for credential plugins
 * Implements common functionality to make it easier to create new plugins
 */
export interface CredentialData {
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface CredentialPluginConfig {
  name: string;
  type: string;
  fields: CredentialField[];
}

export interface CredentialField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
  options?: string[];
}

export interface RequestModification {
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: Record<string, any>;
  cookies?: Record<string, string>;
}

export interface PluginMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  website?: string;
  repository?: string;
}

export abstract class BaseCredentialPlugin {
  abstract readonly config: CredentialPluginConfig;
  abstract readonly metadata: PluginMetadata;

  /**
   * Validate credential data before saving
   */
  abstract validateCredential(data: CredentialData): Promise<ValidationResult>;

  /**
   * Modify a request with the credential data
   */
  abstract modifyRequest(request: Request, data: CredentialData): Promise<RequestModification>;

  /**
   * Validate credential data structure
   * This is a simpler version of validateCredential that returns a boolean
   * @param data The credential data to validate
   * @returns True if the data is valid, false otherwise
   */
  validateCredentialData(data: CredentialData): boolean {
    // Default implementation checks if all required fields are present
    if (!data) return false;
    
    const requiredFields = this.getFields().filter(field => field.required);
    return requiredFields.every(field => 
      data[field.name] !== undefined && 
      data[field.name] !== null && 
      data[field.name] !== ''
    );
  }

  /**
   * Check if this plugin supports a specific operation
   * @param operation The operation to check
   * @returns True if the operation is supported, false otherwise
   */
  supportsOperation(operation: string): boolean {
    // Default implementation doesn't support any operations
    // Override this in subclasses to support specific operations
    return false;
  }

  /**
   * Execute an operation using this plugin
   * @param operation The operation to execute
   * @param data The credential data to use
   * @param parameters Additional parameters for the operation
   * @returns The result of the operation
   */
  async executeOperation(
    operation: string, 
    data: CredentialData, 
    parameters: Record<string, any>
  ): Promise<any> {
    // Default implementation throws an error
    // Override this in subclasses to support specific operations
    throw new Error(`Operation ${operation} not supported by plugin ${this.getId()}`);
  }

  /**
   * Get fields required for this credential type
   */
  getFields(): CredentialField[] {
    return this.config.fields;
  }

  /**
   * Get the credential type
   */
  getType(): string {
    return this.config.type;
  }

  /**
   * Get the plugin name
   */
  getName(): string {
    return this.metadata.name;
  }

  /**
   * Get plugin ID
   */
  getId(): string {
    return this.metadata.id;
  }

  /**
   * Get plugin description
   */
  getDescription(): string {
    return this.metadata.description;
  }

  /**
   * Get plugin version
   */
  getVersion(): string {
    return this.metadata.version;
  }
} 