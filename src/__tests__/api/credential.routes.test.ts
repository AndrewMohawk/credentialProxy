// Mock dependencies
jest.mock('../../middleware/auth', () => ({
  authenticateJWT: jest.fn((req, res, next) => {
    req.user = {
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com'
    };
    next();
  })
}));

jest.mock('../../db/prisma', () => ({
  prisma: {
    credential: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Import dependencies after mocks
import request from 'supertest';
import express from 'express';
import { credentialRoutes } from '../../api/routes/credential.routes';
import { prisma } from '../../db/prisma';
import { authenticateJWT } from '../../middleware/auth';

describe('Credential Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use('/credentials', credentialRoutes);
  });

  describe('GET /credentials', () => {
    test('should get all credentials for an application', async () => {
      const mockCredentials = [
        { id: 'cred-1', name: 'Credential 1', type: 'API_KEY' },
        { id: 'cred-2', name: 'Credential 2', type: 'OAUTH' }
      ];

      (prisma.credential.findMany as jest.Mock).mockResolvedValue(mockCredentials);

      const response = await request(app)
        .get('/credentials?applicationId=app-123')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCredentials);
      expect(prisma.credential.findMany).toHaveBeenCalledWith({
        where: { 
          userId: 'test-user-id',
          applications: {
            some: {
              id: 'app-123'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    });

    test('should get all credentials for a user when no applicationId is provided', async () => {
      const mockCredentials = [
        { id: 'cred-1', name: 'Credential 1', type: 'API_KEY' },
        { id: 'cred-2', name: 'Credential 2', type: 'OAUTH' }
      ];

      (prisma.credential.findMany as jest.Mock).mockResolvedValue(mockCredentials);

      const response = await request(app)
        .get('/credentials')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCredentials);
      expect(prisma.credential.findMany).toHaveBeenCalledWith({
        where: { 
          userId: 'test-user-id'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    });
  });

  describe('GET /credentials/:id', () => {
    test('should get a specific credential by ID', async () => {
      const mockCredential = { 
        id: 'cred-123', 
        name: 'Test Credential',
        type: 'API_KEY',
        data: { apiKey: 'secret-key' }
      };

      (prisma.credential.findUnique as jest.Mock).mockResolvedValue(mockCredential);

      const response = await request(app)
        .get('/credentials/cred-123')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCredential);
      expect(prisma.credential.findUnique).toHaveBeenCalledWith({
        where: { id: 'cred-123' }
      });
    });

    test('should return 404 for non-existent credential', async () => {
      (prisma.credential.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/credentials/non-existent')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /credentials', () => {
    test('should create a new credential', async () => {
      const newCredential = { 
        name: 'New Credential',
        type: 'API_KEY',
        data: { apiKey: 'new-key' },
        applicationId: 'app-123'
      };

      const createdCredential = { 
        id: 'new-cred-123', 
        ...newCredential
      };

      (prisma.credential.create as jest.Mock).mockResolvedValue(createdCredential);

      const response = await request(app)
        .post('/credentials')
        .send(newCredential)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdCredential);
      expect(prisma.credential.create).toHaveBeenCalledWith({
        data: expect.objectContaining(newCredential)
      });
    });
  });
}); 