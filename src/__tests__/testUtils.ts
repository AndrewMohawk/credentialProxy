import fs from 'fs';
import path from 'path';
import { CredentialPlugin, RiskAssessment, OperationMetadata, PolicyConfig as PluginPolicyConfig } from '../plugins/CredentialPlugin';

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

// Define the PolicyConfig interface for testing
export interface PolicyConfig {
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
      return this.supportedOperations.find(op => op.name === operation)?.riskLevel || this.riskAssessment.baseScore;
    }
  };
  
  supportedOperations: OperationMetadata[] = [
    {
      name: 'TEST_OPERATION',
      description: 'A test operation',
      requiredParams: ['param1'],
      optionalParams: ['param2'],
      riskLevel: 3,
      applicablePolicies: [
        PolicyType.ALLOW_LIST,
        PolicyType.DENY_LIST,
        PolicyType.COUNT_BASED
      ],
      recommendedPolicies: [PolicyType.ALLOW_LIST],
      suggestedRateLimits: {
        perMinute: 10,
        perHour: 100,
        perDay: 1000
      }
    },
  ];
  
  supportedPolicies: PluginPolicyConfig[] = [
    {
      type: PolicyType.ALLOW_LIST,
      description: 'Allow specific operations',
      defaultConfig: {},
    },
  ];
  
  async validateCredential(credentialData: Record<string, any>): Promise<string | null> {
    if (!credentialData.username) {
      return 'Missing username';
    }
    if (!credentialData.password) {
      return 'Missing password';
    }
    return null;
  }
  
  async executeOperation(
    operation: string,
    credentialData: Record<string, any>,
    parameters: Record<string, any>
  ): Promise<any> {
    if (operation === 'TEST_OPERATION') {
      return {
        success: true,
        data: {
          operation,
          credentials: credentialData,
          parameters,
        },
      };
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
      issues: [],
      recommendations: [],
      lastChecked: new Date()
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