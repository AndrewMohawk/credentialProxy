import { applicationRoutes } from '../../api/routes/application.routes';
import express from 'express';
import request from 'supertest';
import { prisma } from '../../db/prisma';
import { config } from '../../config';

// Mock the Prisma client
jest.mock('../../db/prisma', () => ({
  prisma: {
    application: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditEvent: {
      create: jest.fn(),
    },
    credential: {
      findFirst: jest.fn(),
    },
    preApprovedPublicKey: {
      findFirst: jest.fn(),
      update: jest.fn(),
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

// Define ApplicationStatus enum for testing
enum ApplicationStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  REVOKED = 'REVOKED',
}

describe('Application Routes', () => {
  let app: express.Express;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create an Express app for testing
    app = express();
    app.use(express.json());
    app.use('/applications', applicationRoutes);
  });

  describe('GET /applications', () => {
    it('should return all applications', async () => {
      const mockApplications = [
        { id: '1', name: 'App 1', publicKey: 'key1', status: ApplicationStatus.ACTIVE },
        { id: '2', name: 'App 2', publicKey: 'key2', status: ApplicationStatus.PENDING },
      ];
      
      (prisma.application.findMany as jest.Mock).mockResolvedValue(mockApplications);
      
      const response = await request(app).get('/applications');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockApplications);
    });
  });

  describe('POST /applications/register-self', () => {
    it('should register a new application when auto-registration is enabled', async () => {
      // Override config for this test
      const originalAllowAutoRegistration = config.applications.allowAutoRegistration;
      const originalDefaultStatus = config.applications.autoRegistrationDefaultStatus;
      config.applications.allowAutoRegistration = true;
      config.applications.autoRegistrationDefaultStatus = 'pending';
      
      const mockApplication = {
        id: 'new-app-id',
        name: 'New App',
        publicKey: 'new-key',
        status: ApplicationStatus.PENDING,
        secret: 'generated-secret',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.application.create as jest.Mock).mockResolvedValue(mockApplication);
      (prisma.auditEvent.create as jest.Mock).mockResolvedValue({});
      (prisma.preApprovedPublicKey.findFirst as jest.Mock).mockResolvedValue(null);
      
      const response = await request(app)
        .post('/applications/register-self')
        .send({
          name: 'New App',
          publicKey: 'new-key',
          description: 'Test application',
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expect.objectContaining({
        id: 'new-app-id',
        name: 'New App',
        publicKey: 'new-key',
        status: ApplicationStatus.PENDING,
      }));
      expect(response.body.data.secret).toBeDefined();
      
      // Restore original config
      config.applications.allowAutoRegistration = originalAllowAutoRegistration;
      config.applications.autoRegistrationDefaultStatus = originalDefaultStatus;
    });
    
    it('should automatically approve registration when the public key is pre-approved', async () => {
      // Override config for this test
      const originalAllowAutoRegistration = config.applications.allowAutoRegistration;
      const originalEnablePreApprovedKeys = config.applications.enablePreApprovedKeys;
      const originalOneTimeUse = config.applications.preApprovedKeysOneTimeUse;
      
      config.applications.allowAutoRegistration = true;
      config.applications.enablePreApprovedKeys = true;
      config.applications.preApprovedKeysOneTimeUse = true;
      
      const mockPreApprovedKey = {
        id: 'pre-approved-key-id',
        publicKey: 'pre-approved-key',
        description: 'Pre-approved key for testing',
        createdById: 'admin-id',
        used: false,
        expiresAt: new Date(Date.now() + 86400000), // Tomorrow
        createdAt: new Date(),
      };
      
      const mockApplication = {
        id: 'new-app-id',
        name: 'New App',
        publicKey: 'pre-approved-key',
        status: ApplicationStatus.ACTIVE, // Should be ACTIVE since it's pre-approved
        secret: 'generated-secret',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.preApprovedPublicKey.findFirst as jest.Mock).mockResolvedValue(mockPreApprovedKey);
      (prisma.application.create as jest.Mock).mockResolvedValue(mockApplication);
      (prisma.preApprovedPublicKey.update as jest.Mock).mockResolvedValue({ ...mockPreApprovedKey, used: true, usedByApplication: 'new-app-id' });
      (prisma.auditEvent.create as jest.Mock).mockResolvedValue({});
      
      const response = await request(app)
        .post('/applications/register-self')
        .send({
          name: 'New App',
          publicKey: 'pre-approved-key',
          description: 'Test application',
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expect.objectContaining({
        id: 'new-app-id',
        name: 'New App',
        publicKey: 'pre-approved-key',
        status: ApplicationStatus.ACTIVE, // Should be ACTIVE since it's pre-approved
      }));
      expect(response.body.data.secret).toBeDefined();
      
      // Verify the pre-approved key was marked as used
      expect(prisma.preApprovedPublicKey.update).toHaveBeenCalledWith({
        where: { id: 'pre-approved-key-id' },
        data: {
          used: true,
          usedByApplication: 'new-app-id'
        }
      });
      
      // Restore original config
      config.applications.allowAutoRegistration = originalAllowAutoRegistration;
      config.applications.enablePreApprovedKeys = originalEnablePreApprovedKeys;
      config.applications.preApprovedKeysOneTimeUse = originalOneTimeUse;
    });
    
    it('should not use pre-approved key if it has expired', async () => {
      // Override config for this test
      const originalAllowAutoRegistration = config.applications.allowAutoRegistration;
      const originalEnablePreApprovedKeys = config.applications.enablePreApprovedKeys;
      const originalDefaultStatus = config.applications.autoRegistrationDefaultStatus;
      
      config.applications.allowAutoRegistration = true;
      config.applications.enablePreApprovedKeys = true;
      config.applications.autoRegistrationDefaultStatus = 'pending';
      
      // Create an expired pre-approved key
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday
      
      const mockPreApprovedKey = {
        id: 'pre-approved-key-id',
        publicKey: 'expired-key',
        description: 'Expired pre-approved key',
        createdById: 'admin-id',
        used: false,
        expiresAt: expiredDate,
        createdAt: new Date(),
      };
      
      const mockApplication = {
        id: 'new-app-id',
        name: 'New App',
        publicKey: 'expired-key',
        status: ApplicationStatus.PENDING, // Should be PENDING since the key is expired
        secret: 'generated-secret',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (prisma.preApprovedPublicKey.findFirst as jest.Mock).mockResolvedValue(null); // Simulating expired key not found
      (prisma.application.create as jest.Mock).mockResolvedValue(mockApplication);
      (prisma.auditEvent.create as jest.Mock).mockResolvedValue({});
      
      const response = await request(app)
        .post('/applications/register-self')
        .send({
          name: 'New App',
          publicKey: 'expired-key',
          description: 'Test application',
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expect.objectContaining({
        id: 'new-app-id',
        name: 'New App',
        publicKey: 'expired-key',
        status: ApplicationStatus.PENDING, // Should be PENDING since the key is expired
      }));
      
      // Restore original config
      config.applications.allowAutoRegistration = originalAllowAutoRegistration;
      config.applications.enablePreApprovedKeys = originalEnablePreApprovedKeys;
      config.applications.autoRegistrationDefaultStatus = originalDefaultStatus;
    });
    
    it('should reject registration when auto-registration is disabled', async () => {
      // Override config for this test
      const originalAllowAutoRegistration = config.applications.allowAutoRegistration;
      config.applications.allowAutoRegistration = false;
      
      const response = await request(app)
        .post('/applications/register-self')
        .send({
          name: 'New App',
          publicKey: 'new-key',
        });
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Auto-registration is disabled');
      
      // Restore original config
      config.applications.allowAutoRegistration = originalAllowAutoRegistration;
    });
  });

  describe('POST /applications/:id/approve', () => {
    it('should approve a pending application', async () => {
      const mockApplication = {
        id: 'app-id',
        name: 'Pending App',
        publicKey: 'key',
        status: ApplicationStatus.PENDING,
      };
      
      const updatedApplication = {
        ...mockApplication,
        status: ApplicationStatus.ACTIVE,
      };
      
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(mockApplication);
      (prisma.application.update as jest.Mock).mockResolvedValue(updatedApplication);
      (prisma.auditEvent.create as jest.Mock).mockResolvedValue({});
      
      const response = await request(app)
        .post('/applications/app-id/approve');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedApplication);
    });
    
    it('should reject approval for non-pending applications', async () => {
      const mockApplication = {
        id: 'app-id',
        name: 'Active App',
        publicKey: 'key',
        status: ApplicationStatus.ACTIVE,
      };
      
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(mockApplication);
      
      const response = await request(app)
        .post('/applications/app-id/approve');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Only pending applications can be approved');
    });
  });

  describe('POST /applications/revoke-credential', () => {
    it('should revoke a credential from an application', async () => {
      const mockApplication = {
        id: 'app-id',
        name: 'Test App',
        publicKey: 'key',
        status: ApplicationStatus.ACTIVE,
        secret: 'app-secret',
      };
      
      const mockCredential = {
        id: 'cred-id',
        name: 'Test Credential',
      };
      
      (prisma.application.findUnique as jest.Mock).mockResolvedValue(mockApplication);
      (prisma.credential.findFirst as jest.Mock).mockResolvedValue(mockCredential);
      (prisma.application.update as jest.Mock).mockResolvedValue({});
      (prisma.auditEvent.create as jest.Mock).mockResolvedValue({});
      
      const response = await request(app)
        .post('/applications/revoke-credential')
        .send({
          applicationId: 'app-id',
          credentialId: 'cred-id',
          secret: 'app-secret',
          reason: 'No longer needed',
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Credential revoked successfully');
    });
  });
}); 