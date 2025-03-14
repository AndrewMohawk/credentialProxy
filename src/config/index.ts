/**
 * Centralized configuration module for Credential Proxy
 * This file collects all environment variables and configuration settings
 * to provide a single source of truth for application configuration.
 */
import dotenv from 'dotenv';

// Load environment variables from .env file if not already loaded
if (!process.env.NODE_ENV) {
  dotenv.config();
}

/**
 * Application configuration object
 */
export const config = {
  app: {
    name: 'Credential Proxy',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '4242', 10),
    host: process.env.HOST || 'localhost',
    frontendPort: parseInt(process.env.FRONTEND_PORT || '3000', 10),
    frontendHost: process.env.FRONTEND_HOST || 'localhost',
    frontendUrl: process.env.FRONTEND_URL || `http://${process.env.FRONTEND_HOST || 'localhost'}:${parseInt(process.env.FRONTEND_PORT || '3000', 10)}`,
    apiPrefix: '/api/v1',
  },
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5430/credential_proxy',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6380', 10),
    password: process.env.REDIS_PASSWORD || '',
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380', 10),
      password: process.env.REDIS_PASSWORD || '',
    },
  },
  
  security: {
    encryption: {
      key: process.env.ENCRYPTION_KEY || (process.env.NODE_ENV !== 'production' ? 'dev_encryption_key_change_in_production' : ''),
      algorithm: 'aes-256-gcm',
      keyLength: 32, // 256 bits
      saltLength: 16,
      ivLength: 12,
      authTagLength: 16,
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
    requestTimestampValidityWindow: 300, // 5 minutes in seconds
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    silent: process.env.NODE_ENV === 'test',
  },
  
  monitoring: {
    metricsEnabled: process.env.METRICS_ENABLED === 'true',
    metricsPath: process.env.METRICS_PATH || '/metrics',
  },

  queue: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
  
  applications: {
    // Allow applications to register themselves without admin approval
    allowAutoRegistration: process.env.ALLOW_AUTO_REGISTRATION === 'true' || false,
    // Default status for auto-registered applications: pending, active, inactive
    autoRegistrationDefaultStatus: process.env.AUTO_REGISTRATION_DEFAULT_STATUS || 'pending',
    // Enable auto-approval for applications with pre-approved public keys
    enablePreApprovedKeys: process.env.ENABLE_PRE_APPROVED_KEYS === 'true' || true,
    // Whether pre-approved keys should be one-time use only
    preApprovedKeysOneTimeUse: process.env.PRE_APPROVED_KEYS_ONE_TIME_USE === 'true' || true,
    // Default expiration time for pre-approved keys in days (null means no expiration)
    preApprovedKeysExpirationDays: process.env.PRE_APPROVED_KEYS_EXPIRATION_DAYS 
      ? parseInt(process.env.PRE_APPROVED_KEYS_EXPIRATION_DAYS, 10) 
      : 30,
  },
}; 