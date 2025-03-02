import express, { Express } from 'express';
import path from 'path';
import { logger } from '../utils/logger';
import { config } from '../config';
import { errorHandler } from '../middleware/errorHandler';
import { authRoutes } from '../api/routes/auth.routes';
import { credentialRoutes } from '../api/routes/credential.routes';
import { policyRoutes } from '../api/routes/policy.routes';
import { applicationRoutes } from '../api/routes/application.routes';
import { proxyRoutes } from '../api/routes/proxy.routes';
import { adminRoutes } from '../api/routes/admin.routes';
import { preApprovedKeysRoutes } from '../api/routes/pre-approved-keys.routes';
import { dashboardRoutes } from '../api/routes/dashboard.routes';
import { auditRoutes } from '../api/routes/audit.routes';

/**
 * Configure all routes for the Express application
 */
export const configureRoutes = (app: Express): void => {
  const apiPrefix = config.app.apiPrefix;
  
  // Log all API requests
  app.use(apiPrefix, (req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
  });
  
  // Public routes
  app.use(`${apiPrefix}/auth`, authRoutes);
  
  // Proxy endpoint for third-party apps
  app.use(`${apiPrefix}/proxy`, proxyRoutes);
  
  // Protected routes
  app.use(`${apiPrefix}/credentials`, credentialRoutes);
  app.use(`${apiPrefix}/policies`, policyRoutes);
  app.use(`${apiPrefix}/applications`, applicationRoutes);
  app.use(`${apiPrefix}/admin`, adminRoutes);
  app.use(`${apiPrefix}/pre-approved-keys`, preApprovedKeysRoutes);
  app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
  app.use(`${apiPrefix}/audit-logs`, auditRoutes);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  
  // Welcome page
  app.get('/', (req, res) => {
    const frontendUrl = config.app.env === 'production' 
      ? '/' 
      : config.app.frontendUrl;
      
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Credential Proxy API</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            color: #0066cc;
          }
          .message {
            background-color: #f0f0f0;
            border-left: 4px solid #0066cc;
            padding: 15px;
            margin: 20px 0;
          }
          a {
            color: #0066cc;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <h1>Credential Proxy API</h1>
        <div class="message">
          <p>This is the API server for the Credential Proxy.</p>
          <p>To access the web interface, please visit: <a href="${frontendUrl}">${frontendUrl}</a></p>
        </div>
        <p>API endpoints are available at <code>${apiPrefix}</code></p>
      </body>
      </html>
    `);
  });
  
  // Frontend static files in production
  if (config.app.env === 'production') {
    // Serve static files from the React app build directory
    const publicPath = path.join(__dirname, '..', '..', 'public');
    app.use(express.static(publicPath));

    // Serve React app for all other routes in production
    app.get('*', (req, res) => {
      res.sendFile(path.join(publicPath, 'index.html'));
    });
  } else {
    // In development, API 404 responses for non-API routes
    app.use((req, res, next) => {
      if (!req.path.startsWith(apiPrefix)) {
        res.status(404).json({ 
          message: `In development mode, please use the frontend dev server at ${config.app.frontendUrl}` 
        });
      } else {
        next();
      }
    });
  }
  
  // Error handling middleware (should be the last middleware)
  app.use(errorHandler);
}; 