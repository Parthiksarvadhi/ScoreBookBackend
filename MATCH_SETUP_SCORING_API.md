# Match Setup & Scoring API Testing Guide

## Base URL
```
http://localhost:3000
```

---

## Complete Testing Flow

### Step 1: Register Users (if not already done)

**Endpoint:** `POST /auth/register`

**Payload:**
```json
{
  "email": "scorer1@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Scorer"
}
```

**Save:** User ID and token for later use

---

### Step 2: Login User

**Endpoint:** `POST /auth/login`

**Payload:**
```json
{
  "email": "scorer1@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "scorer1@example.com",
    "firstName": "John",
    "lastName": "Scorer",
    "role": "scorer"
  }
}
```

**Save:** `accessToken` for Authorization header

---

## Team & Player Setup

### Step 3: Create Team A

**Endpoint:** `POST /matches/teams`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Payload:**
```json
{
  "name": "India",
  "shortName": "IND"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "India",
  "shortName": "IND",
  "createdBy": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2024-02-08T10:00:00.000Z",
  "updatedAt": "2024-02-08T10:00:00.000Z"
}
```

**Save:** Team A ID = `550e8400-e29b-41d4-a716-446655440001`

---

### Step 4: Create Team B

**Endpoint:** `POST /matches/teams`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Payload:**
```json
{
  "name": "Australia",
  "shortName": "AUS"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "Australia",
  "shortName": "AUS",
  "createdBy": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2024-02-08T10:00:00.000Z",
  "updatedAt": "2024-02-08T10:00:00.000Z"
}
```

**Save:** Team B ID = `550e8400-e29b-41d4-a716-446655440002`

---

### Step 5: Add Players to Team A

**Endpoint:** `POST /matches/teams/550e8400-e29b-41d4-a716-446655440001/players`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Payload (Player 1):**
```json
{
  "name": "Virat Kohli",
  "jerseyNumber": 18,
  "role": "batsman"
}
```

**Response (201):**
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

**Repeat for more players (need 11 total):**

```json
{
  "name": "Rohit Sharma",
  "jerseyNumber": 45,
  "role": "batsman"
}
```

```json
{
  "name": "Jasprit Bumrah",
  "jerseyNumber": 93,
  "role": "bowler"
}
```

```json
{
  "name": "Hardik Pandya",
  "jerseyNumber": 31,
  "role": "all-rounder"
}
```

```json
{
  "name": "Ravindra Jadeja",
  "jerseyNumber": 8,
  "role": "all-rounder"
}
```

```json
{
  "name": "KL Rahul",
  "jerseyNumber": 1,
  "role": "batsman"
}
```

```json
{
  "name": "Suryakumar Yadav",
  "jerseyNumber": 63,
  "role": "batsman"
}
```

```json
{
  "name": "Axar Patel",
  "jerseyNumber": 78,
  "role": "all-rounder"
}
```

```json
{
  "name": "Yuzvendra Chahal",
  "jerseyNumber": 17,
  "role": "bowler"
}
```

```json
{
  "name": "Rishabh Pant",
  "jerseyNumber": 17,
  "role": "wicket-keeper"
}
```

```json
{
  "name": "Shubman Gill",
  "jerseyNumber": 77,
  "role": "batsman"
}
```

```json
{
  "name": "Mohammed Shami",
  "jerseyNumber": 11,
  "role": "bowler"
}
```

**Save:** All 11 player IDs for Team A

---

### Step 6: Add Players to Team B

**Endpoint:** `POST /matches/teams/550e8400-e29b-41d4-a716-446655440002/players`

**Add 11 players similarly:**

```json
{
  "name": "Steve Smith",
  "jerseyNumber": 49,
  "role": "batsman"
}
```

```json
{
  "name": "David Warner",
  "jerseyNumber": 31,
  "role": "batsman"
}
```

```json
{
  "name": "Pat Cummins",
  "jerseyNumber": 44,
  "role": "bowler"
}
```

```json
{
  "name": "Mitchell Starc",
  "jerseyNumber": 54,
  "role": "bowler"
}
```

```json
{
  "name": "Glenn Maxwell",
  "jerseyNumber": 32,
  "role": "all-rounder"
}
```

```json
{
  "name": "Marcus Stoinis",
  "jerseyNumber": 56,
  "role": "all-rounder"
}
```

