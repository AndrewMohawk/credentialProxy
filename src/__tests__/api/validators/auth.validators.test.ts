import { Request, Response, NextFunction } from 'express';
import { validateRegistration, validateLogin } from '../../../api/validators/auth.validators';
import { validationResult } from 'express-validator';

// Mock express-validator
jest.mock('express-validator', () => {
  const originalModule = jest.requireActual('express-validator');
  
  return {
    ...originalModule,
    body: jest.fn().mockImplementation((field) => {
      return {
        trim: jest.fn().mockReturnThis(),
        isLength: jest.fn().mockReturnThis(),
        withMessage: jest.fn().mockReturnThis(),
        matches: jest.fn().mockReturnThis(),
        isEmail: jest.fn().mockReturnThis(),
        normalizeEmail: jest.fn().mockReturnThis(),
        notEmpty: jest.fn().mockReturnThis()
      };
    }),
    validationResult: jest.fn()
  };
});

describe('Auth Validators', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup request and response mocks
    mockRequest = {
      body: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockNext = jest.fn();
    
    // Default mock for validationResult (no errors)
    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
  });
  
  describe('validateRegistration', () => {
    test('should call next when validation passes', async () => {
      // Setup request with valid data
      mockRequest.body = {
        username: 'validuser',
        email: 'valid@example.com',
        password: 'ValidPassword123'
      };
      
      // Call the last middleware in the validateRegistration array (the validator function)
      await validateRegistration[validateRegistration.length - 1](
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assertions
      expect(validationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
    
    test('should return 400 with errors when validation fails', async () => {
      // Setup request with invalid data
      mockRequest.body = {
        username: 'in',
        email: 'invalid-email',
        password: 'weak'
      };
      
      // Mock validation errors
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { param: 'username', msg: 'Username must be between 3 and 30 characters' },
          { param: 'email', msg: 'Must be a valid email address' },
          { param: 'password', msg: 'Password must be at least 8 characters long' }
        ]
      });
      
      // Call the last middleware in the validateRegistration array (the validator function)
      await validateRegistration[validateRegistration.length - 1](
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assertions
      expect(validationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: [
          { param: 'username', msg: 'Username must be between 3 and 30 characters' },
          { param: 'email', msg: 'Must be a valid email address' },
          { param: 'password', msg: 'Password must be at least 8 characters long' }
        ]
      });
    });
  });
  
  describe('validateLogin', () => {
    test('should call next when validation passes', async () => {
      // Setup request with valid data
      mockRequest.body = {
        usernameOrEmail: 'validuser',
        password: 'ValidPassword123'
      };
      
      // Call the last middleware in the validateLogin array (the validator function)
      await validateLogin[validateLogin.length - 1](
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assertions
      expect(validationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
    
    test('should return 400 with errors when validation fails', async () => {
      // Setup request with missing data
      mockRequest.body = {};
      
      // Mock validation errors
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { param: 'usernameOrEmail', msg: 'Username or email is required' },
          { param: 'password', msg: 'Password is required' }
        ]
      });
      
      // Call the last middleware in the validateLogin array (the validator function)
      await validateLogin[validateLogin.length - 1](
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assertions
      expect(validationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: [
          { param: 'usernameOrEmail', msg: 'Username or email is required' },
          { param: 'password', msg: 'Password is required' }
        ]
      });
    });
  });
}); 