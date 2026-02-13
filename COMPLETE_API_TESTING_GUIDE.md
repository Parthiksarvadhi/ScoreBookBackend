# Complete API Testing Guide - All Endpoints & Payloads

## Base URL
```
http://localhost:3000
```

---

## 1. REGISTER USER

**Endpoint:** `POST /auth/register`

**Headers:**
```
Content-Type: application/json
```

**Payload:**
```json
{
  "email": "scorer1@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Scorer"
}
```

**Expected Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "scorer1@example.com",
  "firstName": "John",
  "lastName": "Scorer",
  "role": "scorer"
}
```

---

## 2. LOGIN USER

**Endpoint:** `POST /auth/login`

**Headers:**
```
Content-Type: application/json
```

**Payload:**
```json
{
  "email": "scorer1@example.com",
  "password": "SecurePass123"
}
```

**Expected Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJyb2xlIjoic2NvcmVyIiwiaWF0IjoxNzA3MzQwMDAwLCJleHAiOjE3MDczNDA5MDB9.xxx",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJpYXQiOjE3MDczNDAwMDAsImV4cCI6MTcwNzk0NDgwMH0.xxx",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "scorer1@example.com",
    "firstName": "John",
    "lastName": "Scorer",
    "role": "scorer"
  }
}
```

**Save these for later use:**
- `accessToken` → Use in Authorization header
- `refreshToken` → Use for token refresh

---

## 3. REFRESH TOKEN

**Endpoint:** `POST /auth/refresh`

**Headers:**
```
Content-Type: application/json
```

**Payload:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Expected Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 4. GET CURRENT USER

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Payload:** None

**Expected Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "scorer1@example.com",
  "firstName": "John",
  "lastName": "Scorer",
  "role": "scorer"
}
```

---

## 5. CREATE TEAM

**Endpoint:** `POST /matches/teams`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Payload:**
```json
{
  "name": "Team A",
  "shortName": "TA"
}
```

**Expected Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Team A",
  "shortName": "TA",
  "createdBy": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2024-02-08T10:00:00.000Z",
  "updatedAt": "2024-02-08T10:00:00.000Z"
}
```

**Save:** `id` → Use as `teamAId` in match creation

---

## 6. CREATE SECOND TEAM

**Endpoint:** `POST /matches/teams`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Payload:**
```json
{
  "name": "Team B",
  "shortName": "TB"
}
```

**Expected Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "Team B",
  "shortName": "TB",
  "createdBy": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2024-02-08T10:00:00.000Z",
  "updatedAt": "2024-02-08T10:00:00.000Z"
}
```

**Save:** `id` → Use as `teamBId` in match creation

---

## 7. LIST TEAMS

**Endpoint:** `GET /matches/teams`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Team A",
      "shortName": "TA",
      "createdAt": "2024-02-08T10:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Team B",
      "shortName": "TB",
      "createdAt": "2024-02-08T10:00:00.000Z"
    }
  ]
}
```

---

## 8. ADD PLAYER TO TEAM A

**Endpoint:** `POST /matches/teams/550e8400-e29b-41d4-a716-446655440001/players`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Payload:**
```json
{
  "name": "Virat Kohli",
  "jerseyNumber": 18,
  "role": "batsman"
}
```

**Expected Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "teamId": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Virat Kohli",
  "jerseyNumber": 18,
  "role": "batsman",
  "createdAt": "2024-02-08T10:00:00.000Z"
}
```

---

## 9. ADD MORE PLAYERS TO TEAM A

**Endpoint:** `POST /matches/teams/550e8400-e29b-41d4-a716-446655440001/players`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Payload:**
```json
{
  "name": "Jasprit Bumrah",
  "jerseyNumber": 93,
  "role": "bowler"
}
```

**Expected Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440011",
  "teamId": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Jasprit Bumrah",
  "jerseyNumber": 93,
  "role": "bowler",
  "createdAt": "2024-02-08T10:00:00.000Z"
}
```

