/**
 * TokenService - Handles JWT token generation, validation, and extraction
 */

import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errorHandler.js';

export interface ITokenPayload {
  userId: string;
  role?: string;
}

export class TokenService {
  static JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  static ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '1hr';
  static REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';
  static ALGORITHM = 'HS256';

  /**
   * Generate an access token (short-lived)
   * @param {string} userId - User ID to include in token
   * @param {string} role - User role to include in token
   * @returns {string} JWT access token
   */
  static generateAccessToken(userId: string, role: string): string {
    try {
      const payload: ITokenPayload = {
        userId,
        role,
      };

      const token = jwt.sign(payload, this.JWT_SECRET as string, {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        algorithm: this.ALGORITHM as any,
      } as any);

      return token;
    } catch (error) {
      throw new Error(
        `Failed to generate access token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate a refresh token (long-lived)
   * @param {string} userId - User ID to include in token
   * @returns {string} JWT refresh token
   */
  static generateRefreshToken(userId: string): string {
    try {
      const payload: ITokenPayload = {
        userId,
      };

      const token = jwt.sign(payload, this.JWT_SECRET as string, {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
        algorithm: this.ALGORITHM as any,
      } as any);

      return token;
    } catch (error) {
      throw new Error(
        `Failed to generate refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify a token's signature and expiration
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   */
  static verifyToken(token: string): ITokenPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET as string, {
        algorithms: [this.ALGORITHM as any],
      });

      return decoded as ITokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw new UnauthorizedError('Token verification failed');
    }
  }

  /**
   * Extract user information from a valid token
   * @param {string} token - JWT token to extract from
   * @returns {Object} Object containing userId and role
   */
  static extractUserFromToken(token: string): ITokenPayload {
    const payload = this.verifyToken(token);
    return {
      userId: payload.userId,
      role: payload.role,
    };
  }
}
