import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '../../utils/logger';

/**
 * Generic validation middleware factory for Express
 * @param schema The Zod schema to validate against
 * @returns An Express middleware function that validates request data
 */
export const validate = (schema: AnyZodObject) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    
    // Update request with validated data
    req.body = validatedData.body;
    req.query = validatedData.query;
    req.params = validatedData.params;
    
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      logger.warn(`Validation failed: ${errorMessages.join(', ')}`);
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