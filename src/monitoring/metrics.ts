import { Express, Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import { logger } from '../utils/logger';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Define custom metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const credentialAccessCounter = new client.Counter({
  name: 'credential_access_total',
  help: 'Total number of credential access attempts',
  labelNames: ['credential_type', 'application', 'status'],
});

const policyEvaluationCounter = new client.Counter({
  name: 'policy_evaluation_total',
  help: 'Total number of policy evaluations',
  labelNames: ['policy_type', 'result'],
});

// Register custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);
register.registerMetric(credentialAccessCounter);
register.registerMetric(policyEvaluationCounter);

// Middleware to measure request duration
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Record the response when it completes
  res.on('finish', () => {
    const durationInSeconds = (Date.now() - start) / 1000;
    
    // Get the route pattern (e.g., '/api/v1/users/:id' instead of '/api/v1/users/123')
    const route = req.route ? req.route.path : req.path;
    
    // Record metrics
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode.toString())
      .observe(durationInSeconds);
    
    httpRequestCounter
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });
  
  next();
};

// Metrics functions
export const recordCredentialAccess = (credentialType: string, application: string, status: string) => {
  credentialAccessCounter.labels(credentialType, application, status).inc();
};

export const recordPolicyEvaluation = (policyType: string, result: string) => {
  policyEvaluationCounter.labels(policyType, result).inc();
};

// Setup metrics endpoint
export const setupMetrics = (app: Express) => {
  logger.info('Setting up metrics endpoint');
  
  app.use(metricsMiddleware);
  
  // Metrics endpoint
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      logger.error(`Error generating metrics: ${error}`);
      res.status(500).end();
    }
  });
}; 