// Mock dependencies
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn().mockReturnValue({ id: 'user-123', username: 'testuser' })
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    }
  }
}));

// Mock the logger utility
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock the authentication middleware
jest.mock('../../../src/middleware/auth', () => ({
  authenticateJWT: (req: any, res: any, next: () => void) => next()
}));

// Mock the auth controller
jest.mock('../../api/controllers/auth.controller', () => ({
  login: jest.fn((req, res) => {
    const { usernameOrEmail, password } = req.body;
    
    // Mock user lookup
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      passwordHash: 'hashed-password',
      role: 'admin'
    };
    
    // Check credentials
    if (usernameOrEmail === 'testuser' && password === 'password123') {
      return res.status(200).json({
        success: true,
        token: 'mock-token'
      });
    } else {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  }),
  logout: jest.fn((req, res) => {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }),
  registerUser: jest.fn(),
  getPasskeyRegistrationOptions: jest.fn(),
  verifyPasskeyRegistration: jest.fn(),
  getPasskeyAuthOptions: jest.fn(),
  verifyPasskeyAuth: jest.fn()
}));

// Import dependencies after mocks
import request from 'supertest';
import express from 'express';
import { authRoutes } from '../../api/routes/auth.routes';
import { prisma } from '../../db/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as authController from '../../api/controllers/auth.controller';

describe('Auth Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
  });

  describe('POST /auth/login', () => {
    test('should return token for valid credentials', async () => {
      // Make login request
      const response = await request(app)
        .post('/auth/login')
        .send({ usernameOrEmail: 'testuser', password: 'password123' })
        .expect(200);
      
      // Verify response
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBe('mock-token');
      
      // Verify controller was called
      expect(authController.login).toHaveBeenCalled();
    });

    test('should reject invalid credentials', async () => {
      // Make login request with wrong password
      const response = await request(app)
        .post('/auth/login')
        .send({ usernameOrEmail: 'testuser', password: 'wrong-password' })
        .expect(401);
      
      // Verify response
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      
      // Verify controller was called
      expect(authController.login).toHaveBeenCalled();
    });

    test('should handle non-existent user', async () => {
      // Make login request with non-existent user
      const response = await request(app)
        .post('/auth/login')
        .send({ usernameOrEmail: 'nonexistent', password: 'any-password' })
        .expect(401);
      
      // Verify response
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      
      // Verify controller was called
      expect(authController.login).toHaveBeenCalled();
    });
  });
}); 