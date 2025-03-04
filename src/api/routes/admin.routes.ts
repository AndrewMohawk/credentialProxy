import express from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { getPluginManager } from '../../plugins';
import { logger } from '../../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

interface PluginInfo {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: string;
  version: string;
}

interface PluginResponse {
  success: boolean;
  plugins: PluginInfo[];
}

const router = express.Router();

// Admin-only middleware
const adminOnly = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    // Check if user is authenticated and has admin role
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = req.user.id;
    
    // TODO: Implement admin role check when roles system is completed
    // For now, assume all authenticated users are admins
    
    next();
  } catch (err) {
    logger.error('Admin check error:', err);
    res.status(500).json({ error: 'Server error during admin check' });
  }
};

// Create a middleware wrapper for authenticateJWT
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  authenticateJWT(req, res, next);
};

// Apply authentication and admin middleware to all admin routes
router.use(authMiddleware);
router.use(adminOnly);

// Get all available credential plugins
router.get('/plugins', async (req, res) => {
  try {
    const pluginManager = getPluginManager();
    const plugins = pluginManager.getAllPlugins().map((plugin) => {
      // Create a safe representation of the plugin for the API
      return {
        id: plugin.getId(),
        name: plugin.getName(),
        description: plugin.getDescription(),
        version: plugin.getVersion(),
        type: plugin.getType(),
        enabled: pluginManager.isPluginEnabled(plugin.getType())
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
      id: plugin.getId(),
      name: plugin.getName(),
      description: plugin.getDescription(),
      version: plugin.getVersion(),
      type: plugin.getType(),
      enabled: pluginManager.isPluginEnabled(plugin.getType()),
      schema: plugin.getFields()
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

// Enable a plugin
router.post('/plugins/:id/enable', async (req, res) => {
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
    
    await pluginManager.enablePlugin(id);
    
    res.status(200).json({
      success: true,
      message: `Plugin ${plugin.getName()} has been enabled`,
    });
  } catch (error: any) {
    logger.error(`Error enabling plugin: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to enable plugin',
    });
  }
});

// Disable a plugin
router.post('/plugins/:id/disable', async (req, res) => {
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
    
    // Check if there are credentials using this plugin type
    const credentialCount = await prisma.credential.count({
      where: {
        type: id as any // Convert to enum type
      }
    });
    
    if (credentialCount > 0) {
      // We'll mark these credentials as inactive but not delete them
      logger.info(`Disabling plugin ${id} with ${credentialCount} associated credentials`);
    }
    
    await pluginManager.disablePlugin(id);
    
    res.status(200).json({
      success: true,
      message: `Plugin ${plugin.getName()} has been disabled`,
      affectedCredentials: credentialCount
    });
  } catch (error: any) {
    logger.error(`Error disabling plugin: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to disable plugin',
    });
  }
});

// Get all enabled plugins
router.get('/plugins/enabled', async (req, res) => {
  try {
    const pluginManager = getPluginManager();
    const plugins = pluginManager.getEnabledPlugins().map((plugin) => {
      return {
        id: plugin.getId(),
        name: plugin.getName(),
        description: plugin.getDescription(),
        version: plugin.getVersion(),
        enabled: true
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
      error: 'Failed to get enabled plugins',
    });
  }
});

// Create a public API endpoint for credentials
router.get('/credentials', authMiddleware, async (req, res) => {
  try {
    const credentials = await prisma.credential.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        isEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return res.json(credentials);
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return res.status(500).json({ error: 'Failed to fetch credentials' });
  }
});

// Modify the existing plugins endpoint to make it accessible via auth middleware
router.get('/plugins', authMiddleware, async (req, res) => {
  try {
    const pluginManager = getPluginManager();
    const plugins = pluginManager.getAllPlugins().map((plugin) => {
      // Create a safe representation of the plugin for the API
      return {
        id: plugin.getId(),
        name: plugin.getName(),
        description: plugin.getDescription(),
        version: plugin.getVersion(),
        type: plugin.getType(),
        enabled: pluginManager.isPluginEnabled(plugin.getType())
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

export const adminRoutes = router; 