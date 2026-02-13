/**
 * Custom Error Classes for Match Management
 */

/**
 * LockConflictError
 * Thrown when a scorer attempts to lock a match already locked by another scorer
 * HTTP Status: 409
 */
export class LockConflictError extends Error {
  public statusCode: number = 409;
  public code: string = 'LOCK_CONFLICT';
  public details: Record<string, any>;

  constructor(message: string, details: Record<string, any> = {}) {
    super(message);
    this.name = 'LockConflictError';
    this.details = details;
  }
}

/**
 * ScorerAlreadyActiveError
 * Thrown when a scorer attempts to lock a match while already scoring another match
 * HTTP Status: 409
 */
export class ScorerAlreadyActiveError extends Error {
  public statusCode: number = 409;
  public code: string = 'SCORER_ALREADY_ACTIVE';
  public details: Record<string, any>;

  constructor(message: string, details: Record<string, any> = {}) {
    super(message);
    this.name = 'ScorerAlreadyActiveError';
    this.details = details;
  }
}

/**
 * InvalidStatusError
 * Thrown when a match is not in the required status for an operation
 * HTTP Status: 400
 */
export class InvalidStatusError extends Error {
  public statusCode: number = 400;
  public code: string = 'INVALID_MATCH_STATUS';
  public details: Record<string, any>;

  constructor(message: string, details: Record<string, any> = {}) {
    super(message);
    this.name = 'InvalidStatusError';
    this.details = details;
  }
}

/**
 * UnauthorizedError
 * Thrown when a user is not the lock holder or lacks permission
 * HTTP Status: 401
 */
export class UnauthorizedError extends Error {
  public statusCode: number = 401;
  public code: string = 'UNAUTHORIZED';
  public details: Record<string, any>;

  constructor(message: string, details: Record<string, any> = {}) {
    super(message);
    this.name = 'UnauthorizedError';
    this.details = details;
  }
}

/**
 * InsufficientPermissionsError
 * Thrown when a user lacks the required role for an operation
 * HTTP Status: 403
 */
export class InsufficientPermissionsError extends Error {
  public statusCode: number = 403;
  public code: string = 'INSUFFICIENT_PERMISSIONS';
  public details: Record<string, any>;

  constructor(message: string, details: Record<string, any> = {}) {
    super(message);
    this.name = 'InsufficientPermissionsError';
    this.details = details;
  }
}

/**
 * LockAcquisitionFailedError
 * Thrown when a database transaction fails during lock acquisition
 * HTTP Status: 500
 */
export class LockAcquisitionFailedError extends Error {
  public statusCode: number = 500;
  public code: string = 'LOCK_ACQUISITION_FAILED';
  public details: Record<string, any>;

  constructor(message: string, details: Record<string, any> = {}) {
    super(message);
    this.name = 'LockAcquisitionFailedError';
    this.details = details;
  }
}

/**
 * NotFoundError
 * Thrown when a resource is not found
 * HTTP Status: 404
 */
export class NotFoundError extends Error {
  public statusCode: number = 404;
  public code: string = 'NOT_FOUND';
  public details: Record<string, any>;

  constructor(message: string, details: Record<string, any> = {}) {
    super(message);
    this.name = 'NotFoundError';
    this.details = details;
  }
}

/**
 * ValidationError
 * Thrown when input validation fails
 * HTTP Status: 400
 */
export class ValidationError extends Error {
  public statusCode: number = 400;
  public code: string = 'VALIDATION_ERROR';
  public details: Record<string, any>;

  constructor(message: string, details: Record<string, any> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}
