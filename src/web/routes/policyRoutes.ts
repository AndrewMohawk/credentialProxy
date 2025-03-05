import express from 'express';
import { 
  getAllPolicies, 
  getPolicyById, 
  createPolicy, 
  updatePolicy, 
  deletePolicy,
  simulatePolicy
} from '../../api/controllers/policy.controller';
import { PolicyValidationController } from '../../api/controllers/policyValidationController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = express.Router();
const policyValidationController = new PolicyValidationController();

// Apply authentication middleware to all policy routes
router.use(authMiddleware);

// Policy API routes
router.get('/api/v1/policies', getAllPolicies);
router.get('/api/v1/policies/:id', getPolicyById);
router.post('/api/v1/policies', createPolicy);
router.put('/api/v1/policies/:id', updatePolicy);
router.delete('/api/v1/policies/:id', deletePolicy);

// Policy validation and simulation routes
router.post('/api/v1/policies/validate', policyValidationController.validatePolicy.bind(policyValidationController));
router.post('/api/v1/policies/simulate', simulatePolicy);

export default router; 