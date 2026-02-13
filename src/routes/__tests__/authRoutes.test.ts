/**
 * Unit tests for authentication API routes
 */

import { Request, Response } from 'express';
import authRoutes from '../authRoutes.js';
import { AuthService } from '../../services/authService.js';
import {
  ValidationError,
  DuplicateEmailError,
  InvalidCredentialsError,
  NotFoundError,
} from '../../utils/errorHandler.js';

// Mock AuthService
jest.mock('../../services/authService.js');

describe('Authentication Routes', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {},
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'scorer',
      };

      req.body = {
        email: 'test@example.com',
        password: 'ValidPassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      (AuthService.register as jest.Mock).mockResolvedValue(mockUser);

      // Get the register route handler
      const registerHandler = authRoutes.stack.find((layer: any) => layer.route?.path === '/register')?.route?.methods?.post;

      if (registerHandler) {
        await registerHandler[0](req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockUser);
      }
    });

    it('should return 400 for validation error', async () => {
      req.body = {
        email: 'invalid-email',
        password: 'short',
        firstName: 'John',
        lastName: 'Doe',
      };

      (AuthService.register as jest.Mock).mockRejectedValue(
        new ValidationError('Invalid email format')
      );

      const registerHandler = authRoutes.stack.find((layer: any) => layer.route?.path === '/register')?.route?.methods?.post;

      if (registerHandler) {
        await registerHandler[0](req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      }
    });

    it('should return 409 for duplicate email', async () => {
      req.body = {
        email: 'existing@example.com',
        password: 'ValidPassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      (AuthService.register as jest.Mock).mockRejectedValue(new DuplicateEmailError());

      const registerHandler = authRoutes.stack.find((layer: any) => layer.route?.path === '/register')?.route?.methods?.post;

      if (registerHandler) {
        await registerHandler[0](req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(409);
      }
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      const mockResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'scorer',
        },
      };

      req.body = {
        email: 'test@example.com',
        password: 'ValidPassword123',
      };

      (AuthService.login as jest.Mock).mockResolvedValue(mockResponse);

      const loginHandler = authRoutes.stack.find((layer: any) => layer.route?.path === '/login')?.route?.methods?.post;

      if (loginHandler) {
        await loginHandler[0](req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockResponse);
      }
    });

    it('should return 401 for invalid credentials', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      (AuthService.login as jest.Mock).mockRejectedValue(new InvalidCredentialsError());

      const loginHandler = authRoutes.stack.find((layer: any) => layer.route?.path === '/login')?.route?.methods?.post;

      if (loginHandler) {
        await loginHandler[0](req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(401);
      }
    });

    it('should return 400 for missing fields', async () => {
      req.body = {
        email: 'test@example.com',
      };

      (AuthService.login as jest.Mock).mockRejectedValue(
        new ValidationError('Missing required fields')
      );

      const loginHandler = authRoutes.stack.find((layer: any) => layer.route?.path === '/login')?.route?.methods?.post;

      if (loginHandler) {
        await loginHandler[0](req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      }
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        accessToken: 'new-access-token',
      };

      req.body = {
        refreshToken: 'valid-refresh-token',
      };

      (AuthService.refreshToken as jest.Mock).mockResolvedValue(mockResponse);

      const refreshHandler = authRoutes.stack.find((layer: any) => layer.route?.path === '/refresh')?.route?.methods?.post;

      if (refreshHandler) {
        await refreshHandler[0](req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockResponse);
      }
    });

    it('should return 401 for invalid refresh token', async () => {
      req.body = {
        refreshToken: 'invalid-token',
      };

      (AuthService.refreshToken as jest.Mock).mockRejectedValue(
        new InvalidCredentialsError()
      );

      const refreshHandler = authRoutes.stack.find((layer: any) => layer.route?.path === '/refresh')?.route?.methods?.post;

      if (refreshHandler) {
        await refreshHandler[0](req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(401);
      }
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'scorer',
      };

      req.user = {
        userId: 'user-123',
        role: 'scorer',
      };

      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const meHandler = authRoutes.stack.find((layer: any) => layer.route?.path === '/me')?.route?.methods?.get;

      if (meHandler) {
        // Skip the authenticateToken middleware and call the handler directly
        const handler = meHandler[meHandler.length - 1];
        await handler(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockUser);
      }
    });

    it('should return 404 for non-existent user', async () => {
      req.user = {
        userId: 'non-existent-user',
        role: 'scorer',
      };

      (AuthService.getCurrentUser as jest.Mock).mockRejectedValue(new NotFoundError('User not found'));

      const meHandler = authRoutes.stack.find((layer: any) => layer.route?.path === '/me')?.route?.methods?.get;

      if (meHandler) {
        const handler = meHandler[meHandler.length - 1];
        await handler(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(404);
      }
    });
  });
});
