import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { CredentialPlugin, PolicyTemplate, OperationMetadata } from './CredentialPlugin';

/**
 * Manages credential plugins for the application
 */
export class PluginManager {
  private plugins: Map<string, CredentialPlugin> = new Map();
  private pluginDirectory: string;
  
  constructor(pluginDirectory: string = path.join(__dirname, 'credentials')) {
    this.pluginDirectory = pluginDirectory;
  }
  
  /**
   * Load all available plugins from the plugin directory
   */
  public async loadPlugins(): Promise<void> {
    logger.info(`Loading plugins from ${this.pluginDirectory}`);
    
    try {
      // Get all subdirectories in the plugin directory
      const pluginFolders = fs.readdirSync(this.pluginDirectory, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      for (const folder of pluginFolders) {
        try {
          const pluginPath = path.join(this.pluginDirectory, folder);
          
          // Check if index.ts/js exists
          const indexPath = this.findPluginEntryPoint(pluginPath);
          
          if (!indexPath) {
            logger.warn(`No entry point found for plugin in ${folder}`);
            continue;
          }
          
          // Dynamic import of the plugin
          const pluginModule = await import(indexPath);
          const plugin = pluginModule.default as CredentialPlugin;
          
          if (!this.validatePlugin(plugin)) {
            logger.warn(`Plugin ${folder} does not implement the CredentialPlugin interface correctly`);
            continue;
          }
          
          // Initialize the plugin if it has an initialize method
          if (plugin.initialize) {
            await plugin.initialize();
          }
          
          // Register the plugin
          this.registerPlugin(plugin);
          logger.info(`Loaded plugin: ${plugin.name} (${plugin.id}) v${plugin.version}`);
        } catch (error: any) {
          logger.error(`Error loading plugin from ${folder}: ${error.message}`);
        }
      }
      
      logger.info(`Loaded ${this.plugins.size} plugins successfully`);
    } catch (error: any) {
      logger.error(`Error loading plugins: ${error.message}`);
      throw new Error(`Failed to load plugins: ${error.message}`);
    }
  }
  
  /**
   * Register a plugin with the manager
   */
  public registerPlugin(plugin: CredentialPlugin): void {
    if (this.plugins.has(plugin.id)) {
      logger.warn(`Plugin with ID ${plugin.id} already registered. Overwriting.`);
    }
    
    this.plugins.set(plugin.id, plugin);
  }
  
  /**
   * Get a plugin by ID
   */
  public getPlugin(id: string): CredentialPlugin | undefined {
    return this.plugins.get(id);
  }
  
  /**
   * Get all registered plugins
   */
  public getAllPlugins(): CredentialPlugin[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Find supported operations for a plugin
   */
  public getPluginOperations(pluginId: string): string[] {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) {
      return [];
    }
    
    return plugin.supportedOperations.map(op => op.name);
  }
  
  /**
   * Check if a plugin supports a specific operation
   */
  public supportsOperation(pluginId: string, operation: string): boolean {
    const operations = this.getPluginOperations(pluginId);
    return operations.includes(operation);
  }
  
  /**
   * Execute an operation using the appropriate plugin
   */
  public async executeOperation(
    pluginId: string,
    operation: string,
    credentialData: Record<string, any>,
    parameters: Record<string, any>
  ): Promise<any> {
    const plugin = this.getPlugin(pluginId);
    
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }
    
    if (!this.supportsOperation(pluginId, operation)) {
      throw new Error(`Operation ${operation} not supported by plugin ${pluginId}`);
    }
    
    // Check credential health before executing operation
    const healthCheck = await this.checkCredentialHealth(pluginId, credentialData);
    if (!healthCheck.isValid) {
      throw new Error(`Credential is not valid: ${healthCheck.issues.join(', ')}`);
    }
    
    return plugin.executeOperation(operation, credentialData, parameters);
  }
  
  /**
   * Get risk assessment for an operation
   */
  public getRiskAssessment(
    pluginId: string,
    operation: string,
    context?: any
  ): { score: number; baseScore: number; operation: OperationMetadata | undefined } {
    const plugin = this.getPlugin(pluginId);
    
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }
    
    const operationMetadata = plugin.supportedOperations.find(op => op.name === operation);
    
    if (!operationMetadata) {
      throw new Error(`Operation ${operation} not found for plugin ${pluginId}`);
    }
    
    const score = plugin.riskAssessment.calculateRiskForOperation(operation, context);
    
    return {
      score,
      baseScore: plugin.riskAssessment.baseScore,
      operation: operationMetadata
    };
  }
  
  /**
   * Check the health of a credential
   */
  public async checkCredentialHealth(
    pluginId: string,
    credentialData: Record<string, any>
  ): Promise<{
    isValid: boolean;
    expiresAt?: Date;
    issues: string[];
    recommendations: string[];
    lastChecked: Date;
  }> {
    const plugin = this.getPlugin(pluginId);
    
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }
    
    if (plugin.checkCredentialHealth) {
      return plugin.checkCredentialHealth(credentialData);
    }
    
    // If the plugin doesn't implement checkCredentialHealth, 
    // just validate the credential data
    const validationResult = await plugin.validateCredential(credentialData);
    
    return {
      isValid: !validationResult,
      issues: validationResult ? [validationResult] : [],
      recommendations: [],
      lastChecked: new Date()
    };
  }
  
  /**
   * Get recommended policy templates for a plugin
   */
  public getPolicyTemplates(pluginId: string): PolicyTemplate[] {
    const plugin = this.getPlugin(pluginId);
    
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }
    
    return plugin.policyTemplates || [];
  }
  
  /**
   * Find the entry point file for a plugin
   */
  private findPluginEntryPoint(pluginPath: string): string | null {
    const possibleEntryPoints = ['index.js', 'index.ts'];
    
    for (const entryPoint of possibleEntryPoints) {
      const fullPath = path.join(pluginPath, entryPoint);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    
    return null;
  }
  
  /**
   * Validate that a plugin implements the CredentialPlugin interface
   */
  private validatePlugin(plugin: any): plugin is CredentialPlugin {
    return (
      plugin &&
      typeof plugin.id === 'string' &&
      typeof plugin.name === 'string' &&
      typeof plugin.description === 'string' &&
      typeof plugin.version === 'string' &&
      Array.isArray(plugin.supportedOperations) &&
      Array.isArray(plugin.supportedPolicies) &&
      plugin.riskAssessment && 
      typeof plugin.riskAssessment.baseScore === 'number' &&
      typeof plugin.riskAssessment.calculateRiskForOperation === 'function' &&
      typeof plugin.validateCredential === 'function' &&
      typeof plugin.executeOperation === 'function'
    );
  }
} 