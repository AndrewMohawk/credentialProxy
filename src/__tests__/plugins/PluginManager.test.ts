import fs from 'fs';
import path from 'path';
import os from 'os';
import { PluginManager } from '../../plugins/PluginManager';
import { MockCredentialPlugin, createMockPluginDirectory } from '../testUtils';

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('PluginManager', () => {
  let tempDir: string;
  let pluginDir: string;
  let pluginManager: PluginManager;
  
  beforeEach(() => {
    // Create a temporary directory for test plugins
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-plugins-'));
    pluginDir = createMockPluginDirectory(tempDir);
    pluginManager = new PluginManager(pluginDir);
  });
  
  afterEach(() => {
    // Clean up temporary directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
  
  describe('registerPlugin and getPlugin', () => {
    it('should register a plugin and retrieve it by ID', () => {
      const mockPlugin = new MockCredentialPlugin();
      
      pluginManager.registerPlugin(mockPlugin);
      
      const plugin = pluginManager.getPlugin(mockPlugin.id);
      expect(plugin).toBe(mockPlugin);
    });
    
    it('should return undefined for non-existent plugin ID', () => {
      const plugin = pluginManager.getPlugin('non-existent-id');
      expect(plugin).toBeUndefined();
    });
    
    it('should overwrite plugin if ID already exists', () => {
      const mockPlugin1 = new MockCredentialPlugin();
      const mockPlugin2 = new MockCredentialPlugin();
      Object.defineProperty(mockPlugin2, 'description', { value: 'Updated plugin description' });
      
      pluginManager.registerPlugin(mockPlugin1);
      pluginManager.registerPlugin(mockPlugin2);
      
      const plugin = pluginManager.getPlugin(mockPlugin1.id);
      expect(plugin).toBe(mockPlugin2);
      expect(plugin?.description).toBe('Updated plugin description');
    });
  });
  
  describe('getAllPlugins', () => {
    it('should retrieve all registered plugins', () => {
      const mockPlugin1 = new MockCredentialPlugin();
      const mockPlugin2 = new MockCredentialPlugin();
      Object.defineProperty(mockPlugin2, 'id', { value: 'mock-plugin-2' });
      
      pluginManager.registerPlugin(mockPlugin1);
      pluginManager.registerPlugin(mockPlugin2);
      
      const plugins = pluginManager.getAllPlugins();
      expect(plugins).toHaveLength(2);
      expect(plugins).toContain(mockPlugin1);
      expect(plugins).toContain(mockPlugin2);
    });
    
    it('should return an empty array when no plugins are registered', () => {
      const plugins = pluginManager.getAllPlugins();
      expect(plugins).toHaveLength(0);
    });
  });
  
  describe('getPluginOperations', () => {
    it('should retrieve operations for a plugin', () => {
      const mockPlugin = new MockCredentialPlugin();
      pluginManager.registerPlugin(mockPlugin);
      
      const operations = pluginManager.getPluginOperations(mockPlugin.id);
      expect(operations).toEqual(['TEST_OPERATION']);
    });
    
    it('should return empty array for non-existent plugin', () => {
      const operations = pluginManager.getPluginOperations('non-existent-id');
      expect(operations).toEqual([]);
    });
  });
  
  describe('supportsOperation', () => {
    it('should return true for supported operations', () => {
      const mockPlugin = new MockCredentialPlugin();
      pluginManager.registerPlugin(mockPlugin);
      
      const result = pluginManager.supportsOperation(mockPlugin.id, 'TEST_OPERATION');
      expect(result).toBe(true);
    });
    
    it('should return false for unsupported operations', () => {
      const mockPlugin = new MockCredentialPlugin();
      pluginManager.registerPlugin(mockPlugin);
      
      const result = pluginManager.supportsOperation(mockPlugin.id, 'UNKNOWN_OPERATION');
      expect(result).toBe(false);
    });
    
    it('should return false for non-existent plugin', () => {
      const result = pluginManager.supportsOperation('non-existent-id', 'TEST_OPERATION');
      expect(result).toBe(false);
    });
  });
  
  describe('executeOperation', () => {
    it('should execute operation for a registered plugin', async () => {
      const mockPlugin = new MockCredentialPlugin();
      pluginManager.registerPlugin(mockPlugin);
      
      const credentialData = { username: 'test', password: 'password' };
      const parameters = { param1: 'value1' };
      
      const result = await pluginManager.executeOperation(
        mockPlugin.id,
        'TEST_OPERATION',
        credentialData,
        parameters
      );
      
      expect(result).toEqual({
        success: true,
        data: {
          operation: 'TEST_OPERATION',
          credentials: credentialData,
          parameters,
        },
      });
    });
    
    it('should throw error for non-existent plugin', async () => {
      await expect(
        pluginManager.executeOperation(
          'non-existent-id',
          'TEST_OPERATION',
          {},
          {}
        )
      ).rejects.toThrow('Plugin with ID non-existent-id not found');
    });
    
    it('should throw error for unsupported operation', async () => {
      const mockPlugin = new MockCredentialPlugin();
      pluginManager.registerPlugin(mockPlugin);
      
      await expect(
        pluginManager.executeOperation(
          mockPlugin.id,
          'UNKNOWN_OPERATION',
          {},
          {}
        )
      ).rejects.toThrow('Operation UNKNOWN_OPERATION not supported by plugin mock-plugin');
    });
  });
}); 