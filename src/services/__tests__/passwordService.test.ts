/**
 * Unit tests for PasswordService
 */

import { PasswordService } from '../passwordService.js';

describe('PasswordService', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123';
      const hash = await PasswordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(password); // Hash should not be the same as password
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await PasswordService.hashPassword(password);
      const hash2 = await PasswordService.hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different hashes due to salt
    });

    it('should handle empty password', async () => {
      const password = '';
      const hash = await PasswordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should handle very long password', async () => {
      const password = 'a'.repeat(1000);
      const hash = await PasswordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });

  describe('comparePassword', () => {
    it('should return true when password matches hash', async () => {
      const password = 'TestPassword123';
      const hash = await PasswordService.hashPassword(password);
      const isMatch = await PasswordService.comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false when password does not match hash', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword456';
      const hash = await PasswordService.hashPassword(password);
      const isMatch = await PasswordService.comparePassword(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });

    it('should return false for empty password against hash', async () => {
      const password = 'TestPassword123';
      const hash = await PasswordService.hashPassword(password);
      const isMatch = await PasswordService.comparePassword('', hash);

      expect(isMatch).toBe(false);
    });

    it('should handle case sensitivity', async () => {
      const password = 'TestPassword123';
      const hash = await PasswordService.hashPassword(password);
      const isMatch = await PasswordService.comparePassword('testpassword123', hash);

      expect(isMatch).toBe(false);
    });

    it('should handle whitespace differences', async () => {
      const password = 'TestPassword123';
      const hash = await PasswordService.hashPassword(password);
      const isMatch = await PasswordService.comparePassword('TestPassword123 ', hash);

      expect(isMatch).toBe(false);
    });
  });
});
