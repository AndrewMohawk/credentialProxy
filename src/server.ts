/**
 * Server Entry Point
 * 
 * This module is the main entry point for the application.
 * It initializes and starts the CredentialProxy service.
 */

import { app } from './app/app';
import { logger } from './utils/logger';
import { getCredentialProxy } from './core/CredentialProxy';

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Get the CredentialProxy instance and start it
    const credentialProxy = getCredentialProxy();
    await credentialProxy.start();
    
    logger.info('Server started successfully');
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export the app for testing
export { app }; 