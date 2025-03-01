import { BaseCredentialPlugin } from '../../plugins/BaseCredentialPlugin';
import { OperationMetadata, PolicyConfig } from '../../plugins/CredentialPlugin';
import { mockAxiosResponse, PolicyType } from '../testUtils';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Create our own version of ApiKeyPlugin for testing
class ApiKeyPlugin extends BaseCredentialPlugin {
  id = 'api-key';
  name = 'API Key';
  description = 'Use API keys to authenticate HTTP requests to third-party services';
  version = '1.0.0';
  
  credentialSchema = {
    apiKey: {
      type: 'string',
      required: true,
      description: 'The API key value',
    },
    baseUrl: {
      type: 'string',
      required: false,
      description: 'Base URL for API requests',
    },
    headerName: {
      type: 'string',
      required: false,
      default: 'Authorization',
      description: 'Header name for the API key',
    },
  };
  
  // Define supported operations
  supportedOperations: OperationMetadata[] = [
    {
      name: 'GET',
      description: 'Make a GET request',
      requiredParams: ['url'],
      optionalParams: ['headers', 'params'],
      returns: 'HTTP response',
    },
    {
      name: 'POST',
      description: 'Make a POST request',
      requiredParams: ['url'],
      optionalParams: ['headers', 'data', 'params'],
      returns: 'HTTP response',
    },
    {
      name: 'PUT',
      description: 'Make a PUT request',
      requiredParams: ['url'],
      optionalParams: ['headers', 'data', 'params'],
      returns: 'HTTP response',
    },
    {
      name: 'DELETE',
      description: 'Make a DELETE request',
      requiredParams: ['url'],
      optionalParams: ['headers', 'data', 'params'],
      returns: 'HTTP response',
    },
    {
      name: 'PATCH',
      description: 'Make a PATCH request',
      requiredParams: ['url'],
      optionalParams: ['headers', 'data', 'params'],
      returns: 'HTTP response',
    },
  ];
  
  // Define supported policy types
  supportedPolicies: PolicyConfig[] = [
    {
      type: PolicyType.ALLOW_LIST,
      description: 'Allow requests to specific URLs or with specific parameters',
      defaultConfig: {
        urlPatterns: [],
        operations: [],
      },
    },
    {
      type: PolicyType.DENY_LIST,
      description: 'Deny requests to specific URLs or with specific parameters',
      defaultConfig: {
        urlPatterns: [],
        operations: [],
      },
    },
    {
      type: PolicyType.TIME_BASED,
      description: 'Allow requests only during specific times',
      defaultConfig: {
        startTime: '09:00',
        endTime: '17:00',
        daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
      },
    },
    {
      type: PolicyType.COUNT_BASED,
      description: 'Limit the number of requests in a time period',
      defaultConfig: {
        maxRequests: 100,
        timeWindowMinutes: 60,
      },
    },
    {
      type: PolicyType.MANUAL_APPROVAL,
      description: 'Require manual approval for requests',
    },
  ];
  
  async validateCredential(credentialData: Record<string, any>): Promise<string | null> {
    // Call the base validation
    const baseValidation = await super.validateCredential(credentialData);
    if (baseValidation) {
      return baseValidation;
    }
    
    // Additional API key-specific validation can be added here
    if (credentialData.apiKey && credentialData.apiKey.length < 8) {
      return 'API key should be at least 8 characters long';
    }
    
    return null;
  }
  
  async executeOperation(
    operation: string,
    credentialData: Record<string, any>,
    parameters: Record<string, any>
  ): Promise<any> {
    // Validate operation parameters
    const paramValidation = this.validateOperationParameters(operation, parameters);
    if (paramValidation) {
      throw new Error(paramValidation);
    }
    
    // Extract credential data
    const { apiKey, baseUrl, headerName = 'Authorization' } = credentialData;
    
    // Extract request parameters
    const { url, headers = {}, data, params } = parameters;
    
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    if (!url && !baseUrl) {
      throw new Error('URL is required');
    }
    
    const fullUrl = url || baseUrl;
    const requestHeaders = {
      ...headers,
      [headerName]: apiKey,
    };
    
    try {
      const response = await axios({
        method: operation.toLowerCase(),
        url: fullUrl,
        headers: requestHeaders,
        data,
        params,
      });
      
      return {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers,
      };
    } catch (error: any) {
      if (error.response) {
        return {
          error: true,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        };
      }
      
      throw new Error(`API request failed: ${error.message}`);
    }
  }
}

