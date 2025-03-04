import { Express } from 'express';
import { config } from '../config';
import { policyRoutes } from './routes/policy.routes';
import { credentialRoutes } from './routes/credential.routes';
import { proxyRoutes } from './routes/proxy.routes';
import { authRoutes } from './routes/auth.routes';
import { applicationRoutes } from './routes/application.routes';
import { adminRoutes } from './routes/admin.routes';
import { auditRoutes } from './routes/audit.routes';
import { preApprovedKeysRoutes } from './routes/pre-approved-keys.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import pluginRoutes from './routes/plugin.routes';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../middleware/auth';

// Create a Prisma client instance
const prisma = new PrismaClient();

/**
 * Configure all API routes for the application
 */
export const configureRoutes = (app: Express): void => {
  const apiPrefix = config.app.apiPrefix;
  
  logger.info(`Setting up routes with API prefix: ${apiPrefix}`);
  
  // Log the route when it's hit
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });
  
  // Rest APIs for user actions
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/admin`, adminRoutes);
  app.use(`${apiPrefix}/application`, applicationRoutes);
  app.use(`${apiPrefix}/credentials`, credentialRoutes);
  app.use(`${apiPrefix}/policies`, policyRoutes);
  app.use(`${apiPrefix}/proxy`, proxyRoutes);
  app.use(`${apiPrefix}/audit`, auditRoutes);
  app.use(`${apiPrefix}/pre-approved-keys`, preApprovedKeysRoutes);
  app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
  app.use(`${apiPrefix}/plugins`, pluginRoutes);
  
  // Also keep the /api/plugins endpoint (pointing to the same routes) for backward compatibility
  app.use('/api/plugins', pluginRoutes);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
}; 