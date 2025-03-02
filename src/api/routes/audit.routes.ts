import express from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { getAuditLogs, getAuditLogById } from '../controllers/audit.controller';

const router = express.Router();

// Apply authentication middleware to all audit routes
router.use(authenticateJWT);

// Get audit logs with optional filtering
router.get('/', getAuditLogs);

// Get a specific audit log
router.get('/:id', getAuditLogById);

export const auditRoutes = router; 