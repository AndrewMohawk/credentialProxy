import { Request, Response } from 'express';

// Define mock logger before using it in the mock
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

// Mock logger
jest.mock('../../../utils/logger', () => ({
  logger: mockLogger
}));

// Define mock functions for Prisma
const mockFindUnique = jest.fn();
const mockCreate = jest.fn();

// Mock Prisma
jest.mock('../../../db/prisma', () => ({
  prisma: {
    application: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
    },
    auditEvent: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
      create: (...args: any[]) => mockCreate(...args),
    }
  }
}));

// Mock crypto
const mockVerifyFn = jest.fn();
jest.mock('node:crypto', () => {
  return {
    createVerify: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      verify: mockVerifyFn
    }),
    constants: {
      RSA_PKCS1_PADDING: 1
    }
  };
});

// Mock policy engine
const mockEvaluateRequest = jest.fn();
jest.mock('../../../core/policies/policyEngine', () => ({
  evaluateRequest: (...args: any[]) => mockEvaluateRequest(...args),
  PolicyStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    DENIED: 'DENIED'
  }
}));

// Mock queue processor
const mockQueueProxyRequest = jest.fn();
jest.mock('../../../services/proxyQueueProcessor', () => ({
  queueProxyRequest: (...args: any[]) => mockQueueProxyRequest(...args)
}));

// Mock UUID
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid'
}));

// Now import the controller functions after mocking dependencies
import { handleProxyRequest, checkRequestStatus } from '../../../api/controllers/proxy.controller';

