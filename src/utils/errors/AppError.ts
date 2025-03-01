/**
 * Base application error class that extends the native Error class
 * to include HTTP status codes and operational status.
 * 
 * Operational errors represent runtime problems with requests or system
 * configuration that we anticipate and can respond to appropriately.
 * Non-operational errors are unexpected bugs that should be caught and
 * fixed in development.
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Ensures correct prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
    
    // Captures the stack trace, excluding the constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Creates an error response object for API responses
 */
export const createErrorResponse = (error: AppError | Error) => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error.message || 'An unexpected error occurred';
  
  return {
    success: false,
    error: {
      message,
      statusCode,
    }
  };
}; 