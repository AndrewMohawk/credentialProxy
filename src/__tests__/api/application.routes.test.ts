import request from 'supertest';
import express from 'express';
import { prisma } from '../../db/prisma';
import { authMiddleware } from '../../middleware/auth';

// Mock dependencies
jest.mock('../../middleware/auth', () => ({
  authMiddleware: jest.fn((req, res, next) => next())
}));

jest.mock('../../db/prisma', () => ({
  prisma: {
    application: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Import the routes after mocking
import { applicationRoutes } from '../../api/routes/application.routes';

describe('Application Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use('/applications', applicationRoutes);
  });

  describe('GET /applications', () => {
    test('should get all applications', async () => {
      const mockApplications = [
        { id: 'app-1', name: 'Application 1' },
        { id: 'app-2', name: 'Application 2' }
      ];
      
      (prisma.application.findMany as jest.Mock).mockResolvedValue(mockApplications);

      const response = await request(app)
        .get('/applications')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockApplications);
      expect(prisma.application.findMany).toHaveBeenCalled();
    });

    test('should handle database errors', async () => {
      (prisma.application.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/applications')
        .expect(500);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /applications/:id', () => {
    test('should get an application by ID', async () => {
      const mockApplication = { id: 'app-123', name: 'Test Application' };
      
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(mockApplication);

      const response = await request(app)
        .get('/applications/app-123')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockApplication);
      expect(prisma.application.findUnique).toHaveBeenCalledWith({
        where: { id: 'app-123' },
        include: expect.any(Object)
      });
    });

    test('should return 404 for non-existent application', async () => {
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/applications/non-existent')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /applications', () => {
    test('should create a new application', async () => {
      const newApplication = { 
        name: 'New Application',
        description: 'Test description'
      };
      
      const createdApplication = { 
        id: 'new-app-123',
        ...newApplication,
        createdAt: new Date().toISOString()
      };
      
      (prisma.application.create as jest.Mock).mockResolvedValue(createdApplication);

      const response = await request(app)
        .post('/applications')
        .send(newApplication)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(createdApplication);
      expect(prisma.application.create).toHaveBeenCalledWith({
        data: expect.objectContaining(newApplication)
      });
    });
  });
}); 