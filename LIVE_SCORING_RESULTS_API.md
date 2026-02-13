# Live Scoring & Match Results API Testing Guide

## Base URL
```
http://localhost:3000
```

---

## Live Scoring & Match Results Endpoints

### Step 1: Get Live Score (During Match)

**Endpoint:** `GET /matches/{matchId}/live-score`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "matchId": "550e8400-e29b-41d4-a716-446655440100",
  "currentInnings": 1,
  "battingTeam": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "India",
    "runs": 45,
    "wickets": 2,
    "overs": "5.3",
    "runRate": 8.18
  },
  "fieldingTeam": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Australia"
  },
  "target": null,
  "requiredRunRate": null,
  "ballsRemaining": 114,
  "wicketsRemaining": 8,
  "timestamp": "2024-02-08T10:05:30.000Z"
}
```

**What it shows:**
- Current runs and wickets
- Overs completed (5.3 = 5 overs and 3 balls)
- Current run rate (8.18 runs per over)
- Balls and wickets remaining
- No target yet (first innings)

---

### Step 2: Get Innings Information

**Endpoint:** `GET /matches/{matchId}/innings`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "matchId": "550e8400-e29b-41d4-a716-446655440100",
  "currentInnings": 1,
  "firstInnings": {
    "status": "pending",
    "runs": null,
    "wickets": null,
    "overs": null
  },
  "secondInnings": {
    "status": "pending",
    "runs": null,
    "wickets": null,
    "overs": null
  },
  "target": null
}
```

**What it shows:**
- Which innings is currently active (1 or 2)
- Status of each innings (pending or completed)
- Runs, wickets, and overs for each innings
- Target for second innings (if applicable)

---

### Step 3: Complete First Innings

**Endpoint:** `POST /matches/{matchId}/innings/complete`

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
  "matchId": "550e8400-e29b-41d4-a716-446655440100",
  "currentInnings": 2,
  "firstInningsTotal": 156,
  "target": 157,
  "message": "First innings completed successfully"
}
```

**What it does:**
- Marks first innings as complete
- Calculates target for second innings (156 + 1 = 157)
- Switches to second innings
- Now second team starts batting

---

### Step 4: Get Live Score (Second Innings)

**Endpoint:** `GET /matches/{matchId}/live-score`

**Response (200):**
```json
{
  "matchId": "550e8400-e29b-41d4-a716-446655440100",
  "currentInnings": 2,
  "battingTeam": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Australia",
    "runs": 45,
    "wickets": 1,
    "overs": "4.2",
    "runRate": 10.5
  },
  "fieldingTeam": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "India"
  },
  "target": 157,
  "requiredRunRate": 7.85,
  "ballsRemaining": 98,
  "wicketsRemaining": 9,
  "timestamp": "2024-02-08T10:30:00.000Z"
}
```

**What it shows:**
- Second team batting now
- Target is 157 runs
- Required run rate is 7.85 (need 157 runs in remaining overs)
- Current run rate is 10.5 (ahead of required rate)
- 98 balls remaining (16.3 overs)

---

### Step 5: Get Run Rates

**Endpoint:** `GET /matches/{matchId}/run-rates`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "matchId": "550e8400-e29b-41d4-a716-446655440100",
  "currentRunRate": 10.5,
  "requiredRunRate": 7.85,
  "runRateDifference": 2.65,
  "oversCompleted": "4.2",
  "oversRemaining": "15.4"
}
```

**What it shows:**
- Current run rate: 10.5 runs per over
- Required run rate: 7.85 runs per over
- Difference: +2.65 (batting team is ahead)
- Overs completed: 4.2
- Overs remaining: 15.4

---

### Step 6: Complete Second Innings

