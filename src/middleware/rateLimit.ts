import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../utils/errors';
import { config } from '../config';

/**
 * Create rate limiters for different API endpoints
 */

// Standard API rate limiter (most endpoints)
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    next(new RateLimitError('Too many requests, please try again later'));
  }
});

// More restrictive rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new RateLimitError('Too many login attempts, please try again later'));
  }
});

// Rate limiter for proxy requests
export const proxyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new RateLimitError('Too many proxy requests, please try again later'));
  }
});

// For development environment, we may want to disable rate limiting
export const configureRateLimiting = () => {
  if (config.app.env === 'development' && process.env.ENABLE_RATE_LIMIT !== 'true') {
    // Return empty middleware functions that just call next()
    return {
      standardLimiter: (req: any, res: any, next: any) => next(),
      authLimiter: (req: any, res: any, next: any) => next(),
      proxyLimiter: (req: any, res: any, next: any) => next(),
    };
  }
  
  // In production or if explicitly enabled in development, return the real limiters
  return {
    standardLimiter,
    authLimiter,
    proxyLimiter,
  };
}; 