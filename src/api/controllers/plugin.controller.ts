import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { getPluginManager } from '../../plugins';
import { prisma } from '../../db/prisma';

/**
 * Get all available plugins
 * @param req Express request
 * @param res Express response
 */
export const getAllPlugins = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const pluginManager = getPluginManager();
    const plugins = pluginManager.getAllPlugins().map((plugin) => {
      // Create a safe representation of the plugin for the API
      return {
        id: plugin.getId(),
        name: plugin.getName(),
        description: plugin.getDescription(),
        version: plugin.getVersion(),
        type: plugin.getType(),
        enabled: pluginManager.isPluginEnabled(plugin.getType()),
        fields: plugin.getFields()
      };
    });
    
    res.status(200).json({
      success: true,
      plugins,
    });
  } catch (error: any) {
    logger.error(`Error getting plugins: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get plugins'
    });
  }
};

/**
 * Get a specific plugin by ID/type
 * @param req Express request
 * @param res Express response
 */
export const getPluginById = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const pluginManager = getPluginManager();
    const plugin = pluginManager.getPlugin(id);
    
    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: `Plugin with ID ${id} not found`,
      });
    }
    
    // Create a safe representation of the plugin for the API
    const safePlugin = {
      id: plugin.getId(),
      name: plugin.getName(),
      description: plugin.getDescription(),
      version: plugin.getVersion(),
      type: plugin.getType(),
      enabled: pluginManager.isPluginEnabled(plugin.getType()),
      fields: plugin.getFields()
    };
    
    res.status(200).json({
      success: true,
      plugin: safePlugin,
    });
  } catch (error: any) {
    logger.error(`Error getting plugin: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get plugin'
    });
  }
};

/**
 * Get all enabled plugins
 * @param req Express request
 * @param res Express response
 */
export const getEnabledPlugins = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const pluginManager = getPluginManager();
    const plugins = pluginManager.getEnabledPlugins().map((plugin) => {
      return {
        id: plugin.getId(),
        name: plugin.getName(),
        description: plugin.getDescription(),
        version: plugin.getVersion(),
        type: plugin.getType(),
        enabled: true,
        fields: plugin.getFields()
      };
    });
    
    res.status(200).json({
      success: true,
      plugins,
    });
  } catch (error: any) {
    logger.error(`Error getting enabled plugins: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get enabled plugins'
    });
  }
};

/**
 * Enable a plugin
 * @param req Express request
 * @param res Express response
 */
export const enablePlugin = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const pluginManager = getPluginManager();
    const plugin = pluginManager.getPlugin(id);
    
    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: `Plugin with ID ${id} not found`,
      });
    }
    
    const success = await pluginManager.enablePlugin(plugin.getType());
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: `Failed to enable plugin ${plugin.getName()}`,
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Plugin ${plugin.getName()} has been enabled`,
    });
  } catch (error: any) {
    logger.error(`Error enabling plugin: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to enable plugin'
    });
  }
};

/**
 * Disable a plugin
 * @param req Express request
 * @param res Express response
 */
export const disablePlugin = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const pluginManager = getPluginManager();
    const plugin = pluginManager.getPlugin(id);
    
    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: `Plugin with ID ${id} not found`,
      });
    }
    
    const success = await pluginManager.disablePlugin(plugin.getType());
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: `Failed to disable plugin ${plugin.getName()}`,
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Plugin ${plugin.getName()} has been disabled`,
    });
  } catch (error: any) {
    logger.error(`Error disabling plugin: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to disable plugin'
    });
  }
};

/**
 * Get plugin types
 * @param req Express request
 * @param res Express response
 */
export const getPluginTypes = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    const pluginManager = getPluginManager();
    const types = pluginManager.getAvailablePluginTypes();
    
    res.status(200).json({
      success: true,
      pluginTypes: types,
    });
  } catch (error: any) {
    logger.error(`Error getting plugin types: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get plugin types'
    });
  }
};

/**
 * Get mock plugins for development (when plugin manager is not available)
 * @param req Express request
 * @param res Express response
 */
export const getMockPlugins = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    // Use a simplified approach with mock data
    const pluginTypes = ['API_KEY', 'OAUTH', 'COOKIE', 'AWS'];
    
    // Return example plugins
    const plugins = pluginTypes.map((type, index) => {
      return {
        id: `plugin-${index + 1}`,
        name: `${type} Plugin`,
        description: `Plugin for handling ${type.toLowerCase().replace('_', ' ')} credentials`,
        version: '1.0.0',
        type: type,
        enabled: true,
        fields: [
          { name: 'key', label: 'API Key', type: 'string', required: true },
          { name: 'headerName', label: 'Header Name', type: 'string', default: 'Authorization' }
        ]
      };
    });
    
    res.status(200).json({
      success: true,
      plugins
    });
  } catch (error: any) {
    logger.error(`Error getting mock plugins: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get plugins'
    });
  }
}; 