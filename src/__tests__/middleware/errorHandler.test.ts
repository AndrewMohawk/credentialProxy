import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../middleware/errorHandler';
import { 
  AppError, 
  BadRequestError, 
  AuthenticationError,
  AuthorizationError, 
  NotFoundError, 
  ServerError 
} from '../../utils/errors';

// Mock the logger to prevent actual logging during tests
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Mock config
jest.mock('../../config', () => ({
  config: {
    app: {
      env: 'test'
    }
  }
}));

describe('Error Handler Middleware', () => {
  // Mock request, response, and next function
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create fresh mocks for each test
    mockRequest = {};
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockNext = jest.fn();
  });

  test('should handle AppError with correct status code and message', () => {
    const error = new AppError('Test error message', 418);
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(418);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Test error message'
      }
    });
  });

  test('should handle BadRequestError with 400 status code', () => {
    const error = new BadRequestError('Bad request error');
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Bad request error'
      }
    });
  });

  test('should handle AuthenticationError with 401 status code', () => {
    const error = new AuthenticationError('Authentication error');
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Authentication error'
      }
    });
  });

  test('should handle AuthorizationError with 403 status code', () => {
    const error = new AuthorizationError('Authorization error');
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Authorization error'
      }
    });
  });

  test('should handle NotFoundError with 404 status code', () => {
    const error = new NotFoundError('Not found error');
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Not found error'
      }
    });
  });

  test('should handle ServerError with 500 status code', () => {
    const error = new ServerError('Server error');
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Server error'
      }
    });
  });

  test('should handle non-operational errors with generic message in production', () => {
    // Mock production environment
    jest.resetModules();
    jest.mock('../../config', () => ({
      config: {
        app: {
          env: 'production'
        }
      }
    }));
    
    // Re-import errorHandler to use the production config
    const { errorHandler: prodErrorHandler } = require('../../middleware/errorHandler');
    
    const error = new Error('Some internal error');
    
    prodErrorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Internal server error'
      }
    });
  });

  test('should handle non-operational errors with detailed message in development', () => {
    // Mock development environment
    jest.resetModules();
    jest.mock('../../config', () => ({
      config: {
        app: {
          env: 'development'
        }
      }
    }));
    
    // Re-import errorHandler to use the development config
    const { errorHandler: devErrorHandler } = require('../../middleware/errorHandler');
    
    const error = new Error('Some internal error');
    
    devErrorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Internal server error',
          stack: expect.any(String)
        })
      })
    );
  });

  test('should handle errors with stacktrace in development', () => {
    // Mock development environment
    jest.resetModules();
    jest.mock('../../config', () => ({
      config: {
        app: {
          env: 'development'
        }
      }
    }));
    
    // Re-import errorHandler to use the development config
    const { errorHandler: devErrorHandler } = require('../../middleware/errorHandler');
    
    const error = new ServerError('Internal server error');
    
    devErrorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Internal server error',
          stack: expect.any(String)
        })
      })
    );
  });
}); 