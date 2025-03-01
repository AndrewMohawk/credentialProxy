import { PluginManager } from './PluginManager';
import { CookiePlugin } from './CookiePlugin';
import { logger } from '../utils/logger';

// Create the plugin manager instance
const pluginManager = new PluginManager();

/**
 * Initialize all plugins
 */
export const initializePlugins = async (): Promise<void> => {
  try {
    // Register built-in plugins
    // Uncomment when ApiKeyPlugin is implemented
    // pluginManager.registerPlugin(new ApiKeyPlugin());
    pluginManager.registerPlugin(new CookiePlugin());
    
    logger.info(`Initialized ${pluginManager.getAllPlugins().length} plugins`);
  } catch (error: any) {
    logger.error(`Error initializing plugins: ${error.message}`);
    throw error;
  }
};

/**
 * Get the plugin manager instance
 */
export const getPluginManager = (): PluginManager => {
  return pluginManager;
};

// Re-export the plugin interfaces
export * from './CredentialPlugin'; 