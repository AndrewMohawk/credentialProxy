/**
 * CredentialProxy
 * 
 * This module provides the main entry point for the Credential Proxy service.
 * It orchestrates credential management, policy evaluation, and plugin management.
 */

import { app } from '../app/app';
import { logger } from '../utils/logger';
import { config } from '../config';
import { initProxyQueueProcessor } from '../services/proxyQueueProcessor';
import { initializePlugins } from '../plugins';
import { setupSwagger } from '../docs';
import { CredentialManager } from './credential/CredentialManager';
import { PolicyMiddleware } from '../middleware/policyMiddleware';
import { getPluginManager, PluginManager } from '../plugins/PluginManager';
import { PolicyTemplateService } from './policies/policyTemplateService';
import { initVerbRegistry } from '../services/verbRegistryService';

/**
 * The main class for the Credential Proxy service.
 * It provides methods for starting the service, managing credentials and policies.
 */
export class CredentialProxy {
  private static instance: CredentialProxy;
  private pluginManager: PluginManager;
  private policyMiddleware: PolicyMiddleware;
  private policyTemplateService: PolicyTemplateService;
  private isRunning: boolean = false;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize dependencies
    this.pluginManager = getPluginManager();
    this.policyMiddleware = new PolicyMiddleware(CredentialManager);
    this.policyTemplateService = new PolicyTemplateService(this.pluginManager);
  }

  /**
   * Get the singleton instance of CredentialProxy
   */
  public static getInstance(): CredentialProxy {
    if (!CredentialProxy.instance) {
      CredentialProxy.instance = new CredentialProxy();
    }
    return CredentialProxy.instance;
  }

  /**
   * Start the Credential Proxy service
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('CredentialProxy is already running');
      return;
    }

    try {
      logger.info('Starting CredentialProxy service...');
      
      // Initialize plugins
      await initializePlugins();
      
      // Initialize proxy queue processor
      initProxyQueueProcessor();
      
      // Initialize verb registry
      await initVerbRegistry();
      logger.info('Verb registry initialized');
      
      // Setup Swagger documentation
      setupSwagger(app);
      
      // Start the server if not in test environment
      if (config.app.env !== 'test') {
        const PORT = config.app.port;
        app.listen(PORT, () => {
          logger.info(`Server running on port ${PORT} in ${config.app.env} mode`);
          logger.info(`API endpoints available at ${config.app.apiPrefix}`);
          this.isRunning = true;
        });
      }
    } catch (error) {
      logger.error('Failed to start CredentialProxy service:', error);
      throw error;
    }
  }

  /**
   * Stop the Credential Proxy service
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('CredentialProxy is not running');
      return;
    }

    logger.info('Stopping CredentialProxy service...');
    this.isRunning = false;
    // Additional cleanup logic can be added here
  }

  /**
   * Get the Credential Manager instance
   */
  public getCredentialManager(): typeof CredentialManager {
    return CredentialManager;
  }

  /**
   * Get the Plugin Manager instance
   */
  public getPluginManager(): PluginManager {
    return this.pluginManager;
  }

  /**
   * Get the Policy Middleware instance
   */
  public getPolicyMiddleware(): PolicyMiddleware {
    return this.policyMiddleware;
  }

  /**
   * Get the Policy Template Service instance
   */
  public getPolicyTemplateService(): PolicyTemplateService {
    return this.policyTemplateService;
  }
}

/**
 * Helper function to get the singleton instance of CredentialProxy
 */
export function getCredentialProxy(): CredentialProxy {
  return CredentialProxy.getInstance();
} 