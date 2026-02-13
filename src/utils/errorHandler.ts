/**
 * Error handler utility for consistent error response formatting
 */

export class AppError extends Error {
  public code: string;
  public statusCode: number;
  public details: Record<string, any> | null;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details: Record<string, any> | null = null
  ) {
    super(message);
    this.code = code;
    this.message = message;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: Record<string, any> | null = null) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class DuplicateEmailError extends AppError {
  constructor() {
    super('DUPLICATE_EMAIL', 'Email already registered', 409);
    this.name = 'DuplicateEmailError';
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    this.name = 'InvalidCredentialsError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Invalid or expired token') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Insufficient permissions for this resource') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super('NOT_FOUND', message, 404);
    this.name = 'NotFoundError';
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'An unexpected error occurred') {
    super('INTERNAL_SERVER_ERROR', message, 500);
    this.name = 'InternalServerError';
  }
}

/**
 * Formats error response for API responses
 * @param {Error} error - Error object
 * @returns {Object} Formatted error response
 */
export const formatErrorResponse = (error: Error): Record<string, any> => {
  if (error instanceof AppError) {
    const response: Record<string, any> = {
      error: {
        code: error.code,
        message: error.message,
      },
    };
    if (error.details) {
      response.error.details = error.details;
    }
    return response;
  }

  // Handle unexpected errors
  console.error('Unexpected error:', error);
  return {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  };
};

/**
 * Gets HTTP status code from error
 * @param {Error} error - Error object
 * @returns {number} HTTP status code
 */
export const getErrorStatusCode = (error: Error): number => {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return 500;
};
