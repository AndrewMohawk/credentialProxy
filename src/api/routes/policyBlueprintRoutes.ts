import express from 'express';
import { PolicyBlueprintController } from '../controllers/policyBlueprintController';
import { PluginManager } from '../../plugins/PluginManager';
import { authenticateJWT } from '../../middleware/auth';

export const createPolicyBlueprintRoutes = (pluginManager: PluginManager) => {
  const router = express.Router();
  const policyBlueprintController = new PolicyBlueprintController(pluginManager);

  // Apply auth middleware to all routes
  router.use(authenticateJWT);

  // Blueprint endpoints
  router.get('/policy-blueprints', policyBlueprintController.getAllBlueprints);
  router.get('/policy-blueprints/:pluginType', policyBlueprintController.getBlueprintsByPluginType);
  router.get('/policy-blueprints/:pluginType/:blueprintId', policyBlueprintController.getBlueprintById);

  // Operation endpoints
  router.get('/plugins/:pluginId/operations', policyBlueprintController.getPluginOperations);
  router.get('/credentials/:credentialId/operations', policyBlueprintController.getCredentialOperations);
  
  // Risk assessment endpoint
  router.post('/credentials/:credentialId/assess-risk', policyBlueprintController.assessOperationRisk);
  
  // Recommended policies endpoint
  router.get('/credentials/:credentialId/recommended-policies', policyBlueprintController.getRecommendedPolicies);

  return router;
}; 