import express from 'express';
import { PolicyManagementController } from '../controllers/policyManagementController';
import { PluginManager } from '../../plugins/PluginManager';
import { authenticateJWT } from '../../middleware/auth';

export const createPolicyManagementRoutes = (pluginManager: PluginManager) => {
  const router = express.Router();
  const policyManagementController = new PolicyManagementController(pluginManager);

  // Apply auth middleware to all routes
  router.use(authenticateJWT);

  // Policy management endpoints
  router.post('/credentials/:credentialId/policies/from-blueprint', policyManagementController.createPolicyFromBlueprint);
  router.get('/credentials/:credentialId/policies', policyManagementController.getPoliciesByCredential);
  router.get('/policies/:policyId', policyManagementController.getPolicyById);
  router.put('/policies/:policyId', policyManagementController.updatePolicy);
  router.delete('/policies/:policyId', policyManagementController.deletePolicy);

  return router;
}; 