import { Request, Response, NextFunction } from 'express';
import { validationResult, Result, ValidationError } from 'express-validator';
import { mockLogger } from '../../testUtils';

// Mock express-validator
jest.mock('express-validator', () => {
  const originalModule = jest.requireActual('express-validator');
  
  return {
    ...originalModule,
    body: jest.fn().mockImplementation(() => {
      return {
        exists: jest.fn().mockReturnThis(),
        withMessage: jest.fn().mockReturnThis()
      };
    }),
    validationResult: jest.fn()
  };
});

// Mock logger
jest.mock('../../../utils/logger', () => ({
  logger: mockLogger
}));

import { validateProxyRequest } from '../../../api/validators/proxy.validators';

describe('Proxy Validators', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  
  beforeEach(() => {
    mockRequest = {
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });
  
  describe('validateProxyRequest', () => {
    // Extract the validation middleware function from the array
    const validationMiddleware = validateProxyRequest[validateProxyRequest.length - 1] as (
      req: Request,
      res: Response,
      next: NextFunction
    ) => void;
    
    it('should call next() when all required fields are present and valid', () => {
      // Arrange
      mockRequest.body = {
        applicationId: 'app123',
        credentialId: 'cred123',
        operation: 'read',
        parameters: { key: 'value' },
        timestamp: new Date().toISOString(),
        signature: 'valid-signature'
      };
      
      // Create a complete mock for validationResult
      const mockValidationResult = {
        isEmpty: () => true,
        array: () => [],
        mapped: () => ({}),
        formatter: jest.fn(),
        errors: []
      } as unknown as Result<ValidationError>;
      
      // Mock validationResult to return our mock result
      (validationResult as jest.MockedFunction<typeof validationResult>).mockReturnValueOnce(mockValidationResult);
      
      // Act
      validationMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
    
    it('should return 400 if required fields are missing', () => {
      // Arrange
      mockRequest.body = {
        // Missing required fields
      };
      
      // Create a complete mock for validationResult with errors
      const mockValidationResult = {
        isEmpty: () => false,
        array: () => [{ msg: 'Field is required' }],
        mapped: () => ({ field: { msg: 'Field is required' } }),
        formatter: jest.fn(),
        errors: [{ msg: 'Field is required' }]
      } as unknown as Result<ValidationError>;
      
      // Mock validationResult to return our mock result
      (validationResult as jest.MockedFunction<typeof validationResult>).mockReturnValueOnce(mockValidationResult);
      
      // Act
      validationMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required fields'
      });
    });
    
    it('should return 400 if timestamp is expired', () => {
      // Arrange
      const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
      mockRequest.body = {
        applicationId: 'app123',
        credentialId: 'cred123',
        operation: 'read',
        parameters: { key: 'value' },
        timestamp: sixMinutesAgo,
        signature: 'valid-signature'
      };
      
      // Create a complete mock for validationResult
      const mockValidationResult = {
        isEmpty: () => true,
        array: () => [],
        mapped: () => ({}),
        formatter: jest.fn(),
        errors: []
      } as unknown as Result<ValidationError>;
      
      // Mock validationResult to return our mock result
      (validationResult as jest.MockedFunction<typeof validationResult>).mockReturnValueOnce(mockValidationResult);
      
      // Act
      validationMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Request timestamp is invalid or expired'
      });
    });
    
    it('should return 400 if timestamp is invalid', () => {
      // Arrange
      mockRequest.body = {
        applicationId: 'app123',
        credentialId: 'cred123',
        operation: 'read',
        parameters: { key: 'value' },
        timestamp: 'invalid-timestamp',
        signature: 'valid-signature'
      };
      
      // Create a complete mock for validationResult
      const mockValidationResult = {
        isEmpty: () => true,
        array: () => [],
        mapped: () => ({}),
        formatter: jest.fn(),
        errors: []
      } as unknown as Result<ValidationError>;
      
      // Mock validationResult to return our mock result
      (validationResult as jest.MockedFunction<typeof validationResult>).mockReturnValueOnce(mockValidationResult);
      
      // Act
      validationMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Request timestamp is invalid or expired'
      });
    });
  });
}); 