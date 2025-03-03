export * from './BaseCredentialPlugin';
export * from './PluginManager';
export * from './credentials/CookiePlugin';
export * from './credentials/ApiKeyPlugin';
export * from './credentials/OAuthPlugin';

import { PluginManager } from './PluginManager';
import { logger } from '../utils/logger';

// Get the plugin manager instance
const pluginManager = PluginManager.getInstance();

/**
 * Initialize all plugins
 */
export const initializePlugins = async (): Promise<void> => {
  try {
    // Plugins are already registered in the PluginManager constructor
    logger.info(`Initialized ${pluginManager.getAllPlugins().length} plugins`);
  } catch (error: any) {
    logger.error(`Error initializing plugins: ${error.message}`);
    throw error;
  }
};

// Export a function to get the plugin manager instance
export function getPluginManager(): PluginManager {
  return PluginManager.getInstance();
}

// Re-export the plugin interfaces
export * from './CredentialPlugin'; 