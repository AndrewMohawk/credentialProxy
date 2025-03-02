import express from 'express';
import { authenticateJWT } from '../../middleware/auth';
import { getDashboardMetrics } from '../controllers/dashboard.controller';

const router = express.Router();

// Apply authentication middleware to all dashboard routes
router.use(authenticateJWT);

// Get dashboard metrics
router.get('/metrics', getDashboardMetrics);

export const dashboardRoutes = router; 