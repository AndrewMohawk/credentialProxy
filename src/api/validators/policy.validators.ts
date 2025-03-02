import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

// Schema for policy creation
const policySchema = z.object({
  name: z.string().min(3, 'Policy name must be at least 3 characters long'),
  description: z.string().optional(),
  rules: z.array(z.any()).optional(),
  isActive: z.boolean().optional().default(true)
});

// Validate policy creation request
export const validateCreatePolicy = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = policySchema.parse(req.body);
    // Replace request body with validated data
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      logger.warn(`Policy creation validation failed: ${errorMessages.join(', ')}`);
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

// Validate policy update request
export const validateUpdatePolicy = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // We use partial here to make all fields optional for updates
    const updatePolicySchema = policySchema.partial();
    const validatedData = updatePolicySchema.parse(req.body);
    // Replace request body with validated data
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      logger.warn(`Policy update validation failed: ${errorMessages.join(', ')}`);
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