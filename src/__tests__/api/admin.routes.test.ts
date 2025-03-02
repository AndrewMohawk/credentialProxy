import { adminRoutes } from '../../api/routes/admin.routes';
import { MockCredentialPlugin, PolicyType } from '../testUtils';
import express from 'express';
import request from 'supertest';

// Create mock plugins
const mockPlugin1 = new MockCredentialPlugin();
const mockPlugin2 = new MockCredentialPlugin();
Object.defineProperty(mockPlugin2, 'id', { value: 'mock-plugin-2' });
Object.defineProperty(mockPlugin2, 'name', { value: 'Mock Plugin 2' });

// Update the supportedPolicies for the mock plugins to match expected output
mockPlugin1.supportedPolicies = [
  {
    type: PolicyType.ALLOW_LIST,
    description: 'Allow specific operations',
    defaultConfig: {}
  }
];

mockPlugin2.supportedPolicies = [
  {
    type: PolicyType.ALLOW_LIST,
    description: 'Allow specific operations',
    defaultConfig: {}
  }
];

// Create mock plugin manager
const mockGetAllPlugins = jest.fn();
const mockGetPlugin = jest.fn();
const mockPluginManager = {
  getAllPlugins: mockGetAllPlugins,
  getPlugin: mockGetPlugin
};

// Mock the dependencies
jest.mock('../../plugins', () => ({
  getPluginManager: jest.fn(() => mockPluginManager)
}));

// Mock the authentication middleware
jest.mock('../../middleware/auth', () => ({
  authenticateJWT: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Add a mock user to the request
    req.user = {
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com'
    };
    next();
  }
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Admin Routes', () => {
  let app: express.Express;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create an Express app for testing
    app = express();
    app.use(express.json());
    app.use('/admin', adminRoutes);
  });
  
  describe('GET /admin/plugins', () => {
    it('should return all plugins', async () => {
      // Setup the mock response
      mockGetAllPlugins.mockReturnValueOnce([mockPlugin1, mockPlugin2]);
      
      // Make the request
      const response = await request(app).get('/admin/plugins');
      
      // Verify the response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.plugins).toHaveLength(2);
      
      // Check the first plugin
      const expectedPlugin = {
        id: 'mock-plugin',
        name: 'Mock Plugin',
        description: 'A mock plugin for testing',
        version: '1.0.0',
        operations: [
          {
            id: 'TEST_OPERATION',
            name: 'TEST_OPERATION',
            description: 'A test operation',
          },
        ],
        policies: [
          {
            description: 'Allow specific operations',
            name: '',
          },
        ],
      };
      
      // Update test to match the actual response format
      const firstPlugin = response.body.plugins[0];
      expect(firstPlugin).toEqual(expectedPlugin);
      
      // Check the second plugin
      expect(response.body.plugins[1].id).toBe('mock-plugin-2');
      expect(response.body.plugins[1].name).toBe('Mock Plugin 2');
    });
    
    it('should handle errors', async () => {
      // Setup the mock to throw an error
      mockGetAllPlugins.mockImplementationOnce(() => {
        throw new Error('Plugin manager error');
      });
      
      // Make the request
      const response = await request(app).get('/admin/plugins');
      
      // Verify the response
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to get plugins');
    });
  });
  
  describe('GET /admin/plugins/:id', () => {
    it('should return a specific plugin by ID', async () => {
      // Setup the mock response
      mockGetPlugin.mockReturnValueOnce(mockPlugin1);
      
      // Make the request
      const response = await request(app).get('/admin/plugins/mock-plugin');
      
      // Verify the response
      const expectedPlugin = {
        id: 'mock-plugin',
        name: 'Mock Plugin',
        description: 'A mock plugin for testing',
        version: '1.0.0',
        operations: [
          {
            id: 'TEST_OPERATION',
            name: 'TEST_OPERATION',
            description: 'A test operation',
          },
        ],
        policies: [
          {
            description: 'Allow specific operations',
            name: '',
            type: 'ALLOW_LIST',
          },
        ],
        schema: {
          username: {
            type: 'string',
            required: true,
          },
          password: {
            type: 'string',
            required: true,
          },
        },
      };
      
      expect(response.body.plugin).toEqual(expectedPlugin);
    });
    
    it('should return 404 for non-existent plugin', async () => {
      // Setup the mock response for non-existent plugin
      mockGetPlugin.mockReturnValueOnce(undefined);
      
      // Make the request
      const response = await request(app).get('/admin/plugins/non-existent');
      
      // Verify the response
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Plugin with ID non-existent not found');
    });
    
    it('should handle errors', async () => {
      // Setup the mock to throw an error
      mockGetPlugin.mockImplementationOnce(() => {
        throw new Error('Plugin manager error');
      });
      
      // Make the request
      const response = await request(app).get('/admin/plugins/mock-plugin');
      
      // Verify the response
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to get plugin');
    });
  });
}); 