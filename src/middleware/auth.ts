import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
      };
    }
  }
}

/**
 * Middleware to validate JWT tokens and attach user to request
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authorization token is missing' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ message: 'Authorization token is missing' });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev_jwt_secret_change_in_production' : '');
    
    if (!JWT_SECRET) {
      logger.error('JWT_SECRET environment variable is not set');
      res.status(500).json({ message: 'Server configuration error' });
      return;
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, email: true }
      });
      
      if (!user) {
        res.status(401).json({ message: 'User not found' });
        return;
      }
      
      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      logger.error(`JWT verification error: ${error}`);
      res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    logger.error(`Authentication middleware error: ${error}`);
    res.status(500).json({ message: 'Server error' });
  }
}; 