```json
{
  "name": "Josh Hazlewood",
  "jerseyNumber": 70,
  "role": "bowler"
}
```

```json
{
  "name": "Tim David",
  "jerseyNumber": 6,
  "role": "batsman"
}
```

```json
{
  "name": "Matthew Wade",
  "jerseyNumber": 13,
  "role": "wicket-keeper"
}
```

```json
{
  "name": "Travis Head",
  "jerseyNumber": 17,
  "role": "batsman"
}
```

```json
{
  "name": "Adam Zampa",
  "jerseyNumber": 20,
  "role": "bowler"
}
```

**Save:** All 11 player IDs for Team B

---

### Step 7: List All Teams

**Endpoint:** `GET /matches/teams`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "India",
      "shortName": "IND",
      "createdAt": "2024-02-08T10:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Australia",
      "shortName": "AUS",
      "createdAt": "2024-02-08T10:00:00.000Z"
    }
  ]
}
```

---

### Step 8: List Players in Team A

**Endpoint:** `GET /matches/teams/550e8400-e29b-41d4-a716-446655440001/players`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
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
    ...
  ]
}
```

---

## Match Creation & Setup

### Step 9: Create Match

**Endpoint:** `POST /matches`

**Headers:**
```
Authorization: Bearer {accessToken}
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

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440100",
  "teamAId": "550e8400-e29b-41d4-a716-446655440001",
  "teamBId": "550e8400-e29b-41d4-a716-446655440002",
  "createdBy": "550e8400-e29b-41d4-a716-446655440000",
  "matchType": "T20",
  "status": "scheduled",
  "overs": 20,
  "venue": "Eden Gardens, Kolkata",
  "scorerId": null,
  "lockedAt": null,
  "tossWinnerId": null,
  "tossChoice": null,
  "teamACaptainId": null,
  "teamBCaptainId": null,
  "teamAPlaying11": null,
  "teamBPlaying11": null,
  "teamABattingOrder": null,
  "teamBBattingOrder": null,
  "createdAt": "2024-02-08T10:00:00.000Z",
  "updatedAt": "2024-02-08T10:00:00.000Z"
}
```

**Save:** Match ID = `550e8400-e29b-41d4-a716-446655440100`

---

### Step 10: Start Match (Acquire Lock)

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440100/start`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Payload:**
```json
{}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440100",
  "status": "live",
  "scorerId": "550e8400-e29b-41d4-a716-446655440000",
  "lockedAt": "2024-02-08T10:05:00.000Z",
  "startTime": "2024-02-08T10:05:00.000Z",
  "message": "Match started successfully"
}
```

---

### Step 11: Record Toss

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440100/toss`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Payload:**
```json
{
  "tossWinnerId": "550e8400-e29b-41d4-a716-446655440001",
  "tossChoice": "bat"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440100",
  "tossWinnerId": "550e8400-e29b-41d4-a716-446655440001",
  "tossChoice": "bat",
  "message": "Toss recorded successfully"
}
```

---

### Step 12: Select Playing 11 for Team A

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440100/playing-11`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Payload:**
```json
{
  "teamId": "550e8400-e29b-41d4-a716-446655440001",
  "playerIds": [
    "550e8400-e29b-41d4-a716-446655440010",
    "550e8400-e29b-41d4-a716-446655440011",
    "550e8400-e29b-41d4-a716-446655440012",
    "550e8400-e29b-41d4-a716-446655440013",
    "550e8400-e29b-41d4-a716-446655440014",
    "550e8400-e29b-41d4-a716-446655440015",
    "550e8400-e29b-41d4-a716-446655440016",
    "550e8400-e29b-41d4-a716-446655440017",
    "550e8400-e29b-41d4-a716-446655440018",
    "550e8400-e29b-41d4-a716-446655440019",
    "550e8400-e29b-41d4-a716-446655440020"
  ]
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440100",
  "teamAPlaying11": [
    "550e8400-e29b-41d4-a716-446655440010",
    ...
  ],
  "message": "Playing 11 selected successfully"
}
```

---

### Step 13: Select Playing 11 for Team B

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440100/playing-11`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Payload:**
```json
{
  "teamId": "550e8400-e29b-41d4-a716-446655440002",
  "playerIds": [
    "550e8400-e29b-41d4-a716-446655440030",
    "550e8400-e29b-41d4-a716-446655440031",
    ...
  ]
}
```

