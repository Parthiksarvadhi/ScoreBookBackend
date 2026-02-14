/**
 * AuthService - Orchestrates authentication operations
 */

import db from '../models/index.js';
import { PasswordService } from './passwordService.js';
import { TokenService } from './tokenService.js';
import {
  ValidationError,
  DuplicateEmailError,
  InvalidCredentialsError,
  NotFoundError,
} from '../utils/errorHandler.js';
import { isValidEmail, isValidPassword, validateRequiredFields } from '../utils/validators.js';
import { IRegisterInput, ILoginInput, IUserResponse, ILoginResponse } from '../types/index.js';

export class AuthService {
  /**
   * Register a new user
   * @param {Object} input - Registration input containing email, password, firstName, lastName
   * @returns {Promise<Object>} Created user object with tokens
   */
  static async register(input: IRegisterInput): Promise<ILoginResponse> {
    // Validate required fields
    const missingFields = validateRequiredFields(input, ['email', 'password', 'firstName', 'lastName']);
    if (missingFields.length > 0) {
      throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`, {
        missingFields,
      });
    }

    // Validate email format
    if (!isValidEmail(input.email)) {
      throw new ValidationError('Invalid email format', {
        field: 'email',
      });
    }

    // Validate password strength
    if (!isValidPassword(input.password)) {
      throw new ValidationError('Password must be at least 8 characters long', {
        field: 'password',
      });
    }

    // Check for duplicate email
    const existingUser = await db.User.findOne({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new DuplicateEmailError();
    }

    // Hash password
    const hashedPassword = await PasswordService.hashPassword(input.password);

    // Create user with default role 'scorer'
    const user = await db.User.create({
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
      role: 'scorer',
    });

    // Generate tokens
    const accessToken = TokenService.generateAccessToken(user.id, user.role);
    const refreshToken = TokenService.generateRefreshToken(user.id);

    // Return user with tokens
    return {
      user: this.formatUserResponse(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user and return tokens
   * @param {Object} input - Login input containing email and password
   * @returns {Promise<Object>} Access token, refresh token, and user object
   */
  static async login(input: ILoginInput): Promise<ILoginResponse> {
    // Validate required fields
    const missingFields = validateRequiredFields(input, ['email', 'password']);
    if (missingFields.length > 0) {
      throw new ValidationError('Missing required fields', {
        missingFields,
      });
    }

    // Find user by email
    const user = await db.User.findOne({
      where: { email: input.email },
    });

    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Compare password
    const isPasswordValid = await PasswordService.comparePassword(input.password, user.password);

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // Generate tokens
    const accessToken = TokenService.generateAccessToken(user.id, user.role);
    const refreshToken = TokenService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: this.formatUserResponse(user),
    };
  }

  /**
   * Refresh access token using refresh token
   * @param {Object} input - Refresh token input
   * @returns {Promise<Object>} New access token
   */
  static async refreshToken(input: { refreshToken: string }): Promise<{ accessToken: string }> {
    // Validate required fields
    const missingFields = validateRequiredFields(input, ['refreshToken']);
    if (missingFields.length > 0) {
      throw new ValidationError('Missing required fields', {
        missingFields,
      });
    }

    // Verify refresh token
    const payload = TokenService.verifyToken(input.refreshToken);

    // Get user to retrieve current role
    const user = await db.User.findByPk(payload.userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate new access token with same role
    const accessToken = TokenService.generateAccessToken(user.id, user.role);

    return {
      accessToken,
    };
  }

  /**
   * Get current user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object without password
   */
  static async getCurrentUser(userId: string): Promise<IUserResponse> {
    const user = await db.User.findByPk(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.formatUserResponse(user);
  }

  /**
   * Update user profile
   */
  static async updateUser(userId: string, data: { firstName?: string; lastName?: string; phoneNumber?: string; fcmToken?: string }): Promise<IUserResponse> {
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check availability of phone number if changing
    if (data.phoneNumber && data.phoneNumber !== user.phoneNumber) {
      const existing = await db.User.findOne({ where: { phoneNumber: data.phoneNumber } });
      if (existing) {
        throw new ValidationError('Phone number already in use', { field: 'phoneNumber' });
      }
    }

    await user.update(data);
    return this.formatUserResponse(user);
  }

  /**
   * Format user response (exclude password)
   * @param {Object} user - User model instance
   * @returns {Object} Formatted user response
   */
  static formatUserResponse(user: any): IUserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phoneNumber: user.phoneNumber,
      fcmToken: user.fcmToken,
    };
  }
}
