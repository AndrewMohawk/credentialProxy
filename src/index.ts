import { logger } from './utils/logger';
import { config } from './config';
import { container } from './services/container';

// Check for required environment variables in production
if (config.app.env === 'production') {
  const requiredEnvVars = [
    'DATABASE_URL',
    'REDIS_HOST',
    'REDIS_PORT',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
  ];
  
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );
  
  if (missingEnvVars.length > 0) {
    logger.error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
    process.exit(1);
  }
  
  logger.info('All required environment variables are set');
}

// Export commonly used services for convenience
export const prisma = container.get('db');

// Display startup information
logger.info(`Starting Credential Proxy in ${config.app.env} mode`);

// Import server (which starts the application)
import './server'; 