---

### Step 14: Designate Captain for Team A

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440100/captain`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Payload:**
```json
{
  "teamId": "550e8400-e29b-41d4-a716-446655440001",
  "captainId": "550e8400-e29b-41d4-a716-446655440010"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440100",
  "teamACaptainId": "550e8400-e29b-41d4-a716-446655440010",
  "message": "Captain designated successfully"
}
```

---

### Step 15: Designate Captain for Team B

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440100/captain`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Payload:**
```json
{
  "teamId": "550e8400-e29b-41d4-a716-446655440002",
  "captainId": "550e8400-e29b-41d4-a716-446655440030"
}
```

---

### Step 16: Set Batting Order for Team A

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440100/batting-order`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Payload:**
```json
{
  "teamId": "550e8400-e29b-41d4-a716-446655440001",
  "playerIds": [
    "550e8400-e29b-41d4-a716-446655440010",
    "550e8400-e29b-41d4-a716-446655440011",
    "550e8400-e29b-41d4-a716-446655440012",
    "550e8400-e29b-41d4-a716-446655440013",
    "550e8400-e29b-41d4-a716-446655440014",
    "550e8400-e29b-41d4-a716-446655440015",
    "550e8400-e29b-41d4-a716-446655440016",
    "550e8400-e29b-41d4-a716-446655440017",
    "550e8400-e29b-41d4-a716-446655440018",
    "550e8400-e29b-41d4-a716-446655440019",
    "550e8400-e29b-41d4-a716-446655440020"
  ]
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440100",
  "teamABattingOrder": [...],
  "message": "Batting order set successfully"
}
```

---

### Step 17: Set Batting Order for Team B

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440100/batting-order`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Payload:**
```json
{
  "teamId": "550e8400-e29b-41d4-a716-446655440002",
  "playerIds": [...]
}
```

---

### Step 18: Get Match Setup Info

**Endpoint:** `GET /matches/550e8400-e29b-41d4-a716-446655440100/setup`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440100",
  "toss": {
    "winnerId": "550e8400-e29b-41d4-a716-446655440001",
    "choice": "bat"
  },
  "teamA": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "India",
    "playing11": [...],
    "captainId": "550e8400-e29b-41d4-a716-446655440010",
    "battingOrder": [...]
  },
  "teamB": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Australia",
    "playing11": [...],
    "captainId": "550e8400-e29b-41d4-a716-446655440030",
    "battingOrder": [...]
  }
}
```

---

## Ball-by-Ball Scoring

### Step 19: Record First Ball

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440100/balls`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Payload:**
```json
{
  "over": 1,
  "ballNumber": 1,
  "batsmanId": "550e8400-e29b-41d4-a716-446655440010",
  "bowlerId": "550e8400-e29b-41d4-a716-446655440030",
  "runs": 0,
  "isWicket": false,
  "extras": "none",
  "extraRuns": 0
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440200",
  "matchId": "550e8400-e29b-41d4-a716-446655440100",
  "over": 1,
  "ballNumber": 1,
  "batsmanId": "550e8400-e29b-41d4-a716-446655440010",
  "bowlerId": "550e8400-e29b-41d4-a716-446655440030",
  "runs": 0,
  "isWicket": false,
  "extras": "none",
  "extraRuns": 0,
  "isValid": true,
  "createdAt": "2024-02-08T10:05:30.000Z"
}
```

---

### Step 20: Record Ball with Runs

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440100/balls`

**Payload:**
```json
{
  "over": 1,
  "ballNumber": 2,
  "batsmanId": "550e8400-e29b-41d4-a716-446655440010",
  "bowlerId": "550e8400-e29b-41d4-a716-446655440030",
  "runs": 4,
  "isWicket": false,
  "extras": "none",
  "extraRuns": 0
}
```

---

### Step 21: Record Ball with Wicket

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440100/balls`

**Payload:**
```json
{
  "over": 1,
  "ballNumber": 3,
  "batsmanId": "550e8400-e29b-41d4-a716-446655440011",
  "bowlerId": "550e8400-e29b-41d4-a716-446655440030",
  "runs": 0,
  "isWicket": true,
  "wicketType": "bowled",
  "extras": "none",
  "extraRuns": 0
}
```

