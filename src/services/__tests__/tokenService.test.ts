/**
 * Unit tests for TokenService
 */

import { TokenService, TokenPayload } from '../tokenService.js';
import { UnauthorizedError } from '../../utils/errorHandler.js';

describe('TokenService', () => {
  const testUserId = 'test-user-id-123';
  const testRole = 'scorer';

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = TokenService.generateAccessToken(testUserId, testRole);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should generate different tokens for different calls', () => {
      const token1 = TokenService.generateAccessToken(testUserId, testRole);
      const token2 = TokenService.generateAccessToken(testUserId, testRole);

      expect(token1).not.toBe(token2); // Different tokens due to iat
    });

    it('should include userId and role in token payload', () => {
      const token = TokenService.generateAccessToken(testUserId, testRole);
      const payload = TokenService.verifyToken(token);

      expect(payload.userId).toBe(testUserId);
      expect(payload.role).toBe(testRole);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = TokenService.generateRefreshToken(testUserId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should include userId in token payload', () => {
      const token = TokenService.generateRefreshToken(testUserId);
      const payload = TokenService.verifyToken(token);

      expect(payload.userId).toBe(testUserId);
    });

    it('should not include role in refresh token', () => {
      const token = TokenService.generateRefreshToken(testUserId);
      const payload = TokenService.verifyToken(token);

      expect(payload.role).toBeUndefined();
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid access token', () => {
      const token = TokenService.generateAccessToken(testUserId, testRole);
      const payload = TokenService.verifyToken(token);

      expect(payload).toBeDefined();
      expect(payload.userId).toBe(testUserId);
      expect(payload.role).toBe(testRole);
    });

    it('should verify a valid refresh token', () => {
      const token = TokenService.generateRefreshToken(testUserId);
      const payload = TokenService.verifyToken(token);

      expect(payload).toBeDefined();
      expect(payload.userId).toBe(testUserId);
    });

    it('should throw UnauthorizedError for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => TokenService.verifyToken(invalidToken)).toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for tampered token', () => {
      const token = TokenService.generateAccessToken(testUserId, testRole);
      const parts = token.split('.');
      const tamperedToken = parts[0] + '.tampered.' + parts[2];

      expect(() => TokenService.verifyToken(tamperedToken)).toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for empty token', () => {
      expect(() => TokenService.verifyToken('')).toThrow(UnauthorizedError);
    });
  });

  describe('extractUserFromToken', () => {
    it('should extract userId and role from valid token', () => {
      const token = TokenService.generateAccessToken(testUserId, testRole);
      const user = TokenService.extractUserFromToken(token);

      expect(user.userId).toBe(testUserId);
      expect(user.role).toBe(testRole);
    });

    it('should extract userId from refresh token', () => {
      const token = TokenService.generateRefreshToken(testUserId);
      const user = TokenService.extractUserFromToken(token);

      expect(user.userId).toBe(testUserId);
      expect(user.role).toBeUndefined();
    });

    it('should throw UnauthorizedError for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => TokenService.extractUserFromToken(invalidToken)).toThrow(UnauthorizedError);
    });
  });
});
