/**
 * Authentication middleware for token validation and role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/tokenService.js';
import { ForbiddenError, UnauthorizedError, formatErrorResponse, getErrorStatusCode } from '../utils/errorHandler.js';

/**
 * Extend Express Request to include user information
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role?: string;
      };
    }
  }
}

/**
 * Middleware to authenticate JWT token from Authorization header
 * Extracts token from "Bearer <token>" format and validates it
 * Attaches user info to req.user if valid
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader) {
      throw new UnauthorizedError('Missing Authorization header');
    }

    // Check Bearer prefix
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid Authorization header format. Expected: Bearer <token>');
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      throw new UnauthorizedError('Missing token in Authorization header');
    }

    // Verify token
    const payload = TokenService.verifyToken(token);

    // Attach user info to request
    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    next();
  } catch (error) {
    const statusCode = getErrorStatusCode(error as Error);
    const errorResponse = formatErrorResponse(error as Error);
    res.status(statusCode).json(errorResponse);
  }
};

/**
 * Middleware factory to authorize based on user role
 * @param allowedRoles - Array of roles that are allowed to access the endpoint
 * @returns Middleware function
 */
export const authorizeRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.user.role || '')) {
        throw new ForbiddenError('Insufficient permissions for this resource');
      }

      next();
    } catch (error) {
      const statusCode = getErrorStatusCode(error as Error);
      const errorResponse = formatErrorResponse(error as Error);
      res.status(statusCode).json(errorResponse);
    }
  };
};
