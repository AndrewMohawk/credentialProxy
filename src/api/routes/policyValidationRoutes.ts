import express from 'express';
import { PolicyValidationController } from '../controllers/policyValidationController';
import { authMiddleware } from '../../middleware/auth';

/**
 * Create routes for policy validation
 */
export function createPolicyValidationRoutes(): express.Router {
  const router = express.Router();
  const controller = new PolicyValidationController();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  // Routes for policy validation and testing
  router.post('/validate', controller.validatePolicy.bind(controller));
  router.post('/simulate', controller.simulatePolicy.bind(controller));
  router.get('/template/:type', controller.getPolicyTemplate.bind(controller));
  router.get('/suggestions/:type', controller.getPolicySuggestions.bind(controller));
  router.get('/field-paths/:type', controller.getPolicyFieldPaths.bind(controller));

  return router;
}

export default createPolicyValidationRoutes; 