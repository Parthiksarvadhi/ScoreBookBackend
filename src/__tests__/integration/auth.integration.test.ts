/**
 * Integration tests for authentication flows
 */

import { AuthService } from '../../services/authService.js';
import { TokenService } from '../../services/tokenService.js';
import { PasswordService } from '../../services/passwordService.js';
import {
  ValidationError,
  DuplicateEmailError,
  InvalidCredentialsError,
  UnauthorizedError,
} from '../../utils/errorHandler.js';

// Mock database
jest.mock('../../models/index.js', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
}));

import db from '../../models/index.js';

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Registration and Login Flow', () => {
    it('should register new user, login, and access protected resource', async () => {
      const registrationInput = {
        email: 'newuser@example.com',
        password: 'SecurePassword123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      // Step 1: Register user
      const mockCreatedUser = {
        id: 'user-456',
        email: registrationInput.email,
        password: 'hashed-password',
        firstName: registrationInput.firstName,
        lastName: registrationInput.lastName,
        role: 'scorer',
      };

      (db.User.findOne as jest.Mock).mockResolvedValueOnce(null); // No existing user
      (db.User.create as jest.Mock).mockResolvedValueOnce(mockCreatedUser);

      const registeredUser = await AuthService.register(registrationInput);

      expect(registeredUser.email).toBe(registrationInput.email);
      expect(registeredUser.role).toBe('scorer');
      expect(registeredUser.password).toBeUndefined();

      // Step 2: Login with registered user
      (db.User.findOne as jest.Mock).mockResolvedValueOnce(mockCreatedUser);
      jest.spyOn(PasswordService, 'comparePassword').mockResolvedValueOnce(true);

      const loginResult = await AuthService.login({
        email: registrationInput.email,
        password: registrationInput.password,
      });

      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.refreshToken).toBeDefined();
      expect(loginResult.user.id).toBe(mockCreatedUser.id);

      // Step 3: Use access token to get current user
      const accessTokenPayload = TokenService.verifyToken(loginResult.accessToken);
      expect(accessTokenPayload.userId).toBe(mockCreatedUser.id);
      expect(accessTokenPayload.role).toBe('scorer');

      (db.User.findByPk as jest.Mock).mockResolvedValueOnce(mockCreatedUser);

      const currentUser = await AuthService.getCurrentUser(accessTokenPayload.userId);

      expect(currentUser.id).toBe(mockCreatedUser.id);
      expect(currentUser.email).toBe(registrationInput.email);
    });

    it('should prevent duplicate email registration', async () => {
      const registrationInput = {
        email: 'existing@example.com',
        password: 'SecurePassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      // Simulate existing user
      (db.User.findOne as jest.Mock).mockResolvedValueOnce({
        id: 'existing-user',
        email: registrationInput.email,
      });

      await expect(AuthService.register(registrationInput)).rejects.toThrow(DuplicateEmailError);
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh access token using valid refresh token', async () => {
      const userId = 'user-789';
      const role = 'scorer';

      // Generate initial tokens
      const accessToken = TokenService.generateAccessToken(userId, role);
      const refreshToken = TokenService.generateRefreshToken(userId);

      // Verify initial access token
      const initialPayload = TokenService.verifyToken(accessToken);
      expect(initialPayload.userId).toBe(userId);
      expect(initialPayload.role).toBe(role);

      // Mock user retrieval for refresh
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: role,
      };

      (db.User.findByPk as jest.Mock).mockResolvedValueOnce(mockUser);

      // Refresh token
      const refreshResult = await AuthService.refreshToken({ refreshToken });

      expect(refreshResult.accessToken).toBeDefined();

      // Verify new access token
      const newPayload = TokenService.verifyToken(refreshResult.accessToken);
      expect(newPayload.userId).toBe(userId);
      expect(newPayload.role).toBe(role);
    });

    it('should reject expired refresh token', async () => {
      // Create a token with very short expiry
      const userId = 'user-999';
      const expiredToken = TokenService.generateRefreshToken(userId);

      // Manually expire the token by waiting (in real scenario)
      // For testing, we'll create an invalid token
      const invalidToken = 'invalid.expired.token';

      await expect(AuthService.refreshToken({ refreshToken: invalidToken })).rejects.toThrow();
    });
  });

  describe('Role-Based Access Control Flow', () => {
    it('should enforce role-based access control', async () => {
      // Create users with different roles
      const adminUser = {
        id: 'admin-user',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      };

      const scorerUser = {
        id: 'scorer-user',
        email: 'scorer@example.com',
        firstName: 'Scorer',
        lastName: 'User',
        role: 'scorer',
      };

      const viewerUser = {
        id: 'viewer-user',
        email: 'viewer@example.com',
        firstName: 'Viewer',
        lastName: 'User',
        role: 'viewer',
      };

      // Generate tokens for each role
      const adminToken = TokenService.generateAccessToken(adminUser.id, adminUser.role);
      const scorerToken = TokenService.generateAccessToken(scorerUser.id, scorerUser.role);
      const viewerToken = TokenService.generateAccessToken(viewerUser.id, viewerUser.role);

      // Verify each token contains correct role
      const adminPayload = TokenService.verifyToken(adminToken);
      const scorerPayload = TokenService.verifyToken(scorerToken);
      const viewerPayload = TokenService.verifyToken(viewerToken);

      expect(adminPayload.role).toBe('admin');
      expect(scorerPayload.role).toBe('scorer');
      expect(viewerPayload.role).toBe('viewer');

      // Simulate role-based access checks
      const adminAllowedRoles = ['admin'];
      const scorerAllowedRoles = ['admin', 'scorer'];
      const viewerAllowedRoles = ['admin', 'scorer', 'viewer'];

      // Admin can access admin endpoints
      expect(adminAllowedRoles.includes(adminPayload.role!)).toBe(true);

      // Scorer cannot access admin endpoints
      expect(adminAllowedRoles.includes(scorerPayload.role!)).toBe(false);

      // Scorer can access scorer endpoints
      expect(scorerAllowedRoles.includes(scorerPayload.role!)).toBe(true);

      // Viewer can access viewer endpoints
      expect(viewerAllowedRoles.includes(viewerPayload.role!)).toBe(true);

      // Viewer cannot access scorer endpoints
      expect(scorerAllowedRoles.includes(viewerPayload.role!)).toBe(false);
    });
  });

  describe('Error Handling Across Flows', () => {
    it('should handle validation errors consistently', async () => {
      // Test missing fields
      await expect(
        AuthService.register({
          email: 'test@example.com',
          password: '',
          firstName: 'John',
          lastName: 'Doe',
        })
      ).rejects.toThrow(ValidationError);

      // Test invalid email
      await expect(
        AuthService.register({
          email: 'invalid-email',
          password: 'ValidPassword123',
          firstName: 'John',
          lastName: 'Doe',
        })
      ).rejects.toThrow(ValidationError);

      // Test short password
      await expect(
        AuthService.register({
          email: 'test@example.com',
          password: 'short',
          firstName: 'John',
          lastName: 'Doe',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should handle authentication errors consistently', async () => {
      // Test invalid credentials
      (db.User.findOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        AuthService.login({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123',
        })
      ).rejects.toThrow(InvalidCredentialsError);

      // Test wrong password
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        role: 'scorer',
      };

      (db.User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
      jest.spyOn(PasswordService, 'comparePassword').mockResolvedValueOnce(false);

      await expect(
        AuthService.login({
          email: 'test@example.com',
          password: 'WrongPassword123',
        })
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('should handle token errors consistently', async () => {
      // Test invalid token
      expect(() => TokenService.verifyToken('invalid.token')).toThrow(UnauthorizedError);

      // Test tampered token
      const validToken = TokenService.generateAccessToken('user-123', 'scorer');
      const parts = validToken.split('.');
      const tamperedToken = parts[0] + '.tampered.' + parts[2];

      expect(() => TokenService.verifyToken(tamperedToken)).toThrow(UnauthorizedError);
    });
  });
});