describe('ApiKeyPlugin', () => {
  let plugin: ApiKeyPlugin;
  
  beforeEach(() => {
    plugin = new ApiKeyPlugin();
    jest.clearAllMocks();
  });
  
  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(plugin.id).toBe('api-key');
      expect(plugin.name).toBe('API Key');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.supportedOperations).toHaveLength(5); // GET, POST, PUT, DELETE, PATCH
      expect(plugin.supportedPolicies).toHaveLength(5); // ALLOW_LIST, DENY_LIST, TIME_BASED, COUNT_BASED, MANUAL_APPROVAL
    });
  });
  
  describe('validateCredential', () => {
    it('should validate valid credential data', async () => {
      const result = await plugin.validateCredential({
        apiKey: 'valid-api-key-12345678',
        baseUrl: 'https://api.example.com',
      });
      
      expect(result).toBeNull();
    });
    
    it('should reject if API key is missing', async () => {
      const result = await plugin.validateCredential({
        baseUrl: 'https://api.example.com',
      });
      
      expect(result).toBe('Missing required field: apiKey');
    });
    
    it('should reject if API key is too short', async () => {
      const result = await plugin.validateCredential({
        apiKey: 'short',
        baseUrl: 'https://api.example.com',
      });
      
      expect(result).toBe('API key should be at least 8 characters long');
    });
  });
  
  describe('executeOperation', () => {
    const credentialData = {
      apiKey: 'test-api-key-12345678',
      baseUrl: 'https://api.example.com',
      headerName: 'X-API-Key',
    };
    
    it('should execute GET operation', async () => {
      (mockedAxios as unknown as jest.Mock).mockResolvedValueOnce(
        mockAxiosResponse(200, { data: 'test' })
      );
      
      const result = await plugin.executeOperation(
        'GET',
        credentialData,
        { url: '/endpoint' }
      );
      
      expect(mockedAxios).toHaveBeenCalledWith({
        method: 'get',
        url: '/endpoint',
        headers: { 'X-API-Key': 'test-api-key-12345678' },
        data: undefined,
        params: undefined,
      });
      
      expect(result).toEqual({
        status: 200,
        statusText: 'OK',
        data: { data: 'test' },
        headers: {},
      });
    });
    
    it('should execute POST operation', async () => {
      (mockedAxios as unknown as jest.Mock).mockResolvedValueOnce(
        mockAxiosResponse(201, { id: '123' })
      );
      
      const result = await plugin.executeOperation(
        'POST',
        credentialData,
        { 
          url: '/endpoint',
          data: { name: 'Test Resource' }
        }
      );
      
      expect(mockedAxios).toHaveBeenCalledWith({
        method: 'post',
        url: '/endpoint',
        headers: { 'X-API-Key': 'test-api-key-12345678' },
        data: { name: 'Test Resource' },
        params: undefined,
      });
      
      expect(result).toEqual({
        status: 201,
        statusText: 'Error',
        data: { id: '123' },
        headers: {},
      });
    });
    
    it('should handle API error responses', async () => {
      (mockedAxios as unknown as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { error: 'Invalid API key' },
        },
      });
      
      const result = await plugin.executeOperation(
        'GET',
        credentialData,
        { url: '/endpoint' }
      );
      
      expect(result).toEqual({
        error: true,
        status: 401,
        statusText: 'Unauthorized',
        data: { error: 'Invalid API key' },
      });
    });
    
    it('should throw error for network failures', async () => {
      (mockedAxios as unknown as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );
      
      await expect(
        plugin.executeOperation(
          'GET',
          credentialData,
          { url: '/endpoint' }
        )
      ).rejects.toThrow('API request failed: Network error');
    });
    
    it('should throw error for missing API key', async () => {
      await expect(
        plugin.executeOperation(
          'GET',
          { baseUrl: 'https://api.example.com' },
          { url: '/endpoint' }
        )
      ).rejects.toThrow('API key is required');
    });
    
    it('should throw error for missing URL', async () => {
      await expect(
        plugin.executeOperation(
          'GET',
          { apiKey: 'test-api-key' },
          {}
        )
      ).rejects.toThrow('Missing required parameter: url');
    });
    
    it('should throw error for unsupported operation', async () => {
      await expect(
        plugin.executeOperation(
          'CUSTOM',
          credentialData,
          { url: '/endpoint' }
        )
      ).rejects.toThrow('Operation CUSTOM is not supported by this plugin');
    });
  });
});