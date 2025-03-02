import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

// Schema for application creation
const createApplicationSchema = z.object({
  name: z.string().min(3, 'Application name must be at least 3 characters long'),
  publicKey: z.string().min(32, 'Public key must be at least 32 characters long'),
  description: z.string().optional(),
  callbackUrl: z.string().url('Callback URL must be a valid URL').optional(),
});

// Validate application creation request
export const validateCreateApplication = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createApplicationSchema.parse(req.body);
    // Replace request body with validated data
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      logger.warn(`Application validation failed: ${errorMessages.join(', ')}`);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errorMessages
      });
    }
    
    logger.error(`Unexpected validation error: ${error}`);
    return res.status(500).json({
      success: false,
      error: 'Server error during validation'
    });
  }
}; 