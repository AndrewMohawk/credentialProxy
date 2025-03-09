/**
 * Credential Verb Discovery Service
 * 
 * This service manages the discovery and registration of verbs specific to credential types.
 * It provides methods for both automatic discovery based on credential capabilities and
 * manual registration through the API.
 */

import { logger } from '../utils/logger';
import verbRegistryService, { Verb, VerbScope } from './verbRegistryService';
import { prisma } from '../db/prisma';
import { getPluginManager } from '../plugins/PluginManager';

/**
 * Get common credential type verbs
 * @param credentialType The credential type
 * @returns Array of verbs for the credential type
 */
export const getCommonVerbsForCredentialType = (credentialType: string): Omit<Verb, 'scope' | 'credentialType'>[] => {
  // Common verbs for all credential types
  const commonVerbs: Omit<Verb, 'scope' | 'credentialType'>[] = [
    {
      id: 'read',
      name: 'read',
      description: 'Read credential values',
      operation: 'read',
      isDefault: true,
      examples: [`If any application wants to read ${credentialType} credential then allow`]
    },
    {
      id: 'use',
      name: 'use',
      description: 'Use a credential for authentication',
      operation: 'use',
      isDefault: true,
      examples: [`If any application wants to use ${credentialType} credential then allow`]
    },
    {
      id: 'rotate',
      name: 'rotate',
      description: 'Rotate credential secrets',
      operation: 'rotate',
      isDefault: true,
      examples: [`If any application wants to rotate ${credentialType} credential then allow`]
    }
  ];

  // Add credential-type specific verbs
  switch (credentialType.toLowerCase()) {
    case 'aws':
      return [
        ...commonVerbs,
        {
          id: 'assume_role',
          name: 'assume role',
          description: 'Assume an AWS IAM role',
          operation: 'assume_role',
          parameters: [
            {
              name: 'roleArn',
              description: 'ARN of the role to assume',
              type: 'string',
              required: true
            },
            {
              name: 'sessionName',
              description: 'Name for the temporary session',
              type: 'string',
              required: false
            }
          ],
          tags: ['aws', 'iam'],
          examples: ['If any application wants to assume role with AWS credential then allow']
        },
        {
          id: 'get_session_token',
          name: 'get session token',
          description: 'Get temporary AWS session token',
          operation: 'get_session_token',
          parameters: [
            {
              name: 'durationSeconds',
              description: 'Duration of the session in seconds',
              type: 'number',
              required: false,
              validation: {
                min: 900,
                max: 129600
              }
            }
          ],
          tags: ['aws', 'iam'],
          examples: ['If any application wants to get session token with AWS credential then allow']
        }
      ];
    
    case 'database':
    case 'postgresql':
    case 'mysql':
      return [
        ...commonVerbs,
        {
          id: 'execute_query',
          name: 'execute query',
          description: 'Execute a database query',
          operation: 'execute_query',
          parameters: [
            {
              name: 'query',
              description: 'SQL query to execute',
              type: 'string',
              required: true
            }
          ],
          tags: ['database', 'sql'],
          examples: ['If any application wants to execute query with database credential then allow']
        }
      ];
    
    case 'api_key':
      return [
        ...commonVerbs,
        {
          id: 'make_request',
          name: 'make API request',
          description: 'Make a request to an API using the credential',
          operation: 'make_request',
          parameters: [
            {
              name: 'method',
              description: 'HTTP method to use',
              type: 'string',
              required: true,
              options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
            },
            {
              name: 'endpoint',
              description: 'API endpoint to call',
              type: 'string',
              required: true
            }
          ],
          tags: ['api', 'http'],
          examples: ['If any application wants to make API request with API key credential then allow']
        }
      ];
    
    case 'ethereum':
    case 'eth':
      return [
        ...commonVerbs,
        {
          id: 'sign_message',
          name: 'sign message',
          description: 'Sign a message with the Ethereum private key',
          operation: 'sign_message',
          parameters: [
            {
              name: 'message',
              description: 'Message to sign',
              type: 'string',
              required: true
            }
          ],
          tags: ['ethereum', 'crypto'],
          examples: ['If any application wants to sign message with Ethereum credential then allow']
        },
        {
          id: 'send_transaction',
          name: 'send transaction',
          description: 'Send an Ethereum transaction',
          operation: 'send_transaction',
          parameters: [
            {
              name: 'to',
              description: 'Recipient address',
              type: 'string',
              required: true
            },
            {
              name: 'value',
              description: 'Amount to send in wei',
              type: 'string',
              required: true
            }
          ],
          tags: ['ethereum', 'crypto', 'transaction'],
          examples: ['If any application wants to send transaction with Ethereum credential then allow']
        }
      ];
    
    case 'oauth':
    case 'oauth2':
      return [
        ...commonVerbs,
        {
          id: 'refresh_token',
          name: 'refresh token',
          description: 'Refresh the OAuth access token',
          operation: 'refresh_token',
          tags: ['oauth', 'auth'],
          examples: ['If any application wants to refresh token with OAuth credential then allow']
        },
        {
          id: 'make_authenticated_request',
          name: 'make authenticated request',
          description: 'Make an authenticated request using the OAuth token',
          operation: 'make_authenticated_request',
          parameters: [
            {
              name: 'method',
              description: 'HTTP method to use',
              type: 'string',
              required: true,
              options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
            },
            {
              name: 'url',
              description: 'URL to call',
              type: 'string',
              required: true
            }
          ],
          tags: ['oauth', 'api', 'http'],
          examples: ['If any application wants to make authenticated request with OAuth credential then allow']
        }
      ];
    
    default:
      return commonVerbs;
  }
};

