import express from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { 
  getAllPreApprovedKeys, 
  getPreApprovedKeyById, 
  createPreApprovedKey, 
  deletePreApprovedKey 
} from '../controllers/preApprovedKeys.controller';

const router = express.Router();

// Apply auth middleware to all routes - only admins should access these
router.use(authenticateJWT);

// Get all pre-approved public keys
router.get('/', getAllPreApprovedKeys);

// Get a specific pre-approved key
router.get('/:id', getPreApprovedKeyById);

// Create a new pre-approved public key
router.post('/', createPreApprovedKey);

// Delete a pre-approved key
router.delete('/:id', deletePreApprovedKey);

export const preApprovedKeysRoutes = router; 