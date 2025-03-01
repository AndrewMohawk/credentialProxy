import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { stream } from '../utils/logger';
import { errorHandler } from '../middleware/errorHandler';
import { configureRateLimiting } from '../middleware/rateLimit';
import { config } from '../config';

/**
 * Configure all middleware for the Express application
 */
export const configureMiddleware = (app: Express): void => {
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
      },
    },
    // Additional security headers
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'same-origin' },
  }));

  // CORS middleware
  app.use(cors({
    origin: config.app.frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging middleware
  app.use(morgan('combined', { stream }));

  // Trust proxy - important when behind a reverse proxy that handles HTTPS
  app.set('trust proxy', 1);

  // Configure rate limiting based on environment
  const { standardLimiter, authLimiter, proxyLimiter } = configureRateLimiting();

  // Apply rate limiting to routes
  app.use(`${config.app.apiPrefix}/auth`, authLimiter);
  app.use(`${config.app.apiPrefix}/proxy`, proxyLimiter);
  app.use(`${config.app.apiPrefix}`, standardLimiter);
}; 