---

## 10. LIST PLAYERS IN TEAM A

**Endpoint:** `GET /matches/teams/550e8400-e29b-41d4-a716-446655440001/players`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "name": "Virat Kohli",
      "jerseyNumber": 18,
      "role": "batsman",
      "createdAt": "2024-02-08T10:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "name": "Jasprit Bumrah",
      "jerseyNumber": 93,
      "role": "bowler",
      "createdAt": "2024-02-08T10:00:00.000Z"
    }
  ]
}
```

---

## 11. ADD PLAYERS TO TEAM B

**Endpoint:** `POST /matches/teams/550e8400-e29b-41d4-a716-446655440002/players`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Payload:**
```json
{
  "name": "Steve Smith",
  "jerseyNumber": 49,
  "role": "batsman"
}
```

**Expected Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440012",
  "teamId": "550e8400-e29b-41d4-a716-446655440002",
  "name": "Steve Smith",
  "jerseyNumber": 49,
  "role": "batsman",
  "createdAt": "2024-02-08T10:00:00.000Z"
}
```

---

## 12. CREATE MATCH

**Endpoint:** `POST /matches`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Payload:**
```json
{
  "teamAId": "550e8400-e29b-41d4-a716-446655440001",
  "teamBId": "550e8400-e29b-41d4-a716-446655440002",
  "matchType": "T20",
  "overs": 20,
  "venue": "Eden Gardens, Kolkata"
}
```

**Expected Response (201):**
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
  "createdAt": "2024-02-08T10:00:00.000Z",
  "updatedAt": "2024-02-08T10:00:00.000Z"
}
```

**Save:** `id` → Use as `{matchId}` in next requests

---

## 9. LIST MATCHES

**Endpoint:** `GET /matches?status=scheduled&page=1&limit=20`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `status` (optional): scheduled, live, completed, abandoned
- `scorerId` (optional): filter by scorer
- `page` (optional): default 1
- `limit` (optional): default 20

**Expected Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "teamAId": "550e8400-e29b-41d4-a716-446655440001",
      "teamBId": "550e8400-e29b-41d4-a716-446655440002",
      "status": "scheduled",
      "scorerId": null,
      "scorer": null,
      "startTime": null,
      "createdAt": "2024-02-08T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

---

## 10. GET MATCH DETAILS

**Endpoint:** `GET /matches/550e8400-e29b-41d4-a716-446655440003`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Payload:** None

**Expected Response (200):**
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
  "scorer": null,
  "teamA": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Team A"
  },
  "teamB": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Team B"
  },
  "createdAt": "2024-02-08T10:00:00.000Z",
  "updatedAt": "2024-02-08T10:00:00.000Z"
}
```

---

## 11. START MATCH (ACQUIRE LOCK)

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440003/start`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Payload:**
```json
{}
```

**Expected Response (200):**
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
  "lockedAt": "2024-02-08T10:05:00.000Z",
  "startTime": "2024-02-08T10:05:00.000Z",
  "endTime": null,
  "winner": null,
  "message": "Match started successfully",
  "createdAt": "2024-02-08T10:00:00.000Z",
  "updatedAt": "2024-02-08T10:05:00.000Z"
}
```

---

## 12. END MATCH (RELEASE LOCK)

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440003/end`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Payload:**
```json
{}
```

**Expected Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "status": "completed",
  "scorerId": null,
  "lockedAt": null,
  "endTime": "2024-02-08T11:30:00.000Z",
  "message": "Match ended successfully"
}
```

---

## 13. ABANDON MATCH

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440003/abandon`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Payload:**
```json
{}
```

**Expected Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "status": "abandoned",
  "scorerId": null,
  "lockedAt": null,
  "endTime": "2024-02-08T11:30:00.000Z",
  "message": "Match abandoned successfully"
}
```

---

