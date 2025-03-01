import { Request, Response, NextFunction } from 'express';
import { 
  standardLimiter, 
  authLimiter, 
  proxyLimiter, 
  configureRateLimiting 
} from '../../middleware/rateLimit';
import { AppError } from '../../utils/errors';

// Mock express-rate-limit
jest.mock('express-rate-limit', () => {
  return jest.fn().mockImplementation((options) => {
    return (req: any, res: any, next: any) => {
      // Call the handler directly with the provided options
      if (options.handler) {
        options.handler(req, res, next);
      } else {
        next();
      }
    };
  });
});

// Mock config
jest.mock('../../config', () => ({
  config: {
    app: {
      env: 'test'
    }
  }
}));

describe('Rate Limit Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  
  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  describe('standardLimiter', () => {
    test('should pass RateLimitError to next function when rate limit is exceeded', () => {
      standardLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Too many requests, please try again later'
        })
      );
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(AppError);
    });
  });
  
  describe('authLimiter', () => {
    test('should pass RateLimitError to next function when auth rate limit is exceeded', () => {
      authLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Too many login attempts, please try again later'
        })
      );
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(AppError);
    });
  });
  
  describe('proxyLimiter', () => {
    test('should pass RateLimitError to next function when proxy rate limit is exceeded', () => {
      proxyLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Too many proxy requests, please try again later'
        })
      );
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(AppError);
    });
  });
  
  describe('configureRateLimiting', () => {
    test('should return real limiters in production environment', () => {
      // Mock production environment
      jest.resetModules();
      jest.mock('../../config', () => ({
        config: {
          app: {
            env: 'production'
          }
        }
      }));
      
      // Re-import to use production config
      const { configureRateLimiting: prodConfigureRateLimiting } = require('../../middleware/rateLimit');
      
      const limiters = prodConfigureRateLimiting();
      
      // Call one of the limiters to verify it's the real one
      limiters.standardLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Too many requests')
        })
      );
    });
    
    test('should return pass-through limiters in development environment', () => {
      // Mock development environment with rate limiting disabled
      jest.resetModules();
      jest.mock('../../config', () => ({
        config: {
          app: {
            env: 'development'
          }
        }
      }));
      
      // Mock process.env
      const originalEnv = process.env;
      process.env = { ...originalEnv, ENABLE_RATE_LIMIT: 'false' };
      
      // Re-import to use development config
      const { configureRateLimiting: devConfigureRateLimiting } = require('../../middleware/rateLimit');
      
      const limiters = devConfigureRateLimiting();
      
      // Call one of the limiters to verify it just calls next()
      limiters.standardLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext.mock.calls[0][0]).toBeUndefined();
      
      // Restore env
      process.env = originalEnv;
    });
    
    test('should return real limiters in development if ENABLE_RATE_LIMIT is true', () => {
      // Mock development environment with rate limiting enabled
      jest.resetModules();
      jest.mock('../../config', () => ({
        config: {
          app: {
            env: 'development'
          }
        }
      }));
      
      // Mock process.env
      const originalEnv = process.env;
      process.env = { ...originalEnv, ENABLE_RATE_LIMIT: 'true' };
      
      // Re-import to use development config with rate limiting enabled
      const { configureRateLimiting: devConfigureRateLimiting } = require('../../middleware/rateLimit');
      
      const limiters = devConfigureRateLimiting();
      
      // Call one of the limiters to verify it's the real one
      limiters.standardLimiter(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Too many requests')
        })
      );
      
      // Restore env
      process.env = originalEnv;
    });
  });
}); 