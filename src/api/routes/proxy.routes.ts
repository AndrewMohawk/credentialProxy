import express from 'express';
import { handleProxyRequest, checkRequestStatus } from '../controllers/proxy.controller';
import { authenticateJWT } from '../../middleware/auth';
import { validateProxyRequest } from '../validators/proxy.validators';

// Create the router
const proxyRoutes = express.Router();

// Route for proxy requests
proxyRoutes.post('/', validateProxyRequest, handleProxyRequest);

// Route for checking request status
proxyRoutes.get('/status/:requestId', authenticateJWT, checkRequestStatus);

export { proxyRoutes }; 