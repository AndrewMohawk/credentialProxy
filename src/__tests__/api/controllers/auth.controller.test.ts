import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../db/prisma';
import { registerUser, login } from '../../../api/controllers/auth.controller';

// Define mock logger before using it in the mock
jest.mock('../../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock the modules
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../../db/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn()
    },
    auditEvent: {
      create: jest.fn()
    }
  }
}));

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockFindFirst: jest.Mock;
  let mockFindUnique: jest.Mock;
  let mockCreate: jest.Mock;
  let mockHash: jest.Mock;
  let mockCompare: jest.Mock;
  let mockSign: jest.Mock;
  let statusCode: number;
  let responseBody: any;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup request and response mocks
    mockRequest = {
      body: {}
    };
    
    statusCode = 0;
    responseBody = null;
    
    mockResponse = {
      status: jest.fn().mockImplementation((code) => {
        statusCode = code;
        return mockResponse;
      }),
      json: jest.fn().mockImplementation((body) => {
        responseBody = body;
        return mockResponse;
      })
    };
    
    // Setup database mocks
    mockFindFirst = jest.fn();
    mockFindUnique = jest.fn();
    mockCreate = jest.fn();
    
    // Setup bcrypt mocks
    mockHash = jest.fn();
    mockCompare = jest.fn();
    
    // Setup jwt mock
    mockSign = jest.fn();
    
    // Mock the modules
    (prisma.user.findFirst as jest.Mock) = mockFindFirst;
    (prisma.user.findUnique as jest.Mock) = mockFindUnique;
    (prisma.user.create as jest.Mock) = mockCreate;
    (prisma.auditEvent.create as jest.Mock) = jest.fn().mockResolvedValue({});
    (bcrypt.hash as jest.Mock) = mockHash;
    (bcrypt.genSalt as jest.Mock) = jest.fn().mockResolvedValue(10);
    (bcrypt.compare as jest.Mock) = mockCompare;
    (jwt.sign as jest.Mock) = mockSign;
  });

  describe('registerUser', () => {
    it('should return 500 if required fields are missing', async () => {
      // Arrange
      mockRequest.body = {}; // Empty body

      // Act
      await registerUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusCode).toBe(500);
      expect(responseBody).toEqual({
        success: false,
        error: 'Server error during registration. Please try again later.'
      });
    });

    it('should return 500 if user already exists', async () => {
      // Arrange
      mockRequest.body = {
        username: 'existinguser',
        password: 'password123',
        email: 'existing@example.com'
      };
      mockFindFirst.mockResolvedValue({
        id: 'user-123',
        username: 'existinguser',
        email: 'existing@example.com'
      } as any);

      // Act
      await registerUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusCode).toBe(500);
      expect(responseBody).toEqual({
        success: false,
        error: 'User with this username or email already exists'
      });
    });

    it('should return 201 and token on successful registration', async () => {
      // Arrange
      mockRequest.body = {
        username: 'newuser',
        password: 'password123',
        email: 'newuser@example.com'
      };

      mockFindFirst.mockResolvedValue(null);
      mockHash.mockResolvedValue('hashedpassword');
      mockCreate.mockResolvedValue({
        id: 'user-123',
        username: 'newuser',
        email: 'newuser@example.com'
      } as any);
      mockSign.mockReturnValue('mock-token');

      // Act
      await registerUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindFirst).toHaveBeenCalled();
      expect(mockHash).toHaveBeenCalledWith('password123', 10);
      expect(mockCreate).toHaveBeenCalled();
      expect(mockSign).toHaveBeenCalled();
      expect(statusCode).toBe(201);
      expect(responseBody).toEqual({
        success: true,
        token: 'mock-token'
      });
    });

    it('should return 500 if an error occurs during registration', async () => {
      // Arrange
      mockRequest.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      };
      mockFindFirst.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await registerUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusCode).toBe(500);
      expect(responseBody).toEqual({
        success: false,
        error: 'Server error during registration. Please try again later.'
      });
      // Verify logger was called with the error
      expect(require('../../../utils/logger').logger.error).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    beforeEach(() => {
      // Reset status and response for each test
      statusCode = 0;
      responseBody = null;
      
      // Setup mocks for login tests
      mockRequest.body = {};
      mockFindUnique.mockReset();
      mockCompare.mockReset();
      mockSign.mockReset();
    });

    it('should return 500 if required fields are missing', async () => {
      // Arrange
      mockRequest.body = {}; // Empty body

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusCode).toBe(500);
      expect(responseBody).toEqual({
        success: false,
        error: 'Server error during login. Please try again later.'
      });
    });

    it('should return 500 if user not found', async () => {
      // Arrange
      mockRequest.body = {
        username: 'nonexistentuser',
        password: 'password123'
      };
      mockFindUnique.mockResolvedValue(null);

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusCode).toBe(500);
      expect(responseBody).toEqual({
        success: false,
        error: 'Invalid username or password'
      });
    });

    it('should return 500 if password is incorrect', async () => {
      // Arrange
      mockRequest.body = {
        username: 'testuser',
        password: 'wrongpassword'
      };
      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        username: 'testuser',
        passwordHash: 'hashedpassword'
      } as any);
      mockCompare.mockResolvedValue(false);

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(mockCompare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
      expect(statusCode).toBe(500);
      expect(responseBody).toEqual({
        success: false,
        error: 'Invalid username or password'
      });
    });

    it('should return 200 and token if login successful', async () => {
      // Arrange
      mockRequest.body = {
        username: 'testuser',
        password: 'password123'
      };

      mockFindUnique.mockResolvedValue({
        id: 'user-123',
        username: 'testuser',
        passwordHash: 'hashedpassword'
      } as any);
      mockCompare.mockResolvedValue(true);
      mockSign.mockReturnValue('mock-token');

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(mockCompare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(mockSign).toHaveBeenCalled();
      expect(statusCode).toBe(200);
      expect(responseBody).toEqual({
        success: true,
        token: 'mock-token'
      });
    });

    it('should return 500 if an error occurs during login', async () => {
      // Arrange
      mockRequest.body = {
        username: 'testuser',
        password: 'password123'
      };
      mockFindUnique.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusCode).toBe(500);
      expect(responseBody).toEqual({
        success: false,
        error: 'Server error'
      });
      // Verify logger was called with the error
      expect(require('../../../utils/logger').logger.error).toHaveBeenCalled();
    });
  });
}); 