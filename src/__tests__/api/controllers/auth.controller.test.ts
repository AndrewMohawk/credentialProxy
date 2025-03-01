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

// Mock bcrypt
const mockCompare = jest.fn();
const mockHash = jest.fn();
const mockGenSalt = jest.fn().mockResolvedValue(10);

jest.mock('bcrypt', () => ({
  compare: (...args: any[]) => mockCompare(...args),
  hash: (...args: any[]) => mockHash(...args),
  genSalt: (...args: any[]) => mockGenSalt(...args)
}));

// Mock jsonwebtoken
const mockSign = jest.fn().mockReturnValue('mock-token');
jest.mock('jsonwebtoken', () => ({
  sign: (...args: any[]) => mockSign(...args)
}));

// Define mock functions for Prisma
const mockFindFirst = jest.fn();
const mockFindUnique = jest.fn();
const mockCreate = jest.fn();

// Mock Prisma
jest.mock('../../../db/prisma', () => ({
  prisma: {
    user: {
      findFirst: (...args: any[]) => mockFindFirst(...args),
      findUnique: (...args: any[]) => mockFindUnique(...args),
      create: (...args: any[]) => mockCreate(...args)
    }
  }
}));

// Now import the controller functions after mocking dependencies
import { registerUser, login } from '../../../api/controllers/auth.controller';

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should return 500 if required fields are missing', async () => {
      // Arrange
      mockRequest.body = {
        // Missing required fields
      };

      // Act
      await registerUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error'
      });
    });

    it('should return 400 if user already exists', async () => {
      // Arrange
      mockRequest.body = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123'
      };
      mockFindFirst.mockResolvedValueOnce({
        id: 'user123',
        username: 'existinguser',
        email: 'existing@example.com'
      });

      // Act
      await registerUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { username: 'existinguser' },
            { email: 'existing@example.com' }
          ]
        }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User already exists'
      });
    });

    it('should create a new user and return 201 on success', async () => {
      // Arrange
      mockRequest.body = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      };
      mockFindFirst.mockResolvedValueOnce(null);
      mockHash.mockResolvedValueOnce('hashedpassword');
      mockCreate.mockResolvedValueOnce({
        id: 'user123',
        username: 'newuser',
        email: 'new@example.com'
      });

      // Act
      await registerUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { username: 'newuser' },
            { email: 'new@example.com' }
          ]
        }
      });
      expect(mockGenSalt).toHaveBeenCalledWith(10);
      expect(mockHash).toHaveBeenCalledWith('password123', 10);
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          username: 'newuser',
          email: 'new@example.com',
          passwordHash: 'hashedpassword'
        }
      });
      expect(mockSign).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
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
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error'
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return 400 if required fields are missing', async () => {
      // Arrange
      mockRequest.body = {
        // Missing required fields
      };

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials'
      });
    });

    it('should return 400 if user is not found', async () => {
      // Arrange
      mockRequest.body = {
        username: 'nonexistentuser',
        password: 'password123'
      };
      mockFindUnique.mockResolvedValueOnce(null);

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { username: 'nonexistentuser' }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials'
      });
    });

    it('should return 400 if password is incorrect', async () => {
      // Arrange
      mockRequest.body = {
        username: 'existinguser',
        password: 'wrongpassword'
      };
      mockFindUnique.mockResolvedValueOnce({
        id: 'user123',
        username: 'existinguser',
        passwordHash: 'hashedpassword'
      });
      mockCompare.mockResolvedValueOnce(false);

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { username: 'existinguser' }
      });
      expect(mockCompare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials'
      });
    });

    it('should return 200 and a token on successful login', async () => {
      // Arrange
      mockRequest.body = {
        username: 'existinguser',
        password: 'correctpassword'
      };
      mockFindUnique.mockResolvedValueOnce({
        id: 'user123',
        username: 'existinguser',
        passwordHash: 'hashedpassword'
      });
      mockCompare.mockResolvedValueOnce(true);

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { username: 'existinguser' }
      });
      expect(mockCompare).toHaveBeenCalledWith('correctpassword', 'hashedpassword');
      expect(mockSign).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        token: 'mock-token'
      });
    });

    it('should return 500 if an error occurs during login', async () => {
      // Arrange
      mockRequest.body = {
        username: 'existinguser',
        password: 'password123'
      };
      mockFindUnique.mockRejectedValueOnce(new Error('Database error'));

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error'
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
}); 