## 14. ADMIN FORCE RELEASE LOCK

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440003/admin/override`

**Headers:**
```
Authorization: Bearer {adminAccessToken}
Content-Type: application/json
```

**Payload:**
```json
{
  "action": "force_release",
  "reason": "Scorer became unresponsive"
}
```

**Expected Response (200):**
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

## 15. ADMIN REASSIGN SCORER

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440003/admin/override`

**Headers:**
```
Authorization: Bearer {adminAccessToken}
Content-Type: application/json
```

**Payload:**
```json
{
  "action": "reassign_scorer",
  "newScorerId": "550e8400-e29b-41d4-a716-446655440005",
  "reason": "Original scorer had technical issues"
}
```

**Expected Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "status": "live",
  "scorerId": "550e8400-e29b-41d4-a716-446655440005",
  "lockedAt": "2024-02-08T10:15:00.000Z",
  "message": "Admin override completed successfully"
}
```

---

## 16. GET AUDIT HISTORY

**Endpoint:** `GET /matches/550e8400-e29b-41d4-a716-446655440003/audit`

**Headers:**
```
Authorization: Bearer {adminAccessToken}
```

**Payload:** None

**Expected Response (200):**
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
      "timestamp": "2024-02-08T10:05:00.000Z",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "firstName": "John",
        "lastName": "Scorer"
      },
      "scorer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "firstName": "John",
        "lastName": "Scorer"
      }
    }
  ]
}
```

---

## ERROR RESPONSES

### Lock Conflict Error (409)
```json
{
  "error": {
    "code": "LOCK_CONFLICT",
    "message": "Match is already being scored by another scorer",
    "details": {
      "matchId": "550e8400-e29b-41d4-a716-446655440003",
      "currentScorerId": "550e8400-e29b-41d4-a716-446655440005",
      "currentScorerName": "Jane Smith",
      "lockedAt": "2024-02-08T10:05:00.000Z"
    }
  }
}
```

### Scorer Already Active Error (409)
```json
{
  "error": {
    "code": "SCORER_ALREADY_ACTIVE",
    "message": "Scorer is already actively scoring another match",
    "details": {
      "scorerId": "550e8400-e29b-41d4-a716-446655440000",
      "activeMatchId": "550e8400-e29b-41d4-a716-446655440004",
      "activeMatchTeams": "Team C vs Team D",
      "lockedAt": "2024-02-08T09:00:00.000Z"
    }
  }
}
```

### Invalid Status Error (400)
```json
{
  "error": {
    "code": "INVALID_MATCH_STATUS",
    "message": "Match must be in 'live' status to end. Current status: scheduled",
    "details": {
      "matchId": "550e8400-e29b-41d4-a716-446655440003",
      "currentStatus": "scheduled",
      "requiredStatus": "live"
    }
  }
}
```

### Unauthorized Error (401)
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Only the scorer who locked the match can end it",
    "details": {
      "matchId": "550e8400-e29b-41d4-a716-446655440003",
      "expectedScorerId": "550e8400-e29b-41d4-a716-446655440005",
      "requestingScorerId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

### Insufficient Permissions Error (403)
```json
{
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "This action requires one of the following roles: admin",
    "details": {
      "requiredRoles": ["admin"],
      "userRole": "scorer"
    }
  }
}
```

---

## TESTING CHECKLIST

- [ ] Register 2 scorers
- [ ] Register 1 admin
- [ ] Login all 3 users
- [ ] Create Team A
- [ ] Create Team B
- [ ] Add players to Team A
- [ ] Add players to Team B
- [ ] Create match with Team A and Team B
- [ ] Scorer 1 starts match (should succeed)
- [ ] Scorer 2 tries to start same match (should fail - LOCK_CONFLICT)
- [ ] Scorer 1 tries to start different match (should fail - SCORER_ALREADY_ACTIVE)
- [ ] Admin force releases lock
- [ ] Admin reassigns scorer
- [ ] View audit history
- [ ] End match
- [ ] Verify all status transitions

