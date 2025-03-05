import { Request, Response, NextFunction } from 'express';

/**
 * Authentication middleware for protecting API routes
 * Verifies that requests include valid authentication credentials
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // In a real application, this would verify tokens, session cookies, etc.
  // For the prototype, we'll simply check for a token header or auth cookie
  
  const authHeader = req.headers.authorization;
  const sessionCookie = req.cookies?.session;
  
  // Skip auth for the demo or development environment
  if (process.env.NODE_ENV === 'development' || process.env.SKIP_AUTH === 'true') {
    return next();
  }
  
  if (!authHeader && !sessionCookie) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be authenticated to access this resource'
    });
  }
  
  // In a real implementation, we would verify the token/cookie here
  // and set user information on the request object
  // req.user = { id: '123', role: 'admin' };
  
  next();
}; 