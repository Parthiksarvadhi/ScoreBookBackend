/**
 * Unit tests for AuthService
 */

import { AuthService } from '../authService.js';
import {
  ValidationError,
  DuplicateEmailError,
  InvalidCredentialsError,
  NotFoundError,
} from '../../utils/errorHandler.js';
import { TokenService } from '../tokenService.js';

// Mock database
jest.mock('../../models/index.js', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
}));

import db from '../../models/index.js';

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validInput = {
      email: 'test@example.com',
      password: 'ValidPassword123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user with valid input', async () => {
      const mockUser = {
        id: 'user-123',
        email: validInput.email,
        firstName: validInput.firstName,
        lastName: validInput.lastName,
        role: 'scorer',
      };

      (db.User.findOne as jest.Mock).mockResolvedValue(null);
      (db.User.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await AuthService.register(validInput);

      expect(result).toEqual(mockUser);
      expect(result.role).toBe('scorer');
      expect(db.User.findOne).toHaveBeenCalledWith({
        where: { email: validInput.email },
      });
      expect(db.User.create).toHaveBeenCalled();
    });

    it('should throw ValidationError for missing email', async () => {
      const input = { ...validInput, email: '' };

      await expect(AuthService.register(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing password', async () => {
      const input = { ...validInput, password: '' };

      await expect(AuthService.register(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing firstName', async () => {
      const input = { ...validInput, firstName: '' };

      await expect(AuthService.register(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing lastName', async () => {
      const input = { ...validInput, lastName: '' };

      await expect(AuthService.register(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid email format', async () => {
      const input = { ...validInput, email: 'invalid-email' };

      await expect(AuthService.register(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for short password', async () => {
      const input = { ...validInput, password: 'short' };

      await expect(AuthService.register(input)).rejects.toThrow(ValidationError);
    });

    it('should throw DuplicateEmailError for existing email', async () => {
      (db.User.findOne as jest.Mock).mockResolvedValue({ id: 'existing-user' });

      await expect(AuthService.register(validInput)).rejects.toThrow(DuplicateEmailError);
    });

    it('should not return password in response', async () => {
      const mockUser = {
        id: 'user-123',
        email: validInput.email,
        password: 'hashed-password',
        firstName: validInput.firstName,
        lastName: validInput.lastName,
        role: 'scorer',
      };

      (db.User.findOne as jest.Mock).mockResolvedValue(null);
      (db.User.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await AuthService.register(validInput);

      expect(result.password).toBeUndefined();
    });
  });

  describe('login', () => {
    const validInput = {
      email: 'test@example.com',
      password: 'ValidPassword123',
    };

    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: validInput.email,
        password: '$2a$10$hashedpassword', // bcrypt hash
        firstName: 'John',
        lastName: 'Doe',
        role: 'scorer',
      };

      (db.User.findOne as jest.Mock).mockResolvedValue(mockUser);

      // Mock password comparison
      jest.spyOn(require('../passwordService.js').PasswordService, 'comparePassword').mockResolvedValue(true);

      const result = await AuthService.login(validInput);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
      });
    });

    it('should throw ValidationError for missing email', async () => {
      const input = { ...validInput, email: '' };

      await expect(AuthService.login(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing password', async () => {
      const input = { ...validInput, password: '' };

      await expect(AuthService.login(input)).rejects.toThrow(ValidationError);
    });

    it('should throw InvalidCredentialsError for non-existent email', async () => {
      (db.User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.login(validInput)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw InvalidCredentialsError for wrong password', async () => {
      const mockUser = {
        id: 'user-123',
        email: validInput.email,
        password: '$2a$10$hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'scorer',
      };

      (db.User.findOne as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(require('../passwordService.js').PasswordService, 'comparePassword').mockResolvedValue(false);

      await expect(AuthService.login(validInput)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should not return password in response', async () => {
      const mockUser = {
        id: 'user-123',
        email: validInput.email,
        password: '$2a$10$hashedpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'scorer',
      };

      (db.User.findOne as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(require('../passwordService.js').PasswordService, 'comparePassword').mockResolvedValue(true);

      const result = await AuthService.login(validInput);

      expect(result.user.password).toBeUndefined();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token with valid refresh token', async () => {
      const userId = 'user-123';
      const role = 'scorer';
      const refreshToken = TokenService.generateRefreshToken(userId);

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: role,
      };

      (db.User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const result = await AuthService.refreshToken({ refreshToken });

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBeDefined();
    });

    it('should throw ValidationError for missing refresh token', async () => {
      await expect(AuthService.refreshToken({ refreshToken: '' })).rejects.toThrow(ValidationError);
    });

    it('should throw error for invalid refresh token', async () => {
      const invalidToken = 'invalid.token.here';

      await expect(AuthService.refreshToken({ refreshToken: invalidToken })).rejects.toThrow();
    });

    it('should throw NotFoundError for non-existent user', async () => {
      const userId = 'non-existent-user';
      const refreshToken = TokenService.generateRefreshToken(userId);

      (db.User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.refreshToken({ refreshToken })).rejects.toThrow(NotFoundError);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user by ID', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'scorer',
      };

      (db.User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const result = await AuthService.getCurrentUser(userId);

      expect(result).toEqual(mockUser);
      expect(db.User.findByPk).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      const userId = 'non-existent-user';

      (db.User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.getCurrentUser(userId)).rejects.toThrow(NotFoundError);
    });

    it('should not return password in response', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        role: 'scorer',
      };

      (db.User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const result = await AuthService.getCurrentUser(userId);

      expect(result.password).toBeUndefined();
    });
  });
});
