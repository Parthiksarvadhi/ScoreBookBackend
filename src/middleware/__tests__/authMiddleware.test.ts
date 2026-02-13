/**
 * Unit tests for authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import { authenticateToken, authorizeRole } from '../authMiddleware.js';
import { TokenService } from '../../services/tokenService.js';

describe('Authentication Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', () => {
      const userId = 'user-123';
      const role = 'scorer';
      const token = TokenService.generateAccessToken(userId, role);

      req.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticateToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(userId);
      expect(req.user?.role).toBe(role);
    });

    it('should reject request without Authorization header', () => {
      req.headers = {};

      authenticateToken(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
    });

    it('should reject request with invalid Bearer format', () => {
      req.headers = {
        authorization: 'InvalidFormat token',
      };

      authenticateToken(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject request with missing token', () => {
      req.headers = {
        authorization: 'Bearer ',
      };

      authenticateToken(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject request with invalid token', () => {
      req.headers = {
        authorization: 'Bearer invalid.token.here',
      };

      authenticateToken(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject request with tampered token', () => {
      const token = TokenService.generateAccessToken('user-123', 'scorer');
      const parts = token.split('.');
      const tamperedToken = parts[0] + '.tampered.' + parts[2];

      req.headers = {
        authorization: `Bearer ${tamperedToken}`,
      };

      authenticateToken(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('authorizeRole', () => {
    it('should allow user with authorized role', () => {
      req.user = {
        userId: 'user-123',
        role: 'admin',
      };

      const middleware = authorizeRole(['admin', 'scorer']);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject user with unauthorized role', () => {
      req.user = {
        userId: 'user-123',
        role: 'viewer',
      };

      const middleware = authorizeRole(['admin', 'scorer']);
      middleware(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject request without user', () => {
      req.user = undefined;

      const middleware = authorizeRole(['admin']);
      middleware(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should allow user with one of multiple authorized roles', () => {
      req.user = {
        userId: 'user-123',
        role: 'scorer',
      };

      const middleware = authorizeRole(['admin', 'scorer', 'viewer']);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject user with role not in authorized list', () => {
      req.user = {
        userId: 'user-123',
        role: 'guest',
      };

      const middleware = authorizeRole(['admin', 'scorer']);
      middleware(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
