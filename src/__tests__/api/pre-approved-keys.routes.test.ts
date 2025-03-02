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

// Mock the controllers
jest.mock('../../api/controllers/preApprovedKeys.controller', () => ({
  getAllPreApprovedKeys: jest.fn((req, res) => {
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
    return res.status(200).json({ success: true, data: mockKeys });
  }),
  getPreApprovedKeyById: jest.fn((req, res) => {
    const { id } = req.params;
    if (id === 'nonexistent') {
      return res.status(404).json({ success: false, error: 'Key not found' });
    }
    const mockKey = {
      id: id,
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
    return res.status(200).json({ success: true, data: mockKey });
  }),
  createPreApprovedKey: jest.fn((req, res) => {
    const { publicKey, description } = req.body;
    
    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Public key is required'
      });
    }
    
    if (publicKey === 'existing-public-key') {
      return res.status(400).json({
        success: false,
        error: 'Public key already exists in pre-approved keys'
      });
    }
    
    const mockNewKey = {
      id: 'new-key-id',
      publicKey,
      description: description || 'New test key',
      createdById: 'test-user-id',
      used: false,
      createdAt: new Date().toISOString(),
    };
    
    return res.status(201).json({
      success: true,
      data: mockNewKey
    });
  }),
  deletePreApprovedKey: jest.fn((req, res) => {
    const { id } = req.params;
    
    if (id === 'nonexistent') {
      return res.status(404).json({
        success: false,
        error: 'Pre-approved key not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Pre-approved key deleted successfully'
    });
  }),
}));

// Mock the auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticateJWT: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Create a mock authenticated user
    req.user = { 
      id: 'test-user-id', 
      username: 'testuser', 
      email: 'test@example.com' 
    };
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
      const response = await request(app).get('/pre-approved-keys');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Check structure but ignore the actual date values
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].id).toBe('key1');
      expect(response.body.data[0].publicKey).toBe('public-key-1');
      expect(response.body.data[0].createdAt).toEqual(expect.any(String));
      expect(response.body.data[0].createdBy).toEqual({
        id: 'user1',
        username: 'admin1',
        email: 'admin1@example.com'
      });
      
      expect(response.body.data[1].id).toBe('key2');
      expect(response.body.data[1].publicKey).toBe('public-key-2');
      expect(response.body.data[1].createdAt).toEqual(expect.any(String));
      expect(response.body.data[1].createdBy).toEqual({
        id: 'user2',
        username: 'admin2',
        email: 'admin2@example.com'
      });
    });
  });

  describe('GET /pre-approved-keys/:id', () => {
    it('should return a specific pre-approved key', async () => {
      const response = await request(app).get('/pre-approved-keys/key1');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Check structure but ignore the actual date value
      expect(response.body.data.id).toBe('key1');
      expect(response.body.data.publicKey).toBe('public-key-1');
      expect(response.body.data.createdAt).toEqual(expect.any(String));
      expect(response.body.data.createdBy).toEqual({
        id: 'user1',
        username: 'admin1',
        email: 'admin1@example.com'
      });
    });
    
    it('should return 404 if key not found', async () => {
      const response = await request(app).get('/pre-approved-keys/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /pre-approved-keys', () => {
    it('should create a new pre-approved key', async () => {
      const response = await request(app)
        .post('/pre-approved-keys')
        .send({
          publicKey: 'new-public-key',
          description: 'New test key',
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      // Check structure but ignore the actual date value
      expect(response.body.data.id).toBe('new-key-id');
      expect(response.body.data.publicKey).toBe('new-public-key');
      expect(response.body.data.description).toBe('New test key');
      expect(response.body.data.createdById).toBe('test-user-id');
      expect(response.body.data.used).toBe(false);
      expect(response.body.data.createdAt).toEqual(expect.any(String));
    });
    
    it('should reject creating a key with a duplicate public key', async () => {
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
      const response = await request(app)
        .delete('/pre-approved-keys/key-to-delete');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });
    
    it('should return 404 if key to delete not found', async () => {
      const response = await request(app)
        .delete('/pre-approved-keys/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
}); 