---

### Step 22: Record Ball with Wide

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440100/balls`

**Payload:**
```json
{
  "over": 1,
  "ballNumber": 3,
  "batsmanId": "550e8400-e29b-41d4-a716-446655440010",
  "bowlerId": "550e8400-e29b-41d4-a716-446655440030",
  "runs": 0,
  "isWicket": false,
  "extras": "wide",
  "extraRuns": 1
}
```

---

### Step 23: Get All Balls

**Endpoint:** `GET /matches/550e8400-e29b-41d4-a716-446655440100/balls`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?page=1&limit=20
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440200",
      "over": 1,
      "ballNumber": 1,
      "batsmanId": "550e8400-e29b-41d4-a716-446655440010",
      "bowlerId": "550e8400-e29b-41d4-a716-446655440030",
      "runs": 0,
      "isWicket": false,
      "extras": "none",
      "batsman": {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "name": "Virat Kohli",
        "jerseyNumber": 18
      },
      "bowler": {
        "id": "550e8400-e29b-41d4-a716-446655440030",
        "name": "Steve Smith",
        "jerseyNumber": 49
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "pages": 6
  }
}
```

---

### Step 24: Update a Ball

**Endpoint:** `PUT /matches/550e8400-e29b-41d4-a716-446655440100/balls/550e8400-e29b-41d4-a716-446655440200`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Payload:**
```json
{
  "runs": 1
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440200",
  "runs": 1,
  "message": "Ball updated successfully"
}
```

---

### Step 25: Delete a Ball

**Endpoint:** `DELETE /matches/550e8400-e29b-41d4-a716-446655440100/balls/550e8400-e29b-41d4-a716-446655440200`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "message": "Ball deleted successfully"
}
```

---

### Step 26: Get Match Scorecard

**Endpoint:** `GET /matches/550e8400-e29b-41d4-a716-446655440100/scorecard`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440100",
  "teamA": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "India",
    "runs": 45,
    "wickets": 2,
    "overs": "5.3",
    "runRate": 8.18,
    "players": [
      {
        "playerId": "550e8400-e29b-41d4-a716-446655440010",
        "playerName": "Virat Kohli",
        "batting": {
          "runs": 25,
          "ballsFaced": 18,
          "strikeRate": 138.89
        },
        "bowling": {
          "wickets": 0,
          "runs": 0,
          "overs": "0.0",
          "economy": 0
        }
      }
    ]
  },
  "teamB": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Australia",
    "runs": 38,
    "wickets": 1,
    "overs": "4.2",
    "runRate": 8.76,
    "players": [...]
  }
}
```

---

### Step 27: End Match

**Endpoint:** `POST /matches/550e8400-e29b-41d4-a716-446655440100/end`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Payload:**
```json
{}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440100",
  "status": "completed",
  "scorerId": null,
  "lockedAt": null,
  "endTime": "2024-02-08T11:30:00.000Z",
  "message": "Match ended successfully"
}
```

---

## Testing Checklist

- [ ] Step 1: Register user
- [ ] Step 2: Login user
- [ ] Step 3: Create Team A
- [ ] Step 4: Create Team B
- [ ] Step 5: Add 11 players to Team A
- [ ] Step 6: Add 11 players to Team B
- [ ] Step 7: List all teams
- [ ] Step 8: List players in Team A
- [ ] Step 9: Create match
- [ ] Step 10: Start match
- [ ] Step 11: Record toss
- [ ] Step 12: Select playing 11 for Team A
- [ ] Step 13: Select playing 11 for Team B
- [ ] Step 14: Designate captain for Team A
- [ ] Step 15: Designate captain for Team B
- [ ] Step 16: Set batting order for Team A
- [ ] Step 17: Set batting order for Team B
- [ ] Step 18: Get match setup info
- [ ] Step 19: Record first ball
- [ ] Step 20: Record ball with runs
- [ ] Step 21: Record ball with wicket
- [ ] Step 22: Record ball with wide
- [ ] Step 23: Get all balls
- [ ] Step 24: Update a ball
- [ ] Step 25: Delete a ball
- [ ] Step 26: Get match scorecard
- [ ] Step 27: End match

