import { Request, Response, NextFunction } from 'express';
import { ValidationError as ExpressValidatorError } from 'express-validator';
import { AppError, ValidationError, createErrorResponse } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Global error handling middleware
 * This catches all errors thrown in the application and formats them
 * into a consistent API response format
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default to 500 server error if status code is not set
  let statusCode = 500;
  let errorMessage = 'Internal server error';
  let validationErrors = undefined;
  
  // Handle express-validator validation errors
  if (Array.isArray(err) && err.length > 0 && 'param' in err[0] && 'msg' in err[0]) {
    // These are express-validator errors
    const errors = err as any[];
    statusCode = 400;
    errorMessage = 'Validation failed';
    validationErrors = errors.map(error => ({
      param: error.param,
      message: error.msg,
      location: error.location,
    }));
  } 
  // Handle our custom AppError instances
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
    
    // Handle validation errors specifically
    if (err instanceof ValidationError && err.validationErrors) {
      validationErrors = err.validationErrors;
    }
  }
  
  // Log the error
  if (statusCode >= 500) {
    logger.error(`Unhandled error: ${err.message}`);
    logger.error(err.stack);
  } else {
    logger.warn(`Error: ${err.message}`);
  }
  
  // Create error response object
  const errorResponse = {
    success: false,
    error: {
      message: errorMessage,
      ...(validationErrors && { validationErrors }),
      // Only include stack trace in development mode and for server errors
      ...(config.app.env === 'development' && statusCode >= 500 && { stack: err.stack }),
    }
  };
  
  // Send response
  res.status(statusCode).json(errorResponse);
}; 