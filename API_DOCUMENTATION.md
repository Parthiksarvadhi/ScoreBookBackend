# ScoreBook API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer {accessToken}
```

---

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

**Description:** Create a new user account

**Request Body:**
```json
{
  "email": "scorer@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "scorer@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "scorer"
}
```

---

### 2. Login User
**POST** `/auth/login`

**Description:** Authenticate user and get tokens

**Request Body:**
```json
{
  "email": "scorer@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "scorer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "scorer"
  }
}
```

---

### 3. Refresh Access Token
**POST** `/auth/refresh`

**Description:** Get a new access token using refresh token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 4. Get Current User
**GET** `/auth/me`

**Description:** Get authenticated user information

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "scorer@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "scorer"
}
```

---

## Match Management Endpoints

### 5. Create Match
**POST** `/matches`

**Description:** Create a new match (requires 'scorer' or 'admin' role)

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "teamAId": "550e8400-e29b-41d4-a716-446655440001",
  "teamBId": "550e8400-e29b-41d4-a716-446655440002",
  "matchType": "T20",
  "overs": 20,
  "venue": "Eden Gardens, Kolkata"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "teamAId": "550e8400-e29b-41d4-a716-446655440001",
  "teamBId": "550e8400-e29b-41d4-a716-446655440002",
  "createdBy": "550e8400-e29b-41d4-a716-446655440000",
  "matchType": "T20",
  "status": "scheduled",
  "overs": 20,
  "venue": "Eden Gardens, Kolkata",
  "scorerId": null,
  "lockedAt": null,
  "startTime": null,
  "endTime": null,
  "winner": null,
  "createdAt": "2024-02-08T10:00:00Z",
  "updatedAt": "2024-02-08T10:00:00Z"
}
```

---

### 6. List Matches
**GET** `/matches?status=live&page=1&limit=20`

**Description:** Get list of matches with optional filtering

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `status` (optional): 'scheduled', 'live', 'completed', 'abandoned'
- `scorerId` (optional): Filter by scorer ID
- `createdBy` (optional): Filter by creator ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "teamAId": "550e8400-e29b-41d4-a716-446655440001",
      "teamBId": "550e8400-e29b-41d4-a716-446655440002",
      "status": "live",
      "scorerId": "550e8400-e29b-41d4-a716-446655440000",
      "scorer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "firstName": "John",
        "lastName": "Doe",
        "email": "scorer@example.com"
      },
      "startTime": "2024-02-08T10:05:00Z",
      "createdAt": "2024-02-08T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

---

### 7. Get Match Details
**GET** `/matches/{matchId}`

**Description:** Get detailed information about a specific match

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "teamAId": "550e8400-e29b-41d4-a716-446655440001",
  "teamBId": "550e8400-e29b-41d4-a716-446655440002",
  "createdBy": "550e8400-e29b-41d4-a716-446655440000",
  "matchType": "T20",
  "status": "live",
  "overs": 20,
  "venue": "Eden Gardens, Kolkata",
  "scorerId": "550e8400-e29b-41d4-a716-446655440000",
  "lockedAt": "2024-02-08T10:05:00Z",
  "startTime": "2024-02-08T10:05:00Z",
  "endTime": null,
  "winner": null,
  "scorer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Doe",
    "email": "scorer@example.com"
  },
  "teamA": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Team A"
  },
  "teamB": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Team B"
  },
  "createdAt": "2024-02-08T10:00:00Z",
  "updatedAt": "2024-02-08T10:05:00Z"
}
```

---

### 8. Start Match (Acquire Lock)
**POST** `/matches/{matchId}/start`

**Description:** Start a match and acquire exclusive scorer lock

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "status": "live",
  "scorerId": "550e8400-e29b-41d4-a716-446655440000",
  "lockedAt": "2024-02-08T10:05:00Z",
  "startTime": "2024-02-08T10:05:00Z",
  "message": "Match started successfully"
}
```

**Error Response (409 - Lock Conflict):**
```json
{
  "error": {
    "code": "LOCK_CONFLICT",
    "message": "Match is already being scored by another scorer",
    "details": {
      "matchId": "550e8400-e29b-41d4-a716-446655440003",
      "currentScorerId": "550e8400-e29b-41d4-a716-446655440005",
      "currentScorerName": "Jane Smith",
      "lockedAt": "2024-02-08T10:05:00Z"
    }
  }
}
```

**Error Response (409 - Scorer Already Active):**
```json
{
  "error": {
    "code": "SCORER_ALREADY_ACTIVE",
    "message": "Scorer is already actively scoring another match",
    "details": {
      "scorerId": "550e8400-e29b-41d4-a716-446655440000",
      "activeMatchId": "550e8400-e29b-41d4-a716-446655440004",
      "activeMatchTeams": "Team C vs Team D",
      "lockedAt": "2024-02-08T09:00:00Z"
    }
  }
}
```

---

### 9. End Match (Release Lock)
**POST** `/matches/{matchId}/end`

**Description:** End a match and release the scorer lock

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "status": "completed",
  "scorerId": null,
  "lockedAt": null,
  "endTime": "2024-02-08T11:30:00Z",
  "message": "Match ended successfully"
}
```

