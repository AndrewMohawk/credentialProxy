import { app } from './app/app';
import { logger } from './utils/logger';
import { config } from './config';
import { initProxyQueueProcessor } from './services/proxyQueueProcessor';
import { initializePlugins } from './plugins';
import { setupSwagger } from './docs';

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Initialize plugins
    await initializePlugins();
    
    // Initialize proxy queue processor
    initProxyQueueProcessor();
    
    // Setup Swagger documentation
    setupSwagger(app);
    
    // Start the server if not in test environment
    if (config.app.env !== 'test') {
      const PORT = config.app.port;
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT} in ${config.app.env} mode`);
        logger.info(`API endpoints available at ${config.app.apiPrefix}`);
      });
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export the app for testing
export { app }; 