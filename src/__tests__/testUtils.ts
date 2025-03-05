import fs from 'fs';
import path from 'path';
import { CredentialPlugin, RiskAssessment, OperationMetadata, PolicyConfig, PolicyBlueprint, OperationRiskAssessment } from '../plugins/CredentialPlugin';

// Mock PolicyType enum since we're having issues with it
export enum PolicyType {
  ALLOW_LIST = 'ALLOW_LIST',
  DENY_LIST = 'DENY_LIST',
  TIME_BASED = 'TIME_BASED',
  COUNT_BASED = 'COUNT_BASED',
  MANUAL_APPROVAL = 'MANUAL_APPROVAL',
}

/**
 * Create a mock plugin directory for testing
 */
export const createMockPluginDirectory = (baseDir: string): string => {
  const pluginDir = path.join(baseDir, 'plugins');
  
  if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(pluginDir, { recursive: true });
  }
  
  return pluginDir;
};

// Rename interface to TestPolicyConfig to avoid conflicts
export interface TestPolicyConfig {
  type: PolicyType;
  description: string;
  id: string;
  name: string;
  defaultConfig?: any;
}

// Define the OperationMetadata interface for testing
export interface TestOperationMetadata extends Omit<OperationMetadata, 'applicablePolicies'> {
  id?: string;
  name: string;
  description: string;
  requiredParams: string[];
  optionalParams: string[];
  riskLevel: number;
  applicablePolicies: PolicyType[];
  recommendedPolicies?: PolicyType[];
  suggestedRateLimits?: {
    perMinute?: number;
    perHour?: number;
    perDay?: number;
  };
}

/**
 * Create a test plugin for use in tests
 */
export class MockCredentialPlugin implements CredentialPlugin {
  id = 'mock-plugin';
  name = 'Mock Plugin';
  description = 'A mock plugin for testing';
  version = '1.0.0';
  
  credentialSchema = {
    username: {
      type: 'string',
      required: true,
    },
    password: {
      type: 'string',
      required: true,
    },
  };
  
  riskAssessment: RiskAssessment = {
    baseScore: 5,
    contextualFactors: {
      networkRestrictions: false,
      timeRestrictions: false,
      dataAccess: 'read',
    },
    calculateRiskForOperation: (operation: string, context?: any) => {
      return 5;
    },
  };
  
  supportedOperations: OperationMetadata[] = [
    {
      name: 'login',
      description: 'Log in to the service',
      requiredParams: ['username', 'password'],
      optionalParams: [],
      riskLevel: 7,
      applicablePolicies: [PolicyType.TIME_BASED, PolicyType.ALLOW_LIST],
    },
    {
      name: 'getData',
      description: 'Get data from the service',
      requiredParams: ['dataId'],
      optionalParams: ['format'],
      riskLevel: 3,
      applicablePolicies: [PolicyType.ALLOW_LIST],
    },
  ];
  
  supportedPolicies: PolicyConfig[] = [
    {
      type: PolicyType.ALLOW_LIST,
      description: 'Allow access from specified IPs or domains'
    },
    {
      type: PolicyType.TIME_BASED,
      description: 'Allow access only during specified times'
    },
  ];
  
  async validateCredential(credentialData: Record<string, any>): Promise<string | null> {
    if (!credentialData.username || !credentialData.password) {
      return 'Missing required fields: username and password';
    }
    return null;
  }
  
  async executeOperation(
    operation: string,
    credentialData: Record<string, any>,
    parameters: Record<string, any>
  ): Promise<any> {
    if (operation === 'login') {
      return { success: true, token: 'mock-token' };
    }
    if (operation === 'getData') {
      return { data: 'mock-data', id: parameters.dataId };
    }
    throw new Error(`Unsupported operation: ${operation}`);
  }
  
  async checkCredentialHealth(
    credentialData: Record<string, any>
  ): Promise<{
    isValid: boolean;
    expiresAt?: Date;
    issues: string[];
    recommendations: string[];
    lastChecked: Date;
  }> {
    return {
      isValid: true,
      expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
      issues: [],
      recommendations: [],
      lastChecked: new Date(),
    };
  }

  // Add the missing methods required by the CredentialPlugin interface
  getPolicyBlueprints(): PolicyBlueprint[] {
    return [
      {
        id: 'mock-blueprint-1',
        name: 'Allow List Policy',
        description: 'Allow access from specific IPs or domains',
        type: PolicyType.ALLOW_LIST,
        configuration: {
          allowedIps: ['127.0.0.1', '192.168.1.1'],
          allowedDomains: ['example.com']
        },
        customizationSchema: {
          type: 'object',
          properties: {
            allowedIps: {
              type: 'array',
              items: { type: 'string' }
            },
            allowedDomains: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        securityLevel: 'standard',
        riskLevel: 3,
        explanation: ['Restricts access to specified IPs or domains'],
        recommendedFor: ['login', 'getData']
      }
    ];
  }
  
  getOperationsMap(): Map<string, OperationMetadata> {
    const map = new Map<string, OperationMetadata>();
    this.supportedOperations.forEach(op => map.set(op.name, op));
    return map;
  }
  
  async assessOperationRisk(
    credentialData: Record<string, any>,
    operation: string
  ): Promise<OperationRiskAssessment> {
    return {
      score: 5,
      factors: ['Basic credential type', 'Standard operation risk'],
      recommendations: this.getPolicyBlueprints(),
      details: {
        credentialRisk: 3,
        operationRisk: 4,
        contextRisk: 2,
        mitigations: [
          {
            type: 'policy',
            impact: -2,
            description: 'Apply IP restriction policies'
          }
        ]
      }
    };
  }
}

/**
 * Create a valid test credential for testing
 */
export const createTestCredential = () => ({
  id: 'cred_test123',
  type: 'API_KEY',
  data: 'encrypted_data_placeholder',
  name: 'Test API Key',
  description: 'A test API key for unit tests',
  createdAt: new Date(),
  updatedAt: new Date(),
});

/**
 * Mock decrypted credential data
 */
export const mockDecryptedCredentialData = {
  apiKey: 'test_api_key_12345',
  baseUrl: 'https://api.example.com',
  headerName: 'X-API-Key',
};

/**
 * Mock for prisma client
 */
export const mockPrismaClient = {
  credential: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

/**
 * Mock logger for testing
 */
export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

/**
 * Mock for credential encryption functions
 */
export const mockCredentialManager = {
  encryptCredential: jest.fn().mockReturnValue('encrypted_data'),
  decryptCredential: jest.fn().mockReturnValue(mockDecryptedCredentialData),
};

/**
 * Mock an HTTP axios response
 */
export const mockAxiosResponse = (status = 200, data = {}, headers = {}) => ({
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  data,
  headers,
});

// Add a simple test to avoid test suite failure
describe('testUtils', () => {
  it('should export PolicyType enum', () => {
    expect(PolicyType).toBeDefined();
    expect(PolicyType.ALLOW_LIST).toBeDefined();
    expect(PolicyType.DENY_LIST).toBeDefined();
    expect(PolicyType.TIME_BASED).toBeDefined();
    expect(PolicyType.COUNT_BASED).toBeDefined();
    expect(PolicyType.MANUAL_APPROVAL).toBeDefined();
  });

  it('should provide mockAxiosResponse function', () => {
    const response = mockAxiosResponse(200, { success: true });
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ success: true });
    expect(response.statusText).toBe('OK');
  });
}); 