import express from 'express';
import { handleProxyRequest, checkRequestStatus } from '../controllers/proxy.controller';
import { validateProxyRequest } from '../validators/proxy.validators';
import { authMiddleware } from '../../middleware/auth';

// Create the router
export const proxyRoutes = express.Router();

// Validate the request and handle proxy request
proxyRoutes.post('/', validateProxyRequest, handleProxyRequest);

// Check the status of a request
proxyRoutes.get('/status/:requestId', authMiddleware, checkRequestStatus); 