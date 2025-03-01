import { Express } from 'express';
import { authRoutes } from './routes/auth.routes';
import { credentialRoutes } from './routes/credential.routes';
import { policyRoutes } from './routes/policy.routes';
import { applicationRoutes } from './routes/application.routes';
import { proxyRoutes } from './routes/proxy.routes';
import { adminRoutes } from './routes/admin.routes';
import { logger } from '../utils/logger';

export const configureRoutes = (app: Express): void => {
  // API version prefix
  const apiPrefix = '/api/v1';
  
  // Log all API requests
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
  });
  
  // Public routes
  app.use(`${apiPrefix}/auth`, authRoutes);
  
  // Proxy endpoint for third-party apps
  app.use(`${apiPrefix}/proxy`, proxyRoutes);
  
  // Protected routes
  app.use(`${apiPrefix}/credentials`, credentialRoutes);
  app.use(`${apiPrefix}/policies`, policyRoutes);
  app.use(`${apiPrefix}/applications`, applicationRoutes);
  app.use(`${apiPrefix}/admin`, adminRoutes);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
}; 