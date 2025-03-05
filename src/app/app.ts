import express from 'express';
import { configureMiddleware } from './middleware';
import { configureRoutes } from './routes';
import { logger } from '../utils/logger';
import { config } from '../config';
import { getPluginManager } from '../plugins';
import { configureRoutes as configureApiRoutes } from '../api/routes';

/**
 * Initialize and configure the Express application
 */
export const initializeApp = (): express.Express => {
  logger.info('Initializing application...');
  
  // Create Express application
  const app = express();
  
  // Get plugin manager instance
  const pluginManager = getPluginManager();
  
  // Apply middleware
  configureMiddleware(app);
  
  // Configure main app routes
  configureRoutes(app);
  
  // Configure API routes with plugin manager
  configureApiRoutes(app, pluginManager);
  
  logger.info('Application initialized successfully');
  
  return app;
};

/**
 * Create and return the configured Express application
 */
export const app = initializeApp(); 