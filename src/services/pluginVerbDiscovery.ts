/**
 * Plugin Verb Discovery Service
 * 
 * This service manages the discovery and registration of verbs specific to plugin types.
 * It enables plugins to register their own verbs and provides methods for discovering
 * verbs that are applicable to specific plugins.
 */

import { logger } from '../utils/logger';
import verbRegistryService, { Verb, VerbScope } from './verbRegistryService';
import { prisma } from '../db/prisma';
import { getPluginManager } from '../plugins/PluginManager';

/**
 * Common verbs for all plugins
 */
const getCommonPluginVerbs = (pluginType: string): Omit<Verb, 'scope' | 'pluginType'>[] => {
  return [
    {
      id: 'configure',
      name: 'configure',
      description: `Configure the ${pluginType} plugin`,
      operation: 'configure',
      isDefault: true,
      tags: ['plugin', 'admin'],
      examples: [`If any application wants to configure ${pluginType} plugin then block`]
    },
    {
      id: 'enable',
      name: 'enable',
      description: `Enable the ${pluginType} plugin`,
      operation: 'enable',
      isDefault: true,
      tags: ['plugin', 'admin'],
      examples: [`If any application wants to enable ${pluginType} plugin then allow`]
    },
    {
      id: 'disable',
      name: 'disable',
      description: `Disable the ${pluginType} plugin`,
      operation: 'disable',
      isDefault: true,
      tags: ['plugin', 'admin'],
      examples: [`If any application wants to disable ${pluginType} plugin then block`]
    }
  ];
};

/**
 * Initialize verb discovery for all plugins
 * @returns Promise that resolves when initialization is complete
 */
export const initPluginVerbDiscovery = async (): Promise<void> => {
  try {
    const pluginManager = getPluginManager();
    const plugins = pluginManager.getAllPlugins();
    
    logger.info(`Initializing verb discovery for ${plugins.length} plugins`);
    
    for (const plugin of plugins) {
      // Register common verbs for this plugin type
      const commonVerbs = getCommonPluginVerbs(plugin.getType());
      verbRegistryService.registerPluginVerbs(plugin.getType(), commonVerbs);
      
      // Custom verb registration is handled separately since not all plugins 
      // have the registerVerbs method
    }
    
    logger.info('Plugin verb discovery initialization complete');
  } catch (error) {
    logger.error(`Error initializing plugin verb discovery: ${error}`);
  }
};

/**
 * Discover verbs for a specific plugin
 * @param pluginId ID of the plugin
 * @returns Array of registered verbs
 */
export const discoverVerbsForPlugin = async (pluginId: string): Promise<Verb[]> => {
  try {
    // Get the plugin from the database
    const plugin = await prisma.plugin.findUnique({
      where: { id: pluginId }
    });

    if (!plugin) {
      logger.warn(`Cannot discover verbs for non-existent plugin: ${pluginId}`);
      return [];
    }

    const pluginManager = getPluginManager();
    const pluginInstance = pluginManager.getPlugin(plugin.id);
    
    if (!pluginInstance) {
      logger.warn(`Plugin instance not found for ID: ${plugin.id}`);
      return [];
    }
    
    // Register common verbs
    const commonVerbs = getCommonPluginVerbs(plugin.type);
    const registeredCommonVerbs = verbRegistryService.registerPluginVerbs(plugin.type, commonVerbs);
    
    // Custom verb registration would go here if supported
    // For now, we're just registering the common verbs
    
    return registeredCommonVerbs;
  } catch (error) {
    logger.error(`Error discovering verbs for plugin ${pluginId}: ${error}`);
    return [];
  }
};

/**
 * Get verbs for a specific plugin
 * @param pluginId ID of the plugin
 * @returns Array of verbs applicable to the plugin
 */
export const getVerbsForPlugin = async (pluginId: string): Promise<Verb[]> => {
  try {
    // Get the plugin from the database
    const plugin = await prisma.plugin.findUnique({
      where: { id: pluginId }
    });

    if (!plugin) {
      logger.warn(`Cannot get verbs for non-existent plugin: ${pluginId}`);
      return [];
    }

    // Get global verbs
    const globalVerbs = verbRegistryService.getVerbs({ scope: VerbScope.GLOBAL });
    
    // Get plugin-specific verbs
    const pluginVerbs = verbRegistryService.getVerbs({ 
      scope: VerbScope.PLUGIN,
      pluginType: plugin.type 
    });
    
    // Combine and return
    return [...globalVerbs, ...pluginVerbs];
  } catch (error) {
    logger.error(`Error getting verbs for plugin ${pluginId}: ${error}`);
    return [];
  }
};

export default {
  getCommonPluginVerbs,
  initPluginVerbDiscovery,
  discoverVerbsForPlugin,
  getVerbsForPlugin
}; 