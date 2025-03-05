/**
 * Verb Registry Service
 * 
 * This service manages the registration and discovery of "verbs" - actions that can be performed
 * in the context of policies. Verbs are categorized by scope (global, plugin, credential) and 
 * provide the building blocks for natural language policy creation.
 */

import { logger } from '../utils/logger';

/**
 * Verb Scope - The context in which a verb operates
 */
export enum VerbScope {
  GLOBAL = 'GLOBAL',
  PLUGIN = 'PLUGIN',
  CREDENTIAL = 'CREDENTIAL'
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

// In-memory cache of registered verbs
let verbRegistry: Verb[] = [];

/**
 * Initialize the verb registry with default verbs
 */
export const initVerbRegistry = async (): Promise<void> => {
  // Add default global verbs
  registerVerb({
    id: 'access_application',
    name: 'access application',
    description: 'Access an application',
    scope: VerbScope.GLOBAL,
    operation: 'access',
    isDefault: true,
    examples: ['If any application wants to access application then allow']
  });
  
  registerVerb({
    id: 'read_credential',
    name: 'read credential',
    description: 'Read credential values',
    scope: VerbScope.CREDENTIAL,
    operation: 'read',
    isDefault: true,
    examples: ['If any application wants to read credential then allow']
  });
  
  registerVerb({
    id: 'use_credential',
    name: 'use credential',
    description: 'Use a credential for authentication',
    scope: VerbScope.CREDENTIAL,
    operation: 'use',
    isDefault: true,
    examples: ['If any application wants to use credential then allow']
  });
  
  logger.info(`Initialized verb registry with ${verbRegistry.length} default verbs`);
  
  // In a real implementation, we would load verbs from a database
  // Example: await loadVerbsFromDatabase();
};

/**
 * Register a new verb
 * @param verb The verb to register
 * @returns The registered verb
 */
export const registerVerb = (verb: Verb): Verb => {
  // Check if verb already exists
  const existingIndex = verbRegistry.findIndex(v => v.id === verb.id);
  
  if (existingIndex >= 0) {
    // Update existing verb
    verbRegistry[existingIndex] = { ...verbRegistry[existingIndex], ...verb };
    logger.debug(`Updated existing verb: ${verb.id}`);
    return verbRegistry[existingIndex];
  }
  
  // Register new verb
  verbRegistry.push(verb);
  logger.debug(`Registered new verb: ${verb.id}`);
  return verb;
};

/**
 * Unregister a verb
 * @param verbId The ID of the verb to unregister
 * @returns True if the verb was unregistered, false otherwise
 */
export const unregisterVerb = (verbId: string): boolean => {
  const initialLength = verbRegistry.length;
  verbRegistry = verbRegistry.filter(v => v.id !== verbId);
  
  const removed = verbRegistry.length < initialLength;
  if (removed) {
    logger.debug(`Unregistered verb: ${verbId}`);
  }
  
  return removed;
};

/**
 * Get all registered verbs
 * @param filters Optional filters for the verbs
 * @returns Array of verbs matching the filters
 */
export const getVerbs = (filters?: {
  scope?: VerbScope;
  pluginType?: string;
  credentialType?: string;
  search?: string;
  tags?: string[];
}): Verb[] => {
  let result = [...verbRegistry];
  
  // Apply filters if provided
  if (filters) {
    if (filters.scope) {
      result = result.filter(v => v.scope === filters.scope);
    }
    
    if (filters.pluginType) {
      result = result.filter(v => 
        v.scope === VerbScope.PLUGIN && 
        v.pluginType === filters.pluginType
      );
    }
    
    if (filters.credentialType) {
      result = result.filter(v => 
        v.scope === VerbScope.CREDENTIAL && 
        v.credentialType === filters.credentialType
      );
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(v => 
        v.name.toLowerCase().includes(searchLower) || 
        v.description.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(v => 
        v.tags && v.tags.some(tag => filters.tags!.includes(tag))
      );
    }
  }
  
  return result;
};

/**
 * Get a verb by ID
 * @param verbId The ID of the verb to get
 * @returns The verb, or undefined if not found
 */
export const getVerbById = (verbId: string): Verb | undefined => {
  return verbRegistry.find(v => v.id === verbId);
};

/**
 * Register verbs from a plugin
 * @param pluginType The type of plugin
 * @param verbs The verbs to register
 * @returns The registered verbs
 */
export const registerPluginVerbs = (pluginType: string, verbs: Omit<Verb, 'scope' | 'pluginType'>[]): Verb[] => {
  return verbs.map(v => registerVerb({
    ...v,
    scope: VerbScope.PLUGIN,
    pluginType,
    id: `${pluginType}:${v.id}`
  }));
};

/**
 * Register verbs for a credential type
 * @param credentialType The type of credential
 * @param verbs The verbs to register
 * @returns The registered verbs
 */
export const registerCredentialVerbs = (credentialType: string, verbs: Omit<Verb, 'scope' | 'credentialType'>[]): Verb[] => {
  return verbs.map(v => registerVerb({
    ...v,
    scope: VerbScope.CREDENTIAL,
    credentialType,
    id: `${credentialType}:${v.id}`
  }));
};

/**
 * Maps a policy verb and parameters to the underlying operation
 * @param verbId The ID of the verb
 * @param parameters The parameters for the verb
 * @returns The operation and mapped parameters
 */
export const mapVerbToOperation = (
  verbId: string, 
  parameters: Record<string, any>
): { operation: string; parameters: Record<string, any> } | null => {
  const verb = getVerbById(verbId);
  
  if (!verb) {
    logger.warn(`Attempted to map unknown verb: ${verbId}`);
    return null;
  }
  
  // In a real implementation, this would map the natural language parameters
  // to the underlying operation parameters based on the verb's definition
  return {
    operation: verb.operation,
    parameters: { ...parameters }
  };
};

// Export the full API
export default {
  initVerbRegistry,
  registerVerb,
  unregisterVerb,
  getVerbs,
  getVerbById,
  registerPluginVerbs,
  registerCredentialVerbs,
  mapVerbToOperation
}; 