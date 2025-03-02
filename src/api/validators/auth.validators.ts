import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

// Validation chain for user registration
export const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
    
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
    
  /*body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  */  
  // Validate and sanitize inputs
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return error messages but with sanitized sensitive data
      const safeErrors = errors.array().map((error: any) => {
        // Return a sanitized version of the error with just the message
        return {
          msg: error.msg,
          path: error.path,
          // Don't return the actual value for security reasons
          location: error.location
        };
      });
      
      return res.status(400).json({ errors: safeErrors });
    }
    next();
  }
];

// Validation chain for user login
export const validateLogin = [
  body('usernameOrEmail')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
    
  // Validate and sanitize inputs
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return error messages but with sanitized sensitive data
      const safeErrors = errors.array().map((error: any) => {
        // Return a sanitized version of the error with just the message
        return {
          msg: error.msg,
          path: error.path,
          // Don't return the actual value for security reasons
          location: error.location
        };
      });
      
      return res.status(400).json({ errors: safeErrors });
    }
    next();
  }
]; 