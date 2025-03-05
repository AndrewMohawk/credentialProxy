import { Request, Response } from 'express';
import { PluginManager } from '../../plugins/PluginManager';
import { logger } from '../../utils/logger';
import { PolicyBlueprint, OperationRiskAssessment } from '../../plugins/CredentialPlugin';
import { prisma } from '../../db/prisma';

/**
 * Controller for policy blueprint endpoints
 */
export class PolicyBlueprintController {
  private pluginManager: PluginManager;

  constructor(pluginManager: PluginManager) {
    this.pluginManager = pluginManager;
  }

  /**
   * Get all policy blueprints from all plugins
   */
  getAllBlueprints = async (req: Request, res: Response): Promise<void> => {
    try {
      const blueprints: PolicyBlueprint[] = [];
      
      // Get all plugins
      const plugins = this.pluginManager.getAllPlugins();
      
      // Collect blueprints from each plugin
      for (const plugin of plugins) {
        try {
          const pluginBlueprints = plugin.getPolicyBlueprints();
          blueprints.push(...pluginBlueprints);
        } catch (error) {
          logger.error(`Error getting blueprints from plugin ${plugin.getId()}:`, error);
          // Continue with other plugins
        }
      }
      
      res.status(200).json({
        success: true,
        data: blueprints,
        count: blueprints.length
      });
    } catch (error) {
      logger.error('Error getting all policy blueprints:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving policy blueprints',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  /**
   * Get all policy blueprints for a specific plugin type
   */
  getBlueprintsByPluginType = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pluginType } = req.params;
      
      // Get the plugin
      const plugin = this.pluginManager.getPlugin(pluginType);
      
      if (!plugin) {
        res.status(404).json({
          success: false,
          message: `Plugin type '${pluginType}' not found`
        });
        return;
      }
      
      // Get blueprints from the plugin
      const blueprints = plugin.getPolicyBlueprints();
      
      res.status(200).json({
        success: true,
        data: blueprints,
        count: blueprints.length
      });
    } catch (error) {
      logger.error(`Error getting policy blueprints for plugin type ${req.params.pluginType}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving policy blueprints',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  /**
   * Get a specific policy blueprint by ID and plugin type
   */
  getBlueprintById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pluginType, blueprintId } = req.params;
      
      // Get the plugin
      const plugin = this.pluginManager.getPlugin(pluginType);
      
      if (!plugin) {
        res.status(404).json({
          success: false,
          message: `Plugin type '${pluginType}' not found`
        });
        return;
      }
      
      // Get blueprints from the plugin
      const blueprints = plugin.getPolicyBlueprints();
      
      // Find the specific blueprint
      const blueprint = blueprints.find(bp => bp.id === blueprintId);
      
      if (!blueprint) {
        res.status(404).json({
          success: false,
          message: `Blueprint with ID '${blueprintId}' not found for plugin type '${pluginType}'`
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: blueprint
      });
    } catch (error) {
      logger.error(`Error getting policy blueprint ${req.params.blueprintId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving policy blueprint',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  /**
   * Get operations for a specific plugin
   */
  getPluginOperations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pluginId } = req.params;
      
      // Get the plugin
      const plugin = this.pluginManager.getPlugin(pluginId);
      
      if (!plugin) {
        res.status(404).json({
          success: false,
          message: `Plugin with ID '${pluginId}' not found`
        });
        return;
      }
      
      // Get operations map from the plugin
      const operationsMap = plugin.getOperationsMap();
      
      // Convert map to array
      const operations = Array.from(operationsMap.values());
      
      res.status(200).json({
        success: true,
        data: operations,
        count: operations.length
      });
    } catch (error) {
      logger.error(`Error getting operations for plugin ${req.params.pluginId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving plugin operations',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  /**
   * Get operations for a specific credential
   */
  getCredentialOperations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { credentialId } = req.params;
      
      // Get the credential
      const credential = await prisma.credential.findUnique({
        where: { id: credentialId }
      });
      
      if (!credential) {
        res.status(404).json({
          success: false,
          message: `Credential with ID '${credentialId}' not found`
        });
        return;
      }
      
      // Get the plugin for this credential type
      const plugin = this.pluginManager.getPlugin(credential.type.toLowerCase());
      
      if (!plugin) {
        res.status(404).json({
          success: false,
          message: `Plugin for credential type '${credential.type}' not found`
        });
        return;
      }
      
      // Get operations map from the plugin
      const operationsMap = plugin.getOperationsMap();
      
      // Convert map to array
      const operations = Array.from(operationsMap.values());
      
      res.status(200).json({
        success: true,
        data: operations,
        count: operations.length,
        credentialType: credential.type
      });
    } catch (error) {
      logger.error(`Error getting operations for credential ${req.params.credentialId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving credential operations',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  /**
   * Assess risk for a specific operation on a credential
   */
  assessOperationRisk = async (req: Request, res: Response): Promise<void> => {
    try {
      const { credentialId } = req.params;
      const { operation } = req.body;
      
      if (!operation) {
        res.status(400).json({
          success: false,
          message: 'Operation name is required'
        });
        return;
      }
      
      // Get the credential
      const credential = await prisma.credential.findUnique({
        where: { id: credentialId }
      });
      
      if (!credential) {
        res.status(404).json({
          success: false,
          message: `Credential with ID '${credentialId}' not found`
        });
        return;
      }
      
      // Get the plugin for this credential type
      const plugin = this.pluginManager.getPlugin(credential.type.toLowerCase());
      
      if (!plugin) {
        res.status(404).json({
          success: false,
          message: `Plugin for credential type '${credential.type}' not found`
        });
        return;
      }
      
      // Get credential data
      // Note: In a real implementation, you would decrypt the credential data and get the actual data
      // For now, we'll pass an empty object
      const credentialData: Record<string, any> = {};
      
      // Assess operation risk
      const riskAssessment = await plugin.assessOperationRisk(credentialData, operation);
      
      res.status(200).json({
        success: true,
        data: riskAssessment
      });
    } catch (error) {
      logger.error(`Error assessing risk for operation on credential ${req.params.credentialId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error assessing operation risk',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  /**
   * Get recommended policies for a credential
   */
  getRecommendedPolicies = async (req: Request, res: Response): Promise<void> => {
    try {
      const { credentialId } = req.params;
      
      // Get the credential
      const credential = await prisma.credential.findUnique({
        where: { id: credentialId }
      });
      
      if (!credential) {
        res.status(404).json({
          success: false,
          message: `Credential with ID '${credentialId}' not found`
        });
        return;
      }
      
      // Get the plugin for this credential type
      const plugin = this.pluginManager.getPlugin(credential.type.toLowerCase());
      
      if (!plugin) {
        res.status(404).json({
          success: false,
          message: `Plugin for credential type '${credential.type}' not found`
        });
        return;
      }
      
      // Get all blueprints from the plugin
      const blueprints = plugin.getPolicyBlueprints();
      
      // Filter for recommended blueprints (those with high security level)
      const recommendedBlueprints = blueprints.filter(blueprint => 
        blueprint.securityLevel === 'high' || 
        blueprint.riskLevel >= 7
      );
      
      res.status(200).json({
        success: true,
        data: recommendedBlueprints,
        count: recommendedBlueprints.length,
        credentialType: credential.type
      });
    } catch (error) {
      logger.error(`Error getting recommended policies for credential ${req.params.credentialId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving recommended policies',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
} 