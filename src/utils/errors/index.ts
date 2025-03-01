import { AppError, createErrorResponse } from './AppError';

// Authentication errors
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403);
  }
}

// Input validation errors
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', validationErrors?: any) {
    super(message, 400);
    this.validationErrors = validationErrors;
  }
  
  validationErrors: any;
}

// Resource errors
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

// Request errors
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

// System errors
export class DatabaseError extends AppError {
  constructor(message = 'Database error occurred') {
    super(message, 500, false);
  }
}

export class ServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, false);
  }
}

// Export the base error type and error response creator
export { AppError, createErrorResponse }; 