---

### 10. Abandon Match (Release Lock)
**POST** `/matches/{matchId}/abandon`

**Description:** Abandon a match and release the scorer lock

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "status": "abandoned",
  "scorerId": null,
  "lockedAt": null,
  "endTime": "2024-02-08T11:30:00Z",
  "message": "Match abandoned successfully"
}
```

---

### 11. Admin Override - Force Release Lock
**POST** `/matches/{matchId}/admin/override`

**Description:** Admin force releases a scorer lock (admin only)

**Headers:**
```
Authorization: Bearer {adminAccessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "force_release",
  "reason": "Scorer became unresponsive"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "status": "live",
  "scorerId": null,
  "lockedAt": null,
  "message": "Admin override completed successfully"
}
```

---

### 12. Admin Override - Reassign Scorer
**POST** `/matches/{matchId}/admin/override`

**Description:** Admin reassigns a scorer to a match (admin only)

**Headers:**
```
Authorization: Bearer {adminAccessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "reassign_scorer",
  "newScorerId": "550e8400-e29b-41d4-a716-446655440006",
  "reason": "Original scorer had technical issues"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "status": "live",
  "scorerId": "550e8400-e29b-41d4-a716-446655440006",
  "lockedAt": "2024-02-08T10:15:00Z",
  "message": "Admin override completed successfully"
}
```

---

### 13. Get Match Audit History
**GET** `/matches/{matchId}/audit`

**Description:** Get audit trail for a match (admin only)

**Headers:**
```
Authorization: Bearer {adminAccessToken}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "matchId": "550e8400-e29b-41d4-a716-446655440003",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "scorerId": "550e8400-e29b-41d4-a716-446655440000",
      "actionType": "lock_acquired",
      "oldScorerId": null,
      "reason": null,
      "timestamp": "2024-02-08T10:05:00Z",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "firstName": "John",
        "lastName": "Doe"
      },
      "scorer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "matchId": "550e8400-e29b-41d4-a716-446655440003",
      "userId": "550e8400-e29b-41d4-a716-446655440007",
      "scorerId": "550e8400-e29b-41d4-a716-446655440006",
      "actionType": "scorer_reassigned",
      "oldScorerId": "550e8400-e29b-41d4-a716-446655440000",
      "reason": "Original scorer had technical issues",
      "timestamp": "2024-02-08T10:15:00Z",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440007",
        "firstName": "Admin",
        "lastName": "User"
      },
      "scorer": {
        "id": "550e8400-e29b-41d4-a716-446655440006",
        "firstName": "Jane",
        "lastName": "Smith"
      }
    }
  ]
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Missing or invalid input fields |
| `INVALID_MATCH_STATUS` | 400 | Match is not in required status |
| `LOCK_CONFLICT` | 409 | Match already locked by another scorer |
| `SCORER_ALREADY_ACTIVE` | 409 | Scorer already scoring another match |
| `DUPLICATE_EMAIL` | 409 | Email already registered |
| `INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required role |
| `NOT_FOUND` | 404 | Resource not found |
| `LOCK_ACQUISITION_FAILED` | 500 | Database transaction failed |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

---

## Testing Workflow

### Step 1: Register Users
1. Register a scorer user
2. Register an admin user (you'll need to manually set role to 'admin' in database)

### Step 2: Login
1. Login with scorer credentials to get tokens
2. Login with admin credentials to get admin tokens

### Step 3: Create Teams (if needed)
- You may need to create teams first via database or API

### Step 4: Create Match
1. Use scorer token to create a match

### Step 5: Test Lock Mechanism
1. Start match with scorer 1 (acquires lock)
2. Try to start same match with scorer 2 (should fail with LOCK_CONFLICT)
3. Try to start different match with scorer 1 (should fail with SCORER_ALREADY_ACTIVE)

### Step 6: Test Admin Override
1. Use admin token to force release lock
2. Use admin token to reassign scorer

### Step 7: Test Audit Trail
1. Use admin token to view audit history

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- UUIDs are used for all IDs
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Scorer can only lock one match at a time
- Only the scorer who locked a match can end/abandon it
- Admin can override locks and reassign scorers
- All lock operations are atomic (SERIALIZABLE isolation)
- Audit logs track all lock state changes

