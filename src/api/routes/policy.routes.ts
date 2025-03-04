import { Router } from 'express';
import * as policyController from '../controllers/policy.controller';
import * as policyTemplateController from '../controllers/policyTemplate.controller';
import { authenticateJWT } from '../../middleware/auth';

const router = Router();

// Handle OPTIONS preflight requests without authentication
router.options('*', (req, res) => {
  // Pre-flight request handler for CORS
  res.status(204).end();
});

// Policy routes
router.get('/', authenticateJWT, policyController.getAllPolicies);
router.get('/:id', authenticateJWT, policyController.getPolicyById);
router.post('/', authenticateJWT, policyController.createPolicy);
router.put('/:id', authenticateJWT, policyController.updatePolicy);
router.put('/:id/status', authenticateJWT, policyController.updatePolicyStatus);
router.delete('/:id', authenticateJWT, policyController.deletePolicy);

// Test policies (simulate policy evaluation)
router.post('/simulate', authenticateJWT, policyController.simulatePolicy);

// New Template routes
router.get('/templates/all', authenticateJWT, policyTemplateController.getAllTemplates);
router.get('/templates/type/:credentialType', authenticateJWT, policyTemplateController.getTemplatesForType);
router.get('/templates/:id', authenticateJWT, policyTemplateController.getTemplate);
router.get('/templates/credential/:credentialId', authenticateJWT, policyTemplateController.getTemplatesForCredential);
router.post('/templates/credential/:credentialId/apply', authenticateJWT, policyTemplateController.applyTemplate);
router.post('/templates/credential/:credentialId/apply-recommended', authenticateJWT, policyTemplateController.applyRecommendedTemplates);

export { router as policyRoutes }; 