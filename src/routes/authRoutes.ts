/**
 * Authentication API routes
 */

import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { authenticateToken } from '../middleware/auth.js';
import { formatErrorResponse, getErrorStatusCode } from '../utils/errorHandler.js';
import { IAuthRequest } from '../types/index.js';

const router = Router();

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    const user = await AuthService.register({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
    });

    res.status(201).json(user);
  } catch (error) {
    const statusCode = getErrorStatusCode(error as Error);
    const errorResponse = formatErrorResponse(error as Error);
    res.status(statusCode).json(errorResponse);
  }
});

/**
 * POST /auth/login
 * Login user and return tokens
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await AuthService.login({
      email,
      password,
    });

    res.status(200).json(result);
  } catch (error) {
    const statusCode = getErrorStatusCode(error as Error);
    const errorResponse = formatErrorResponse(error as Error);
    res.status(statusCode).json(errorResponse);
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    const result = await AuthService.refreshToken({
      refreshToken,
    });

    res.status(200).json(result);
  } catch (error) {
    const statusCode = getErrorStatusCode(error as Error);
    const errorResponse = formatErrorResponse(error as Error);
    res.status(statusCode).json(errorResponse);
  }
});

/**
 * GET /auth/me
 * Get current user information (protected route)
 */
router.get('/me', authenticateToken as any, async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const user = await AuthService.getCurrentUser(req.user.userId);

    res.status(200).json(user);
  } catch (error) {
    const statusCode = getErrorStatusCode(error as Error);
    const errorResponse = formatErrorResponse(error as Error);
    res.status(statusCode).json(errorResponse);
  }
});

/**
 * PUT /auth/me
 * Update current user profile
 */
router.put('/me', authenticateToken as any, async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { firstName, lastName, phoneNumber, fcmToken } = req.body;
    const user = await AuthService.updateUser(req.user.userId, {
      firstName,
      lastName,
      phoneNumber,
      fcmToken
    });

    res.status(200).json(user);
  } catch (error) {
    const statusCode = getErrorStatusCode(error as Error);
    const errorResponse = formatErrorResponse(error as Error);
    res.status(statusCode).json(errorResponse);
  }
});

export default router;
