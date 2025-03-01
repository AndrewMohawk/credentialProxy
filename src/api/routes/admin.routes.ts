import express from 'express';
import { authMiddleware } from '../../middleware/auth';
import { getPluginManager } from '../../plugins';
import { logger } from '../../utils/logger';

// Define interfaces for plugin-related types
interface PluginOperation {
  id: string;
  name: string;
  description: string;
}

interface PluginPolicy {
  id: string;
  name: string;
  description: string;
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  supportedOperations: PluginOperation[];
  supportedPolicies: PluginPolicy[];
  credentialSchema?: any;
}

const router = express.Router();

// Require authentication for all admin routes
router.use(authMiddleware);

// Get all available credential plugins
router.get('/plugins', async (req, res) => {
  try {
    const pluginManager = getPluginManager();
    const plugins = pluginManager.getAllPlugins().map((plugin) => {
      // Create a safe representation of the plugin for the API
      return {
        id: plugin.id,
        name: plugin.name,
        description: plugin.description,
        version: plugin.version,
        operations: Array.isArray(plugin.supportedOperations) 
          ? plugin.supportedOperations.map((op: any) => ({
              id: typeof op.id === 'string' ? op.id : op.name,
              name: op.name,
              description: op.description || '',
            }))
          : [],
        policies: Array.isArray(plugin.supportedPolicies)
          ? plugin.supportedPolicies.map((policy: any) => ({
              id: typeof policy.id === 'string' ? policy.id : policy.name,
              name: policy.name || '',
              description: policy.description || '',
            }))
          : [],
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
      error: 'Failed to get plugins',
    });
  }
});

// Get a specific plugin by ID
router.get('/plugins/:id', async (req, res) => {
  try {
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
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      version: plugin.version,
      operations: Array.isArray(plugin.supportedOperations) 
        ? plugin.supportedOperations.map((op: any) => ({
            id: typeof op.id === 'string' ? op.id : op.name,
            name: op.name,
            description: op.description || '',
          }))
        : [],
      policies: Array.isArray(plugin.supportedPolicies)
        ? plugin.supportedPolicies.map((policy: any) => ({
            id: typeof policy.id === 'string' ? policy.id : policy.name,
            name: policy.name || '',
            description: policy.description || '',
            type: policy.type || '',
          }))
        : [],
      schema: plugin.credentialSchema,
    };
    
    res.status(200).json({
      success: true,
      plugin: safePlugin,
    });
  } catch (error: any) {
    logger.error(`Error getting plugin: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get plugin',
    });
  }
});

export const adminRoutes = router; 