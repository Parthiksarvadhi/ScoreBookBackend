# ScoreBook Backend - Quick Start Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

## Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
The `.env` file is already configured. Verify:
```
DB_HOST=localhost
DB_NAME=scorebook
DB_USER=postgres
DB_PASSWORD=Parthik@2026
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 3. Run Migrations
```bash
npm run db:migrate
```

### 4. Start Development Server
```bash
npm run dev
```

Server will start on `http://localhost:3000`

---

## Testing in Postman

### Step 1: Import Collection
1. Open Postman
2. Click "Import"
3. Select `POSTMAN_COLLECTION.json` from the backend folder
4. Collection will be imported with all endpoints

### Step 2: Register Users

**Register Scorer:**
- Endpoint: `POST /auth/register`
- Body:
```json
{
  "email": "scorer1@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Scorer"
}
```

**Register Admin (optional):**
- Endpoint: `POST /auth/register`
- Body:
```json
{
  "email": "admin@example.com",
  "password": "AdminPass123",
  "firstName": "Admin",
  "lastName": "User"
}
```

### Step 3: Login

**Login Scorer:**
- Endpoint: `POST /auth/login`
- Body:
```json
{
  "email": "scorer1@example.com",
  "password": "SecurePass123"
}
```
- Copy `accessToken` and `refreshToken` from response
- Set Postman variable: `{{accessToken}}` = copied token

**Login Admin (if needed):**
- Same process, set `{{adminAccessToken}}` variable

### Step 4: Create Teams (Database)

You need to create teams first. Run this SQL in PostgreSQL:

```sql
-- Create teams
INSERT INTO teams (id, name, "shortName", "createdBy", "createdAt", "updatedAt")
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Team A', 'TA', '550e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Team B', 'TB', '550e8400-e29b-41d4-a716-446655440000', NOW(), NOW());
```

### Step 5: Create Match

- Endpoint: `POST /matches`
- Headers: `Authorization: Bearer {{accessToken}}`
- Body:
```json
{
  "teamAId": "550e8400-e29b-41d4-a716-446655440001",
  "teamBId": "550e8400-e29b-41d4-a716-446655440002",
  "matchType": "T20",
  "overs": 20,
  "venue": "Eden Gardens"
}
```
- Copy `id` from response and set `{{matchId}}` variable

### Step 6: Test Lock Mechanism

**Start Match (Acquire Lock):**
- Endpoint: `POST /matches/{{matchId}}/start`
- Headers: `Authorization: Bearer {{accessToken}}`
- Response: Match status changes to "live", scorerId is set

**Try to Start Same Match with Different Scorer:**
- Login with different scorer account
- Try to start same match
- Expected: `409 LOCK_CONFLICT` error

**Try to Start Different Match with Same Scorer:**
- Create another match
- Try to start it with same scorer
- Expected: `409 SCORER_ALREADY_ACTIVE` error

### Step 7: Test Admin Override

**Force Release Lock:**
- Endpoint: `POST /matches/{{matchId}}/admin/override`
- Headers: `Authorization: Bearer {{adminAccessToken}}`
- Body:
```json
{
  "action": "force_release",
  "reason": "Testing admin override"
}
```
- Response: Lock is released, scorerId becomes null

**Reassign Scorer:**
- Endpoint: `POST /matches/{{matchId}}/admin/override`
- Headers: `Authorization: Bearer {{adminAccessToken}}`
- Body:
```json
{
  "action": "reassign_scorer",
  "newScorerId": "550e8400-e29b-41d4-a716-446655440005",
  "reason": "Reassigning to different scorer"
}
```

### Step 8: Test Audit Trail

**Get Audit History:**
- Endpoint: `GET /matches/{{matchId}}/audit`
- Headers: `Authorization: Bearer {{adminAccessToken}}`
- Response: List of all lock state changes with timestamps

### Step 9: End/Abandon Match

**End Match:**
- Endpoint: `POST /matches/{{matchId}}/end`
- Headers: `Authorization: Bearer {{accessToken}}`
- Response: Status changes to "completed", lock is released

**Abandon Match:**
- Endpoint: `POST /matches/{{matchId}}/abandon`
- Headers: `Authorization: Bearer {{accessToken}}`
- Response: Status changes to "abandoned", lock is released

---

## API Endpoints Summary

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get tokens
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user

### Match Management
- `POST /matches` - Create match
- `GET /matches` - List matches
- `GET /matches/{id}` - Get match details
- `POST /matches/{id}/start` - Start match (acquire lock)
- `POST /matches/{id}/end` - End match (release lock)
- `POST /matches/{id}/abandon` - Abandon match

### Admin Operations
- `POST /matches/{id}/admin/override` - Force release or reassign
- `GET /matches/{id}/audit` - Get audit history

---

## Key Features to Test

### 1. Exclusive Scorer Lock
- ✅ One scorer can only lock one match at a time
- ✅ Another scorer cannot lock the same match
- ✅ Lock is atomic (SERIALIZABLE isolation)

### 2. Match Status Transitions
- ✅ scheduled → live (on lock acquisition)
- ✅ live → completed (on match end)
- ✅ live → abandoned (on match abandon)
- ✅ Terminal states prevent further transitions

### 3. Admin Override
- ✅ Admin can force release locks
- ✅ Admin can reassign scorers
- ✅ Non-admin cannot perform admin operations

### 4. Audit Trail
- ✅ All lock state changes are logged
- ✅ Audit logs include user, scorer, action, timestamp
- ✅ Audit history is in chronological order

### 5. Error Handling
- ✅ LOCK_CONFLICT when match already locked
- ✅ SCORER_ALREADY_ACTIVE when scorer has active lock
- ✅ INVALID_MATCH_STATUS for invalid transitions
- ✅ UNAUTHORIZED for non-lock-holder operations
- ✅ INSUFFICIENT_PERMISSIONS for non-admin operations

---

## Troubleshooting

### Database Connection Error
```
ERROR: password authentication failed for user "postgres"
```
- Check `.env` file for correct DB credentials
- Verify PostgreSQL is running
- Verify database exists: `scorebook`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
- Change PORT in `.env` file
- Or kill process using port 3000

### TypeScript Compilation Error
```
npm run build
```
- Verify all TypeScript files are valid
- Check `tsconfig.json` configuration

### Token Expired
- Use `POST /auth/refresh` with refreshToken to get new accessToken
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days

---

## Production Build

### Build
```bash
npm run build
```
Output: `dist/` directory with compiled JavaScript

### Run Production
```bash
npm start
```

---

## Development Commands

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Undo all migrations
npm run db:migrate:undo:all
```

---

## Notes

- All timestamps are in UTC (ISO 8601 format)
- UUIDs are used for all IDs
- Passwords are hashed with bcryptjs (10 salt rounds)
- JWT tokens use HS256 algorithm
- Database uses SERIALIZABLE isolation for lock operations
- Soft delete is enabled (paranoid mode) for all models

---

## Support

For detailed API documentation, see: `API_DOCUMENTATION.md`
For TypeScript conversion details, see: `TYPESCRIPT_CONVERSION.md`

