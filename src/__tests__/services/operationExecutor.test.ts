import { executeOperation } from '../../services/operationExecutor';
import { createTestCredential, mockDecryptedCredentialData } from '../testUtils';

// Create mock plugin functions
const mockExecuteOperation = jest.fn();
const mockGetPlugin = jest.fn();

// Create the mock plugin manager object
const mockPluginManager = {
  executeOperation: mockExecuteOperation,
  getPlugin: mockGetPlugin
};

// Mock the plugin manager module first
jest.mock('../../plugins', () => ({
  getPluginManager: jest.fn(() => mockPluginManager)
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Operation Executor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should map API_KEY credential type to api-key plugin', async () => {
    const credential = createTestCredential();
    credential.type = 'API_KEY';
    const operation = 'GET';
    const parameters = { url: '/test' };
    
    // Set up the expected return value
    const expectedResult = { status: 200, data: { result: 'success' } };
    mockExecuteOperation.mockResolvedValueOnce(expectedResult);
    
    // Execute the operation
    const result = await executeOperation(
      credential,
      operation,
      mockDecryptedCredentialData,
      parameters
    );
    
    // Verify the plugin manager was called with the correct arguments
    expect(mockExecuteOperation).toHaveBeenCalledWith(
      'api-key', // mapped plugin ID
      operation,
      mockDecryptedCredentialData,
      parameters
    );
    
    // Verify the result
    expect(result).toEqual(expectedResult);
  });
  
  it('should map OAUTH credential type to oauth plugin', async () => {
    const credential = createTestCredential();
    credential.type = 'OAUTH';
    const operation = 'REQUEST';
    const parameters = { endpoint: '/data' };
    
    // Set up the expected return value
    const expectedResult = { accessToken: 'token123' };
    mockExecuteOperation.mockResolvedValueOnce(expectedResult);
    
    // Execute the operation
    const result = await executeOperation(
      credential,
      operation,
      mockDecryptedCredentialData,
      parameters
    );
    
    // Verify the plugin manager was called with the correct arguments
    expect(mockExecuteOperation).toHaveBeenCalledWith(
      'oauth', // mapped plugin ID
      operation,
      mockDecryptedCredentialData,
      parameters
    );
    
    // Verify the result
    expect(result).toEqual(expectedResult);
  });
  
  it('should map ETHEREUM_KEY credential type to ethereum plugin', async () => {
    const credential = createTestCredential();
    credential.type = 'ETHEREUM_KEY';
    const operation = 'SIGN_MESSAGE';
    const parameters = { message: 'Hello' };
    
    // Set up the expected return value
    const expectedResult = { signature: '0x123abc' };
    mockExecuteOperation.mockResolvedValueOnce(expectedResult);
    
    // Execute the operation
    const result = await executeOperation(
      credential,
      operation,
      mockDecryptedCredentialData,
      parameters
    );
    
    // Verify the plugin manager was called with the correct arguments
    expect(mockExecuteOperation).toHaveBeenCalledWith(
      'ethereum', // mapped plugin ID
      operation,
      mockDecryptedCredentialData,
      parameters
    );
    
    // Verify the result
    expect(result).toEqual(expectedResult);
  });
  
  it('should map DATABASE credential type to database plugin', async () => {
    const credential = createTestCredential();
    credential.type = 'DATABASE';
    const operation = 'QUERY';
    const parameters = { sql: 'SELECT * FROM users' };
    
    // Set up the expected return value
    const expectedResult = { rows: [] };
    mockExecuteOperation.mockResolvedValueOnce(expectedResult);
    
    // Execute the operation
    const result = await executeOperation(
      credential,
      operation,
      mockDecryptedCredentialData,
      parameters
    );
    
    // Verify the plugin manager was called with the correct arguments
    expect(mockExecuteOperation).toHaveBeenCalledWith(
      'database', // mapped plugin ID
      operation,
      mockDecryptedCredentialData,
      parameters
    );
    
    // Verify the result
    expect(result).toEqual(expectedResult);
  });
  
  it('should use credential type as plugin ID if plugin exists', async () => {
    const credential = createTestCredential();
    credential.type = 'custom-plugin'; // custom plugin type
    const operation = 'CUSTOM_OP';
    const parameters = { param: 'value' };
    
    // Mock the plugin manager to indicate the plugin exists
    mockGetPlugin.mockReturnValueOnce({ id: 'custom-plugin' });
    
    // Set up the expected return value
    const expectedResult = { custom: true };
    mockExecuteOperation.mockResolvedValueOnce(expectedResult);
    
    // Execute the operation
    const result = await executeOperation(
      credential,
      operation,
      mockDecryptedCredentialData,
      parameters
    );
    
    // Verify the plugin manager was called with the correct arguments
    expect(mockExecuteOperation).toHaveBeenCalledWith(
      'custom-plugin', // direct plugin ID
      operation,
      mockDecryptedCredentialData,
      parameters
    );
    
    // Verify the result
    expect(result).toEqual(expectedResult);
  });
  
  it('should throw an error for unsupported credential type', async () => {
    const credential = createTestCredential();
    credential.type = 'UNSUPPORTED';
    const operation = 'GET';
    const parameters = {};
    
    // Mock the plugin manager to indicate the plugin doesn't exist
    mockGetPlugin.mockReturnValueOnce(null);
    
    // Execute the operation and expect it to throw
    await expect(
      executeOperation(
        credential,
        operation,
        mockDecryptedCredentialData,
        parameters
      )
    ).rejects.toThrow('Unsupported credential type: UNSUPPORTED');
  });
  
  it('should pass errors from plugin execution', async () => {
    const credential = createTestCredential();
    credential.type = 'API_KEY';
    const operation = 'GET';
    const parameters = {};
    
    // Mock the plugin manager to throw an error
    const errorMessage = 'Plugin execution failed';
    mockExecuteOperation.mockRejectedValueOnce(new Error(errorMessage));
    
    // Execute the operation and expect it to throw
    await expect(
      executeOperation(
        credential,
        operation,
        mockDecryptedCredentialData,
        parameters
      )
    ).rejects.toThrow(`Failed to execute operation: ${errorMessage}`);
  });
}); 