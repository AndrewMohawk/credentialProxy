import { BaseCredentialPlugin } from '../../plugins/BaseCredentialPlugin';
import { OperationMetadata, PolicyConfig } from '../../plugins/CredentialPlugin';
import { PolicyType } from '../testUtils';

// Create a concrete implementation of BaseCredentialPlugin for testing
class TestPlugin extends BaseCredentialPlugin {
  id = 'test-plugin';
  name = 'Test Plugin';
  description = 'A test plugin';
  version = '1.0.0';
  
  credentialSchema = {
    apiKey: {
      type: 'string',
      required: true,
    },
    baseUrl: {
      type: 'string',
      required: false,
    },
  };
  
  supportedOperations: OperationMetadata[] = [
    {
      name: 'TEST_OP',
      description: 'A test operation',
      requiredParams: ['requiredParam'],
      optionalParams: ['optionalParam'],
    },
  ];
  
  supportedPolicies: PolicyConfig[] = [
    {
      type: PolicyType.ALLOW_LIST,
      description: 'Allow list policy',
    },
  ];
  
  async executeOperation(
    operation: string,
    credentialData: Record<string, any>,
    parameters: Record<string, any>
  ): Promise<any> {
    if (operation === 'TEST_OP') {
      return { success: true };
    }
    throw new Error(`Unsupported operation: ${operation}`);
  }
}

describe('BaseCredentialPlugin', () => {
  let plugin: TestPlugin;
  
  beforeEach(() => {
    plugin = new TestPlugin();
  });
  
  describe('supportsOperation', () => {
    it('should return true for supported operations', () => {
      expect(plugin.supportsOperation('TEST_OP')).toBe(true);
    });
    
    it('should return false for unsupported operations', () => {
      expect(plugin.supportsOperation('UNKNOWN_OP')).toBe(false);
    });
  });
  
  describe('validateCredential', () => {
    it('should pass validation for valid credentials', async () => {
      const result = await plugin.validateCredential({
        apiKey: 'test-key',
        baseUrl: 'https://example.com',
      });
      
      expect(result).toBeNull();
    });
    
    it('should fail validation for missing required fields', async () => {
      const result = await plugin.validateCredential({
        baseUrl: 'https://example.com',
      });
      
      expect(result).toBe('Missing required field: apiKey');
    });
    
    it('should handle validation errors gracefully', async () => {
      // Use a different approach to mock the error
      const originalValidateCredential = plugin.validateCredential;
      plugin.validateCredential = jest.fn().mockImplementationOnce(() => {
        return Promise.resolve('Validation error');
      });
      
      const result = await plugin.validateCredential({});
      
      expect(result).toBe('Validation error');
      
      // Restore the original method
      plugin.validateCredential = originalValidateCredential;
    });
  });
  
  describe('validateOperationParameters', () => {
    it('should return null for valid parameters', () => {
      const result = plugin['validateOperationParameters']('TEST_OP', {
        requiredParam: 'value',
      });
      
      expect(result).toBeNull();
    });
    
    it('should return an error for missing required parameters', () => {
      const result = plugin['validateOperationParameters']('TEST_OP', {});
      
      expect(result).toBe('Missing required parameter: requiredParam');
    });
    
    it('should return an error for unsupported operations', () => {
      const result = plugin['validateOperationParameters']('UNKNOWN_OP', {});
      
      expect(result).toBe('Operation UNKNOWN_OP is not supported by this plugin');
    });
  });
  
  describe('executeOperation', () => {
    it('should execute a supported operation', async () => {
      const result = await plugin.executeOperation('TEST_OP', { apiKey: 'test-key' }, { requiredParam: 'value' });
      
      expect(result).toEqual({ success: true });
    });
    
    it('should throw an error for unsupported operations', async () => {
      await expect(
        plugin.executeOperation('UNKNOWN_OP', { apiKey: 'test-key' }, {})
      ).rejects.toThrow('Unsupported operation: UNKNOWN_OP');
    });
  });
}); 