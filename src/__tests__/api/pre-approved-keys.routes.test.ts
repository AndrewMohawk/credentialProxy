import { preApprovedKeysRoutes } from '../../api/routes/pre-approved-keys.routes';
import express from 'express';
import request from 'supertest';
import { prisma } from '../../db/prisma';

// Mock the Prisma client
jest.mock('../../db/prisma', () => ({
  prisma: {
    preApprovedPublicKey: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    auditEvent: {
      create: jest.fn(),
    },
  },
}));

// Mock the auth middleware
jest.mock('../../middleware/auth', () => ({
  authMiddleware: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    req.user = { id: 'test-user-id', username: 'testuser', email: 'test@example.com' };
    next();
  },
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Pre-Approved Keys Routes', () => {
  let app: express.Express;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create an Express app for testing
    app = express();
    app.use(express.json());
    app.use('/pre-approved-keys', preApprovedKeysRoutes);
  });

  describe('GET /pre-approved-keys', () => {
    it('should return all pre-approved keys', async () => {
      const mockKeys = [
        {
          id: 'key1',
          publicKey: 'public-key-1',
          description: 'Test key 1',
          createdById: 'user1',
          used: false,
          createdAt: new Date().toISOString(),
          createdBy: {
            id: 'user1',
            username: 'admin1',
            email: 'admin1@example.com'
          }
        },
        {
          id: 'key2',
          publicKey: 'public-key-2',
          description: 'Test key 2',
          createdById: 'user2',
          used: true,
          usedByApplication: 'app1',
          createdAt: new Date().toISOString(),
          createdBy: {
            id: 'user2',
            username: 'admin2',
            email: 'admin2@example.com'
          }
        },
      ];
      
      (prisma.preApprovedPublicKey.findMany as jest.Mock).mockResolvedValue(mockKeys);
      
      const response = await request(app).get('/pre-approved-keys');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockKeys);
    });
  });

  describe('GET /pre-approved-keys/:id', () => {
    it('should return a specific pre-approved key', async () => {
      const mockKey = {
        id: 'key1',
        publicKey: 'public-key-1',
        description: 'Test key 1',
        createdById: 'user1',
        used: false,
        createdAt: new Date().toISOString(),
        createdBy: {
          id: 'user1',
          username: 'admin1',
          email: 'admin1@example.com'
        }
      };
      
      (prisma.preApprovedPublicKey.findUnique as jest.Mock).mockResolvedValue(mockKey);
      
      const response = await request(app).get('/pre-approved-keys/key1');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockKey);
    });
    
    it('should return 404 if key not found', async () => {
      (prisma.preApprovedPublicKey.findUnique as jest.Mock).mockResolvedValue(null);
      
      const response = await request(app).get('/pre-approved-keys/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /pre-approved-keys', () => {
    it('should create a new pre-approved key', async () => {
      const mockNewKey = {
        id: 'new-key-id',
        publicKey: 'new-public-key',
        description: 'New test key',
        createdById: 'test-user-id',
        used: false,
        createdAt: new Date().toISOString(),
      };
      
      (prisma.preApprovedPublicKey.findFirst as jest.Mock).mockResolvedValue(null); // No duplicate
      (prisma.preApprovedPublicKey.create as jest.Mock).mockResolvedValue(mockNewKey);
      (prisma.auditEvent.create as jest.Mock).mockResolvedValue({});
      
      const response = await request(app)
        .post('/pre-approved-keys')
        .send({
          publicKey: 'new-public-key',
          description: 'New test key',
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockNewKey);
    });
    
    it('should reject creating a key with a duplicate public key', async () => {
      const existingKey = {
        id: 'existing-key-id',
        publicKey: 'existing-public-key',
        description: 'Existing key',
        createdById: 'other-user-id',
        used: false,
        createdAt: new Date(),
      };
      
      (prisma.preApprovedPublicKey.findFirst as jest.Mock).mockResolvedValue(existingKey);
      
      const response = await request(app)
        .post('/pre-approved-keys')
        .send({
          publicKey: 'existing-public-key',
          description: 'Duplicate public key',
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
    
    it('should reject creating a key without a public key', async () => {
      const response = await request(app)
        .post('/pre-approved-keys')
        .send({
          description: 'Missing public key',
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });
  });

  describe('DELETE /pre-approved-keys/:id', () => {
    it('should delete a pre-approved key', async () => {
      const mockKey = {
        id: 'key-to-delete',
        publicKey: 'public-key-to-delete',
        description: 'Key to delete',
        createdById: 'user1',
        used: false,
        createdAt: new Date(),
      };
      
      (prisma.preApprovedPublicKey.findUnique as jest.Mock).mockResolvedValue(mockKey);
      (prisma.preApprovedPublicKey.delete as jest.Mock).mockResolvedValue(mockKey);
      (prisma.auditEvent.create as jest.Mock).mockResolvedValue({});
      
      const response = await request(app)
        .delete('/pre-approved-keys/key-to-delete');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });
    
    it('should return 404 if key to delete not found', async () => {
      (prisma.preApprovedPublicKey.findUnique as jest.Mock).mockResolvedValue(null);
      
      const response = await request(app)
        .delete('/pre-approved-keys/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
}); 