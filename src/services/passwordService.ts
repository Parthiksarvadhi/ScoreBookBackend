/**
 * PasswordService - Handles password hashing and comparison using bcryptjs
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export class PasswordService {
  /**
   * Hash a plain text password using bcryptjs
   * @param {string} password - Plain text password to hash
   * @returns {Promise<string>} Promise resolving to the hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      return hash;
    } catch (error) {
      throw new Error(
        `Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Compare a plain text password with a hash
   * @param {string} password - Plain text password to compare
   * @param {string} hash - Hashed password to compare against
   * @returns {Promise<boolean>} Promise resolving to true if passwords match, false otherwise
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(password, hash);
      return isMatch;
    } catch (error) {
      throw new Error(
        `Failed to compare password: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
