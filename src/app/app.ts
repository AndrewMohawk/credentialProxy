import express from 'express';
import { configureMiddleware } from './middleware';
import { configureRoutes } from './routes';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Initialize and configure the Express application
 */
export const initializeApp = (): express.Express => {
  logger.info('Initializing application...');
  
  // Create Express application
  const app = express();
  
  // Apply middleware
  configureMiddleware(app);
  
  // Configure routes
  configureRoutes(app);
  
  logger.info('Application initialized successfully');
  
  return app;
};

/**
 * Create and return the configured Express application
 */
export const app = initializeApp(); 