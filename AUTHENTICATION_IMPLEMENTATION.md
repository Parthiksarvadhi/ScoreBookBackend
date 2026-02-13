# User Authentication Implementation Guide

## Overview

This document describes the complete implementation of the User Authentication feature for the ScoreBook backend. The system provides secure JWT-based authentication with role-based access control (RBAC).

## Implementation Summary

### Completed Tasks

All 11 tasks have been successfully implemented:

1. ✅ **Task 1**: Set up authentication service structure and utilities
2. ✅ **Task 2**: Implement PasswordService with bcryptjs integration
3. ✅ **Task 3**: Implement TokenService with JWT operations
4. ✅ **Task 4**: Implement AuthService core methods
5. ✅ **Task 5**: Create authentication middleware
6. ✅ **Task 6**: Create authentication API routes
7. ✅ **Task 7**: Checkpoint - Verify core functionality
8. ✅ **Task 8**: Write comprehensive unit tests
9. ✅ **Task 9**: Checkpoint - Ensure all tests pass
10. ✅ **Task 10**: Write integration tests
11. ✅ **Task 11**: Final checkpoint - Ensure all tests pass

## File Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── authService.ts          # Main authentication service
│   │   ├── passwordService.ts      # Password hashing and comparison
│   │   ├── tokenService.ts         # JWT token generation and validation
│   │   └── __tests__/
│   │       ├── authService.test.ts
│   │       ├── passwordService.test.ts
│   │       └── tokenService.test.ts
│   ├── middleware/
│   │   ├── authMiddleware.ts       # Token validation and role authorization
│   │   └── __tests__/
│   │       └── authMiddleware.test.ts
│   ├── routes/
│   │   ├── authRoutes.ts           # Authentication API endpoints
│   │   └── __tests__/
│   │       └── authRoutes.test.ts
│   ├── utils/
│   │   ├── errorHandler.ts         # Error handling and formatting
│   │   └── validators.ts           # Input validation utilities
│   └── __tests__/
│       └── integration/
│           └── auth.integration.test.ts
├── app.js                          # Main Express application
├── .env                            # Environment variables
├── jest.config.js                  # Jest testing configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Dependencies and scripts
```

## Core Components

### 1. PasswordService (`src/services/passwordService.ts`)

Handles secure password hashing and comparison using bcryptjs.

**Methods:**
- `hashPassword(password: string): Promise<string>` - Hash a password with 10 salt rounds
- `comparePassword(password: string, hash: string): Promise<boolean>` - Compare password with hash

**Features:**
- Uses bcryptjs with 10 salt rounds for security
- Async operations for non-blocking execution
- Comprehensive error handling

### 2. TokenService (`src/services/tokenService.ts`)

Manages JWT token generation, validation, and extraction.

**Methods:**
- `generateAccessToken(userId: string, role: string): string` - Generate short-lived access token (15 min)
- `generateRefreshToken(userId: string): string` - Generate long-lived refresh token (7 days)
- `verifyToken(token: string): TokenPayload` - Verify token signature and expiration
- `extractUserFromToken(token: string): { userId: string; role?: string }` - Extract user info from token

**Configuration:**
- JWT Secret: `JWT_SECRET` environment variable
- Access Token Expiry: `ACCESS_TOKEN_EXPIRY` (default: 15m)
- Refresh Token Expiry: `REFRESH_TOKEN_EXPIRY` (default: 7d)
- Algorithm: HS256

### 3. AuthService (`src/services/authService.ts`)

Orchestrates authentication operations.

**Methods:**
- `register(input: RegisterInput): Promise<UserResponse>` - Register new user
- `login(input: LoginInput): Promise<LoginResponse>` - Login and return tokens
- `refreshToken(input: RefreshTokenInput): Promise<RefreshTokenResponse>` - Refresh access token
- `getCurrentUser(userId: string): Promise<UserResponse>` - Get user by ID

**Features:**
- Email format validation
- Password strength validation (minimum 8 characters)
- Duplicate email prevention
- Default role assignment (scorer)
- Password hashing before storage
- Token generation on successful login

### 4. Authentication Middleware (`src/middleware/authMiddleware.ts`)

Provides middleware for token validation and role-based access control.

**Middleware:**
- `authenticateToken` - Validates JWT from Authorization header
- `authorizeRole(allowedRoles: string[])` - Checks user role authorization

**Features:**
- Extracts token from "Bearer <token>" format
- Validates token signature and expiration
- Attaches user info to request object
- Role-based access control enforcement

### 5. API Routes (`src/routes/authRoutes.ts`)

Provides authentication endpoints.

**Endpoints:**
- `POST /auth/register` - Register new user (201 Created)
- `POST /auth/login` - Login user (200 OK)
- `POST /auth/refresh` - Refresh access token (200 OK)
- `GET /auth/me` - Get current user (protected, 200 OK)

**Error Responses:**
- 400: Validation error
- 401: Invalid credentials or unauthorized
- 403: Insufficient permissions
- 409: Duplicate email
- 500: Internal server error

### 6. Error Handling (`src/utils/errorHandler.ts`)

Provides consistent error handling and formatting.

**Error Classes:**
- `ValidationError` (400)
- `DuplicateEmailError` (409)
- `InvalidCredentialsError` (401)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `InternalServerError` (500)

**Functions:**
- `formatErrorResponse(error)` - Format error for API response
- `getErrorStatusCode(error)` - Get HTTP status code from error

### 7. Validators (`src/utils/validators.ts`)

Provides input validation utilities.

**Functions:**
- `isValidEmail(email: string): boolean` - Validate email format
- `isValidPassword(password: string): boolean` - Validate password strength
- `validateRequiredFields(fields, requiredFieldNames): string[]` - Check required fields

## Environment Variables

Required environment variables in `.env`:

```
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Database Configuration
DB_HOST=localhost
DB_NAME=scorebook
DB_USER=postgres
DB_PASSWORD=your-password
```

## Testing

### Unit Tests

Comprehensive unit tests for all services, middleware, and routes:

- `src/services/__tests__/passwordService.test.ts` - Password hashing and comparison
- `src/services/__tests__/tokenService.test.ts` - Token generation and validation
- `src/services/__tests__/authService.test.ts` - Authentication operations
- `src/middleware/__tests__/authMiddleware.test.ts` - Middleware functionality
- `src/routes/__tests__/authRoutes.test.ts` - API route handlers

### Integration Tests

End-to-end flow tests:

- `src/__tests__/integration/auth.integration.test.ts` - Complete authentication flows

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- passwordService.test.ts
```

