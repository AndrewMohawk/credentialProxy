import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('jsonwebtoken');
const mockJwtVerify = jwt.verify as jest.Mock;

// Define mocks before using them
const mockFindUnique = jest.fn();
jest.mock('../../db/prisma', () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique
    }
  }
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn()
  }
}));

// Import after mocks are set up
import { authMiddleware } from '../../middleware/auth';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  
  // Set up process.env
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup request mock
    mockRequest = {
      headers: {}
    };
    
    // Setup response mock
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Setup next function
    mockNext = jest.fn();
    
    // Configure environment variables for tests
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'test_secret';
  });
  
  afterAll(() => {
    // Restore original env
    process.env = originalEnv;
  });
  
  test('should return 401 if no authorization header is present', async () => {
    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Authorization token is missing'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
  
  test('should return 401 if authorization header does not start with "Bearer"', async () => {
    mockRequest.headers = { authorization: 'Token xyz123' };
    
    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Authorization token is missing'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
  
  test('should return 401 if token is missing after "Bearer"', async () => {
    mockRequest.headers = { authorization: 'Bearer ' };
    
    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Authorization token is missing'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
  
  test('should return 500 if JWT_SECRET is not set in production', async () => {
    // Save original NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;
    
    // Set to production and remove JWT_SECRET
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    
    mockRequest.headers = { authorization: 'Bearer token123' };
    
    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Server configuration error'
    });
    expect(mockNext).not.toHaveBeenCalled();
    
    // Restore NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
    process.env.JWT_SECRET = 'test_secret';
  });
  
  test('should return 401 if token is invalid', async () => {
    mockRequest.headers = { authorization: 'Bearer token123' };
    mockJwtVerify.mockImplementation(() => {
      throw new Error('Invalid token');
    });
    
    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Invalid or expired token'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
  
  test('should return 401 if user is not found', async () => {
    mockRequest.headers = { authorization: 'Bearer token123' };
    mockJwtVerify.mockReturnValue({ userId: 'user-123' });
    mockFindUnique.mockResolvedValue(null);
    
    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'User not found'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
  
  test('should attach user to request and call next if token is valid', async () => {
    const user = { id: 'user-123', username: 'testuser', email: 'test@example.com' };
    
    mockRequest.headers = { authorization: 'Bearer token123' };
    mockJwtVerify.mockReturnValue({ userId: 'user-123' });
    mockFindUnique.mockResolvedValue(user);
    
    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockRequest.user).toEqual(user);
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });
  
  test('should handle server errors', async () => {
    mockRequest.headers = { authorization: 'Bearer token123' };
    
    // Simulate an error in jwt.verify
    mockJwtVerify.mockImplementation(() => {
      throw new Error('Database error');
    });
    
    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Invalid or expired token'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  // Add a new test for 500 server error
  test('should handle unexpected server errors', async () => {
    // Deliberately throw an error from outside the try/catch in the verify block
    // This will be caught by the outer try/catch
    mockRequest.headers = { authorization: 'Bearer token123' };
    
    // Create a mock that breaks before jwt.verify is called
    Object.defineProperty(mockRequest.headers, 'authorization', {
      get: function() {
        throw new Error('Unexpected error');
      }
    });
    
    await authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Server error'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
}); 