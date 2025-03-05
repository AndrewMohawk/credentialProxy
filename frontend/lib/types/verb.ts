/**
 * Verb Registry Types
 * 
 * These types define the structure of verbs in the policy system.
 * Verbs represent actions that can be controlled by policies.
 */

/**
 * Verb Scope - The context in which a verb operates
 */
export enum VerbScope {
  GLOBAL = 'GLOBAL',
  PLUGIN = 'PLUGIN',
  CREDENTIAL = 'CREDENTIAL'
}

/**
 * Verb Parameter - Describes an input parameter for a verb
 */
export interface VerbParameter {
  name: string;          // Parameter name
  description: string;   // Description of the parameter
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'; // Parameter type
  required: boolean;     // Whether the parameter is required
  defaultValue?: any;    // Optional default value
  options?: any[];       // For enum-like parameters, the valid options
  validation?: {         // Optional validation rules
    min?: number;        // Minimum value (for numbers) or length (for strings)
    max?: number;        // Maximum value (for numbers) or length (for strings)
    pattern?: string;    // Regex pattern for validation
    [key: string]: any;  // Other validation rules
  };
}

/**
 * Verb - Represents an action that can be controlled by policies
 */
export interface Verb {
  id: string;            // Unique identifier for the verb
  name: string;          // Display name for the verb
  description: string;   // Description of what the verb does
  scope: VerbScope;      // The scope this verb applies to
  operation: string;     // The underlying operation identifier
  parameters?: VerbParameter[]; // Optional parameters for the verb
  pluginType?: string;   // For PLUGIN scope, the type of plugin
  credentialType?: string; // For CREDENTIAL scope, the type of credential
  tags?: string[];       // Optional tags for categorization/filtering
  examples?: string[];   // Example usage in natural language
  isDefault?: boolean;   // Whether this is a default system verb
}

/**
 * Verb Filter - Options for filtering verbs
 */
export interface VerbFilter {
  scope?: VerbScope;
  pluginType?: string;
  credentialType?: string;
  search?: string;
  tags?: string[];
}

/**
 * Verb Registry Response - API response for verb registry operations
 */
export interface VerbRegistryResponse {
  verbs: Verb[];
  total: number;
}

/**
 * Verb Group - Verbs grouped by category for UI display
 */
export interface VerbGroup {
  name: string;
  description?: string;
  verbs: Verb[];
}

/**
 * Verb Category - High-level categorization of verbs
 */
export enum VerbCategory {
  ACCESS = 'ACCESS',
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  ADMIN = 'ADMIN',
  OTHER = 'OTHER'
}

/**
 * Categorized Verbs - Verbs organized by category
 */
export interface CategorizedVerbs {
  [VerbCategory.ACCESS]: Verb[];
  [VerbCategory.READ]: Verb[];
  [VerbCategory.WRITE]: Verb[];
  [VerbCategory.DELETE]: Verb[];
  [VerbCategory.ADMIN]: Verb[];
  [VerbCategory.OTHER]: Verb[];
} 