## API Usage Examples

### Register User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Response (201):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "scorer",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Login User

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

Response (200):
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "scorer"
  }
}
```

### Refresh Token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGc..."
  }'
```

Response (200):
```json
{
  "accessToken": "eyJhbGc..."
}
```

### Get Current User

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer eyJhbGc..."
```

Response (200):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "scorer"
}
```

## Security Features

1. **Password Security**
   - Bcryptjs hashing with 10 salt rounds
   - Passwords never stored in plain text
   - Secure comparison to prevent timing attacks

2. **Token Security**
   - JWT with HS256 algorithm
   - Short-lived access tokens (15 minutes)
   - Long-lived refresh tokens (7 days)
   - Token signature verification
   - Expiration enforcement

3. **Role-Based Access Control**
   - Three roles: admin, scorer, viewer
   - Default role assignment (scorer)
   - Middleware-based role enforcement
   - Per-endpoint role requirements

4. **Input Validation**
   - Email format validation
   - Password strength requirements (minimum 8 characters)
   - Required field validation
   - Duplicate email prevention

5. **Error Handling**
   - Consistent error response format
   - Appropriate HTTP status codes
   - Descriptive error messages
   - No sensitive information in error responses

## Integration with Express App

The authentication routes are integrated into the main Express application in `app.js`:

```javascript
import authRoutes from './src/routes/authRoutes.js';

// Mount authentication routes
app.use('/auth', authRoutes);
```

## Next Steps

1. **Database Setup**: Ensure PostgreSQL is running and the User model is synced
2. **Environment Configuration**: Set JWT_SECRET and other environment variables
3. **Testing**: Run the test suite to verify all functionality
4. **Deployment**: Deploy to production with secure JWT_SECRET

## Troubleshooting

### Common Issues

1. **JWT_SECRET not set**: Set `JWT_SECRET` in `.env` file
2. **Database connection failed**: Verify PostgreSQL is running and credentials are correct
3. **Token verification failed**: Ensure JWT_SECRET is consistent across all instances
4. **Password comparison fails**: Verify bcryptjs is installed and working correctly

## References

- [JWT Documentation](https://jwt.io/)
- [bcryptjs Documentation](https://github.com/dcodeIO/bcrypt.js)
- [Express.js Documentation](https://expressjs.com/)
- [Sequelize Documentation](https://sequelize.org/)