describe('Proxy Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('handleProxyRequest', () => {
    it('should return 400 if required fields are missing', async () => {
      // Arrange
      mockRequest.body = {
        // Missing required fields
      };

      // Act
      await handleProxyRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required fields'
      });
    });

    it('should return 400 if request timestamp is invalid or expired', async () => {
      // Arrange
      const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
      mockRequest.body = {
        applicationId: 'app123',
        credentialId: 'cred123',
        operation: 'GET',
        parameters: { test: 'value' },
        timestamp: sixMinutesAgo.getTime().toString(),
        signature: 'valid-signature'
      };

      // Act
      await handleProxyRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Request timestamp is invalid or expired'
      });
    });

    it('should return 404 if application is not found', async () => {
      // Arrange
      const currentTime = new Date();
      mockRequest.body = {
        applicationId: 'app123',
        credentialId: 'cred123',
        operation: 'GET',
        parameters: { test: 'value' },
        timestamp: currentTime.getTime().toString(),
        signature: 'valid-signature'
      };
      mockFindUnique.mockResolvedValueOnce(null);

      // Act
      await handleProxyRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'app123' },
        include: { policies: true }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Application not found'
      });
    });

    it('should return 401 if signature is invalid', async () => {
      // Arrange
      const currentTime = new Date();
      mockRequest.body = {
        applicationId: 'app123',
        credentialId: 'cred123',
        operation: 'GET',
        parameters: { test: 'value' },
        timestamp: currentTime.getTime().toString(),
        signature: 'invalid-signature'
      };
      mockFindUnique.mockResolvedValueOnce({
        id: 'app123',
        name: 'Test App',
        publicKey: 'public-key',
        policies: []
      });
      mockVerifyFn.mockReturnValueOnce(false);

      // Act
      await handleProxyRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'app123' },
        include: { policies: true }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid signature'
      });
    });

    it('should return 202 with PENDING status if policy requires manual approval', async () => {
      // Arrange
      const currentTime = new Date();
      mockRequest.body = {
        applicationId: 'app123',
        credentialId: 'cred123',
        operation: 'GET',
        parameters: { test: 'value' },
        timestamp: currentTime.getTime().toString(),
        signature: 'valid-signature'
      };
      mockFindUnique.mockResolvedValueOnce({
        id: 'app123',
        name: 'Test App',
        publicKey: 'public-key',
        policies: [
          {
            id: 'policy123',
            type: 'MANUAL_APPROVAL',
            name: 'Manual Approval',
            applicationId: 'app123',
            credentialId: 'cred123',
            configuration: {},
            isEnabled: true
          }
        ]
      });
      mockVerifyFn.mockReturnValueOnce(true);
      mockEvaluateRequest.mockResolvedValueOnce({
        status: 'PENDING',
        reason: 'Manual approval required'
      });
      mockCreate.mockResolvedValueOnce({
        id: 'mock-uuid',
        status: 'PENDING'
      });

      // Act
      await handleProxyRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'app123' },
        include: { policies: true }
      });
      expect(mockEvaluateRequest).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(202);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        status: 'PENDING',
        message: 'Request requires manual approval',
        requestId: 'mock-uuid'
      });
    });

    it('should return 202 with APPROVED status if request is approved', async () => {
      // Arrange
      const currentTime = new Date();
      mockRequest.body = {
        applicationId: 'app123',
        credentialId: 'cred123',
        operation: 'GET',
        parameters: { test: 'value' },
        timestamp: currentTime.getTime().toString(),
        signature: 'valid-signature'
      };
      mockFindUnique.mockResolvedValueOnce({
        id: 'app123',
        name: 'Test App',
        publicKey: 'public-key',
        policies: [
          {
            id: 'policy123',
            type: 'AUTO_APPROVE',
            name: 'Auto Approve',
            applicationId: 'app123',
            credentialId: 'cred123',
            configuration: {},
            isEnabled: true
          }
        ]
      });
      mockVerifyFn.mockReturnValueOnce(true);
      mockEvaluateRequest.mockResolvedValueOnce({
        status: 'APPROVED',
        reason: 'Automatically approved'
      });
      mockCreate.mockResolvedValueOnce({
        id: 'mock-uuid',
        status: 'APPROVED'
      });
      mockQueueProxyRequest.mockResolvedValueOnce(true);

      // Act
      await handleProxyRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'app123' },
        include: { policies: true }
      });
      expect(mockEvaluateRequest).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalled();
      expect(mockQueueProxyRequest).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(202);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        status: 'APPROVED',
        message: 'Request approved and queued for processing',
        requestId: 'mock-uuid'
      });
    });

    it('should return 500 if queueing fails', async () => {
      // Arrange
      const currentTime = new Date();
      mockRequest.body = {
        applicationId: 'app123',
        credentialId: 'cred123',
        operation: 'GET',
        parameters: { test: 'value' },
        timestamp: currentTime.getTime().toString(),
        signature: 'valid-signature'
      };
      mockFindUnique.mockResolvedValueOnce({
        id: 'app123',
        name: 'Test App',
        publicKey: 'public-key',
        policies: [
          {
            id: 'policy123',
            type: 'AUTO_APPROVE',
            name: 'Auto Approve',
            applicationId: 'app123',
            credentialId: 'cred123',
            configuration: {},
            isEnabled: true
          }
        ]
      });
      mockVerifyFn.mockReturnValueOnce(true);
      mockEvaluateRequest.mockResolvedValueOnce({
        status: 'APPROVED',
        reason: 'Automatically approved'
      });
      mockCreate.mockResolvedValueOnce({
        id: 'mock-uuid',
        status: 'APPROVED'
      });
      mockQueueProxyRequest.mockResolvedValueOnce(false);

      // Act
      await handleProxyRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'app123' },
        include: { policies: true }
      });
      expect(mockEvaluateRequest).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalled();
      expect(mockQueueProxyRequest).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to queue request for processing'
      });
    });

    it('should return 403 if policy denies the request', async () => {
      // Arrange
      const currentTime = new Date();
      mockRequest.body = {
        applicationId: 'app123',
        credentialId: 'cred123',
        operation: 'GET',
        parameters: { test: 'value' },
        timestamp: currentTime.getTime().toString(),
        signature: 'valid-signature'
      };
      mockFindUnique.mockResolvedValueOnce({
        id: 'app123',
        name: 'Test App',
        publicKey: 'public-key',
        policies: [
          {
            id: 'policy123',
            type: 'DENY',
            name: 'Deny Policy',
            applicationId: 'app123',
            credentialId: 'cred123',
            configuration: {},
            isEnabled: true
          }
        ]
      });
      mockVerifyFn.mockReturnValueOnce(true);
      mockEvaluateRequest.mockResolvedValueOnce({
        status: 'DENIED',
        reason: 'Policy denied'
      });
      mockCreate.mockResolvedValueOnce({
        id: 'mock-uuid',
        status: 'DENIED'
      });

      // Act
      await handleProxyRequest(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'app123' },
        include: { policies: true }
      });
      expect(mockEvaluateRequest).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        status: 'DENIED',
        message: 'Policy denied',
        requestId: 'mock-uuid'
      });
    });
  });

  describe('checkRequestStatus', () => {
    it('should return 400 if requestId is missing', async () => {
      // Arrange
      mockRequest.params = {};

      // Act
      await checkRequestStatus(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Request ID is required'
      });
    });

    it('should return 404 if request is not found', async () => {
      // Arrange
      mockRequest.params = { requestId: 'nonexistent' };
      mockFindUnique.mockResolvedValueOnce(null);

      // Act
      await checkRequestStatus(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent' }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Request not found'
      });
    });

    it('should return request status and response data if request is found', async () => {
      // Arrange
      mockRequest.params = { requestId: 'req123' };
      mockFindUnique.mockResolvedValueOnce({
        id: 'req123',
        requestStatus: 'COMPLETED',
        responseData: JSON.stringify({ result: 'success' }),
        createdAt: new Date()
      });

      // Act
      await checkRequestStatus(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'req123' }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        status: 'COMPLETED',
        response: { result: 'success' }
      }));
    });

    it('should return request status without response data if not available', async () => {
      // Arrange
      mockRequest.params = { requestId: 'req123' };
      mockFindUnique.mockResolvedValueOnce({
        id: 'req123',
        requestStatus: 'PROCESSING',
        responseData: null,
        createdAt: new Date()
      });

      // Act
      await checkRequestStatus(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'req123' }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        status: 'PROCESSING',
        response: null
      }));
    });

    it('should return 500 if an error occurs', async () => {
      // Arrange
      mockRequest.params = { requestId: 'req123' };
      mockFindUnique.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await checkRequestStatus(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'req123' }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
}); 