/**
 * Extract verbs from credential plugin
 * This automatically generates verbs based on the credential plugin's supported operations
 */
export const extractVerbsFromCredentialPlugin = async (credentialType: string): Promise<Omit<Verb, 'scope' | 'credentialType'>[]> => {
  try {
    const pluginManager = getPluginManager();
    const credentialPlugin = pluginManager.getCredentialPlugin(credentialType);
    
    if (!credentialPlugin) {
      logger.warn(`No credential plugin found for type: ${credentialType}`);
      return [];
    }
    
    const verbs: Omit<Verb, 'scope' | 'credentialType'>[] = [];
    
    // Check if the plugin has supportedOperations
    if (credentialPlugin.supportedOperations && Array.isArray(credentialPlugin.supportedOperations)) {
      credentialPlugin.supportedOperations.forEach((operation: any) => {
        if (operation.name) {
          // Convert operation name to a verb (e.g., MAKE_REQUEST -> make request)
          const verbName = operation.name.toLowerCase().replace(/_/g, ' ');
          
          verbs.push({
            id: operation.name.toLowerCase(),
            name: verbName,
            description: operation.description || `${verbName} using ${credentialType} credential`,
            operation: operation.name,
            parameters: operation.requiredParams?.map((param: string) => ({
              name: param,
              description: `${param} parameter`,
              type: 'string',
              required: true
            })) || [],
            tags: ['credential', credentialType.toLowerCase()],
            examples: [`If any application wants to ${verbName} with ${credentialType} credential then allow`]
          });
        }
      });
    }
    
    return verbs;
  } catch (error) {
    logger.error(`Error extracting verbs from credential plugin ${credentialType}: ${error}`);
    return [];
  }
};

/**
 * Discover and register verbs for a credential
 * @param credentialId ID of the credential
 * @returns Array of registered verbs
 */
export const discoverVerbsForCredential = async (credentialId: string): Promise<Verb[]> => {
  try {
    // Get the credential from the database
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId }
    });

    if (!credential) {
      logger.warn(`Cannot discover verbs for non-existent credential: ${credentialId}`);
      return [];
    }

    // Get the credential type
    const credentialType = credential.type;
    
    // Get common verbs for this credential type
    const commonVerbs = getCommonVerbsForCredentialType(credentialType);
    
    // Extract verbs from credential plugin
    const extractedVerbs = await extractVerbsFromCredentialPlugin(credentialType);
    
    // Combine all verbs
    const allVerbs = [...commonVerbs, ...extractedVerbs];
    
    // Register the verbs for this credential type
    const registeredVerbs = verbRegistryService.registerCredentialVerbs(credentialType, allVerbs);
    
    logger.info(`Discovered and registered ${registeredVerbs.length} verbs for credential type ${credentialType}`);
    
    return registeredVerbs;
  } catch (error) {
    logger.error(`Error discovering verbs for credential ${credentialId}: ${error}`);
    return [];
  }
};

/**
 * Initialize verb discovery for all credentials
 * @returns Promise that resolves when initialization is complete
 */
export const initCredentialVerbDiscovery = async (): Promise<void> => {
  try {
    // Get all distinct credential types
    const credentials = await prisma.credential.findMany({
      select: { type: true },
      distinct: ['type']
    });
    
    const credentialTypes = credentials.map(c => c.type);
    
    logger.info(`Initializing verb discovery for ${credentialTypes.length} credential types`);
    
    // Register verbs for each credential type
    for (const credentialType of credentialTypes) {
      // Get common verbs for this credential type
      const commonVerbs = getCommonVerbsForCredentialType(credentialType);
      
      // Extract verbs from credential plugin
      const extractedVerbs = await extractVerbsFromCredentialPlugin(credentialType);
      
      // Combine and register all verbs
      const allVerbs = [...commonVerbs, ...extractedVerbs];
      verbRegistryService.registerCredentialVerbs(credentialType, allVerbs);
      
      logger.info(`Registered ${allVerbs.length} verbs for credential type ${credentialType}`);
    }
    
    logger.info('Credential verb discovery initialization complete');
  } catch (error) {
    logger.error(`Error initializing credential verb discovery: ${error}`);
  }
};

/**
 * Get verbs for a specific credential
 * @param credentialId ID of the credential
 * @returns Array of verbs applicable to the credential
 */
export const getVerbsForCredential = async (credentialId: string): Promise<Verb[]> => {
  try {
    // Get the credential from the database
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId }
    });

    if (!credential) {
      logger.warn(`Cannot get verbs for non-existent credential: ${credentialId}`);
      return [];
    }

    // Get global verbs
    const globalVerbs = verbRegistryService.getVerbs({ scope: VerbScope.GLOBAL });
    
    // Get credential-type specific verbs
    const credentialTypeVerbs = verbRegistryService.getVerbs({ 
      scope: VerbScope.CREDENTIAL,
      credentialType: credential.type
    });
    
    // Combine and return
    return [...globalVerbs, ...credentialTypeVerbs];
  } catch (error) {
    logger.error(`Error getting verbs for credential ${credentialId}: ${error}`);
    return [];
  }
};

export default {
  getCommonVerbsForCredentialType,
  extractVerbsFromCredentialPlugin,
  discoverVerbsForCredential,
  initCredentialVerbDiscovery,
  getVerbsForCredential
}; 