**Endpoint:** `POST /matches/{matchId}/innings/complete`

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
  "matchId": "550e8400-e29b-41d4-a716-446655440100",
  "currentInnings": 2,
  "secondInningsTotal": 161,
  "message": "Second innings completed successfully"
}
```

**What it does:**
- Marks second innings as complete
- Match is now complete
- Winner will be determined based on runs

---

### Step 7: Get Match Result

**Endpoint:** `GET /matches/{matchId}/result`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "matchId": "550e8400-e29b-41d4-a716-446655440100",
  "status": "completed",
  "result": {
    "resultType": "win-by-runs",
    "winnerTeamId": "550e8400-e29b-41d4-a716-446655440002",
    "winnerTeamName": "Australia",
    "margin": 5,
    "marginType": "runs"
  },
  "firstInnings": {
    "teamId": "550e8400-e29b-41d4-a716-446655440001",
    "teamName": "India",
    "runs": 156,
    "wickets": 8,
    "overs": "20.0"
  },
  "secondInnings": {
    "teamId": "550e8400-e29b-41d4-a716-446655440002",
    "teamName": "Australia",
    "runs": 161,
    "wickets": 5,
    "overs": "19.2"
  }
}
```

**What it shows:**
- Match result: Australia won by 5 runs
- First innings: India scored 156/8 in 20 overs
- Second innings: Australia scored 161/5 in 19.2 overs
- Winner: Australia
- Margin: 5 runs

---

## Different Match Scenarios

### Scenario 1: Team Wins by Wickets

**First Innings:** Team A scores 150/10 in 20 overs
**Second Innings:** Team B scores 155/3 in 18 overs

**Result:**
```json
{
  "resultType": "win-by-runs",
  "winnerTeamId": "teamB",
  "margin": 5,
  "marginType": "runs"
}
```

---

### Scenario 2: Tie Match

**First Innings:** Team A scores 150/8 in 20 overs
**Second Innings:** Team B scores 150/5 in 20 overs

**Result:**
```json
{
  "resultType": "tie",
  "winnerTeamId": null,
  "margin": 0
}
```

---

### Scenario 3: Team Loses All Wickets

**First Innings:** Team A scores 180/10 in 18 overs
**Second Innings:** Team B scores 120/10 in 15 overs (all out)

**Result:**
```json
{
  "resultType": "win-by-runs",
  "winnerTeamId": "teamA",
  "margin": 60,
  "marginType": "runs"
}
```

---

## Complete Testing Flow

1. **Create match** (POST /matches)
2. **Start match** (POST /matches/:id/start)
3. **Record toss** (POST /matches/:id/toss)
4. **Select playing 11** (POST /matches/:id/playing-11)
5. **Designate captains** (POST /matches/:id/captain)
6. **Set batting order** (POST /matches/:id/batting-order)
7. **Record balls** (POST /matches/:id/balls) - Record 120 balls for 20 overs
8. **Check live score** (GET /matches/:id/live-score) - After each over
9. **Check run rates** (GET /matches/:id/run-rates) - Monitor pace
10. **Complete first innings** (POST /matches/:id/innings/complete)
11. **Check innings info** (GET /matches/:id/innings) - See target
12. **Record second innings balls** (POST /matches/:id/balls) - Record 120 balls
13. **Check live score** (GET /matches/:id/live-score) - Monitor second innings
14. **Complete second innings** (POST /matches/:id/innings/complete)
15. **Get match result** (GET /matches/:id/result) - See winner

---

## Key Concepts

### Overs Format
- `5.3` means 5 complete overs and 3 balls
- Each over has 6 valid balls (excludes wides, no-balls)
- `20.0` means 20 complete overs (120 balls)

### Run Rate
- Current Run Rate = Total Runs / Overs Completed
- Required Run Rate = Runs Needed / Overs Remaining
- If CRR > RRR, batting team is ahead

### Target
- Target = First Innings Runs + 1
- Second team needs to score more than first team's total

### Match Completion
- Match ends when all overs are bowled
- Match ends when all 10 wickets are lost
- Match ends when target is reached (second innings)
- Match ends when target cannot be reached

---

## Testing Checklist

- [ ] Get live score during first innings
- [ ] Get innings information
- [ ] Get run rates
- [ ] Complete first innings
- [ ] Get live score during second innings
- [ ] Get run rates (with target and required rate)
- [ ] Complete second innings
- [ ] Get match result
- [ ] Verify winner determination
- [ ] Verify margin calculation
- [ ] Test tie scenario
- [ ] Test all-out scenario

