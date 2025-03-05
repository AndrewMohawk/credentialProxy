import express from 'express';
import { PolicyController } from '../controllers/policyController';
import { authMiddleware } from '../../middleware/auth';

/**
 * Create routes for policy management
 */
export function createPolicyRoutes(): express.Router {
  const router = express.Router();
  const controller = new PolicyController();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  // Routes for policy management
  router.get('/credentials/:credentialId/policies', controller.getPolicies.bind(controller));
  router.get('/policies/:policyId', controller.getPolicy.bind(controller));
  router.post('/credentials/:credentialId/policies', controller.createPolicy.bind(controller));
  router.put('/policies/:policyId', controller.updatePolicy.bind(controller));
  router.patch('/policies/:policyId/toggle', controller.togglePolicy.bind(controller));
  router.delete('/policies/:policyId', controller.deletePolicy.bind(controller));

  return router;
}

export default createPolicyRoutes; 