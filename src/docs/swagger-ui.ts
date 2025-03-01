import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Configure Swagger UI for API documentation
 * @param app Express application
 */
export const setupSwagger = (app: Express): void => {
  // Disable Swagger UI in production if needed
  if (process.env.DISABLE_SWAGGER_IN_PRODUCTION === 'true' && config.app.env === 'production') {
    logger.info('Swagger UI is disabled in production');
    return;
  }

  // Define Swagger UI options
  const swaggerUIOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Credential Proxy API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true, // Persist auth info during page refresh
      docExpansion: 'none', // Keep all sections collapsed by default
      filter: true, // Enable filtering of operations
      tagsSorter: 'alpha', // Sort tags alphabetically
      operationsSorter: 'alpha', // Sort operations alphabetically
    },
  };

  // Set up Swagger UI endpoint
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUIOptions));

  // Serve the Swagger definition as JSON for client-side tools
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  logger.info('Swagger UI is available at /api-docs');
}; 