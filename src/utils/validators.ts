/**
 * Validators utility for email and password validation
 */

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} true if email is valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {boolean} true if password meets minimum requirements, false otherwise
 */
export const isValidPassword = (password: string): boolean => {
  return !!(password && password.length >= 8);
};

/**
 * Validates required fields
 * @param {Object} fields - Object containing fields to validate
 * @param {string[]} requiredFieldNames - Array of field names that are required
 * @returns {string[]} Array of missing field names, empty if all present
 */
export const validateRequiredFields = (
  fields: Record<string, any>,
  requiredFieldNames: string[]
): string[] => {
  return requiredFieldNames.filter(
    (fieldName) => !fields[fieldName] || fields[fieldName].toString().trim() === ''
  );
};
