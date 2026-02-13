/**
 * Authentication Middleware
 * Verifies JWT token and extracts user information
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IAuthRequest } from '../types/index.js';

/**
 * Authentication Middleware
 * Verifies JWT token and extracts user information
 */
export function authenticateToken(req: IAuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token is required',
      },
    });
    return;
  }

  try {
    const secret = (process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
    console.log('🔐 Verifying token with secret:', secret.substring(0, 10) + '...');
    const decoded = jwt.verify(token, secret);
    req.user = decoded as any;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired access token',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
    });
  }
}

/**
 * Authorization Middleware
 * Verifies user has required role
 */
export function authorizeRole(...roles: string[]) {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!roles.includes(req.user.role || '')) {
      res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `This action requires one of the following roles: ${roles.join(', ')}`,
          details: {
            requiredRoles: roles,
            userRole: req.user.role,
          },
        },
      });
      return;
    }

    next();
  };
}

/**
 * Optional Authentication Middleware
 * Attempts to authenticate but doesn't fail if token is missing
 */
export function optionalAuthenticateToken(req: IAuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const secret = (process.env.JWT_SECRET || 'your-secret-key');
    const decoded = jwt.verify(token, secret);
    req.user = decoded as any;
  } catch (error) {
    console.warn('Invalid token provided:', error instanceof Error ? error.message : 'Unknown error');
  }

  next();
}
