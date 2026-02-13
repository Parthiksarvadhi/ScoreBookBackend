# ScoreBook Database Schema

## Overview
PostgreSQL relational database with 5 core entities for cricket match scoring and analytics.

## Entity Relationship Diagram

```
Users (1) ──── (M) Matches
  │
  ├──── (M) Teams
  │
  └──── (M) Matches (as creator)

Teams (1) ──── (M) Players
  │
  └──── (M) Matches (as teamA/teamB)

Matches (1) ──── (M) Balls

Players (1) ──── (M) Balls (as batsman)
Players (1) ──── (M) Balls (as bowler)
```

## Tables

### 1. Users
Stores user accounts with authentication and role-based access.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| email | STRING | UNIQUE, NOT NULL | User email |
| password | STRING | NOT NULL | Hashed password |
| firstName | STRING | NOT NULL | First name |
| lastName | STRING | NOT NULL | Last name |
| role | ENUM | DEFAULT: 'scorer' | admin, scorer, viewer |
| createdAt | DATE | DEFAULT: NOW | Creation timestamp |
| updatedAt | DATE | DEFAULT: NOW | Update timestamp |

**Roles:**
- `admin`: Full system access
- `scorer`: Can create/edit matches and record balls
- `viewer`: Read-only access to matches

---

### 2. Teams
Represents cricket teams with players.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | STRING | NOT NULL | Full team name |
| shortName | STRING(10) | NOT NULL | 3-4 letter abbreviation |
| createdBy | UUID | FK → Users | Team creator |
| createdAt | DATE | DEFAULT: NOW | Creation timestamp |
| updatedAt | DATE | DEFAULT: NOW | Update timestamp |

---

### 3. Players
Individual players belonging to teams.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| teamId | UUID | FK → Teams | Team association |
| name | STRING | NOT NULL | Player name |
| jerseyNumber | INTEGER | NOT NULL | Jersey number |
| role | ENUM | NOT NULL | batsman, bowler, all-rounder, wicket-keeper |
| createdAt | DATE | DEFAULT: NOW | Creation timestamp |
| updatedAt | DATE | DEFAULT: NOW | Update timestamp |

---

### 4. Matches
Cricket match records with teams, status, and metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| teamAId | UUID | FK → Teams | First team |
| teamBId | UUID | FK → Teams | Second team |
| createdBy | UUID | FK → Users | Match creator |
| matchType | ENUM | DEFAULT: 'T20' | T20, ODI, Test, Custom |
| status | ENUM | DEFAULT: 'scheduled' | scheduled, live, completed, abandoned |
| overs | INTEGER | DEFAULT: 20 | Total overs in match |
| venue | STRING | | Match location |
| startTime | DATE | | Match start time |
| endTime | DATE | | Match end time |
| winner | ENUM | | teamA, teamB, tie, no-result |
| createdAt | DATE | DEFAULT: NOW | Creation timestamp |
| updatedAt | DATE | DEFAULT: NOW | Update timestamp |

**Match Types:**
- `T20`: 20 overs per side
- `ODI`: 50 overs per side
- `Test`: Unlimited overs
- `Custom`: User-defined format

**Match Status:**
- `scheduled`: Not started
- `live`: Currently in progress
- `completed`: Finished
- `abandoned`: Cancelled

---

### 5. Balls
Ball-by-ball cricket events with runs, wickets, and extras.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| matchId | UUID | FK → Matches | Associated match |
| over | INTEGER | NOT NULL | Over number (0-indexed) |
| ballNumber | INTEGER | NOT NULL | Ball in over (1-6) |
| batsmanId | UUID | FK → Players | Batting player |
| bowlerId | UUID | FK → Players | Bowling player |
| runs | INTEGER | DEFAULT: 0 | Runs scored off bat |
| isWicket | BOOLEAN | DEFAULT: false | Wicket fell |
| wicketType | ENUM | | bowled, lbw, caught, stumped, run-out, hit-wicket, handled-ball, obstructing-field |
| extras | ENUM | DEFAULT: 'none' | none, wide, no-ball, bye, leg-bye |
| extraRuns | INTEGER | DEFAULT: 0 | Extra runs (wides, no-balls, byes) |
| isValid | BOOLEAN | DEFAULT: true | Valid delivery |
| createdAt | DATE | DEFAULT: NOW | Creation timestamp |
| updatedAt | DATE | DEFAULT: NOW | Update timestamp |

**Wicket Types:**
- `bowled`: Bowler hit stumps
- `lbw`: Leg before wicket
- `caught`: Fielder caught ball
- `stumped`: Wicket-keeper stumped
- `run-out`: Runner out of crease
- `hit-wicket`: Batter hit own stumps
- `handled-ball`: Batter handled ball
- `obstructing-field`: Batter obstructed field

**Extras:**
- `none`: Regular delivery
- `wide`: Ball too wide
- `no-ball`: Illegal delivery
- `bye`: Ball missed bat, runs scored
- `leg-bye`: Ball hit leg, runs scored

---

## Key Relationships

1. **User → Match**: One user creates many matches
2. **User → Team**: One user creates many teams
3. **Team → Player**: One team has many players
4. **Match → Ball**: One match has many balls
5. **Player → Ball**: One player bats/bowls in many balls

## Indexes (Recommended)

```sql
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_createdBy ON matches(createdBy);
CREATE INDEX idx_balls_matchId ON balls(matchId);
CREATE INDEX idx_balls_over_ball ON balls(matchId, over, ballNumber);
CREATE INDEX idx_players_teamId ON players(teamId);
CREATE INDEX idx_teams_createdBy ON teams(createdBy);
```

## Database Setup

### Create Database
```bash
createdb scorebook_dev
createdb scorebook_test
createdb scorebook_prod
```

### Run Migrations
```bash
npx sequelize-cli db:migrate
```

### Seed Data (Optional)
```bash
npx sequelize-cli db:seed:all
```
