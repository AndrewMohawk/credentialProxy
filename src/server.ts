/**
 * Server Entry Point
 * 
 * This module is the main entry point for the application.
 * It initializes and starts the CredentialProxy service.
 */

import { app } from './app/app';
import { logger } from './utils/logger';
import { getCredentialProxy } from './core/CredentialProxy';
import { initVerbRegistry } from './services/verbRegistryService';
import { initCredentialVerbDiscovery } from './services/credentialVerbDiscovery';
import { initPluginVerbDiscovery } from './services/pluginVerbDiscovery';

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

// Initialize services
async function initializeServices() {
  try {
    logger.info('Initializing services...');
    
    // Initialize verb registry
    await initVerbRegistry();
    
    // Initialize credential verb discovery
    await initCredentialVerbDiscovery();
    
    // Initialize plugin verb discovery
    await initPluginVerbDiscovery();
    
    logger.info('Services initialized successfully');
  } catch (error) {
    logger.error(`Error initializing services: ${error}`);
    process.exit(1);
  }
}

// Call initialization function
initializeServices();

// Start the server
startServer();

// Export the app for testing
export { app }; 