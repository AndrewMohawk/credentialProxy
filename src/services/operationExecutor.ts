import { logger } from '../utils/logger';
import { getPluginManager } from '../plugins';
import { PrismaClient } from '@prisma/client';

// Type definition for Credential
type Credential = {
  id: string;
  type: string;
  data: any;
  [key: string]: any;
};

/**
 * Execute an operation using the provided credential data
 * @param credential The credential object
 * @param operation The operation to perform
 * @param decryptedData The decrypted credential data
 * @param parameters Additional parameters for the operation
 * @returns The result of the operation
 */
export const executeOperation = async (
  credential: Credential,
  operation: string,
  decryptedData: Record<string, any>,
  parameters: Record<string, any>
): Promise<any> => {
  const credentialType = credential.type;
  
  logger.info(`Executing ${operation} operation for credential type ${credentialType}`);
  
  try {
    // Map credential type to plugin ID
    // This is needed for backward compatibility with existing credentials
    const pluginId = mapCredentialTypeToPluginId(credentialType);
    
    // Get the plugin manager
    const pluginManager = getPluginManager();
    
    // Check if the plugin is enabled
    if (!pluginManager.isPluginEnabled(pluginId)) {
      throw new Error(`Plugin ${pluginId} is disabled or not available`);
    }
    
    // Execute the operation using the appropriate plugin
    return await pluginManager.executeOperation(
      pluginId,
      operation,
      decryptedData,
      parameters
    );
  } catch (error: any) {
    logger.error(`Error executing operation: ${error.message}`);
    throw new Error(`Failed to execute operation: ${error.message}`);
  }
};

/**
 * Map a credential type from the database to a plugin ID
 * This is needed for backward compatibility with existing credentials
 */
export function mapCredentialTypeToPluginId(credentialType: string): string {
  switch (credentialType) {
  case 'API_KEY':
    return 'api-key';
  case 'OAUTH':
    return 'oauth';
  case 'COOKIE':
    return 'cookie';
  case 'ETHEREUM_KEY':
    return 'ethereum';
  case 'DATABASE':
    return 'database';
  default: {
    // If the credential type matches a plugin ID directly, use it
    const pluginManager = getPluginManager();
    if (pluginManager.getPlugin(credentialType)) {
      return credentialType;
    }
    throw new Error(`Unsupported credential type: ${credentialType}`);
  }
  }
} 