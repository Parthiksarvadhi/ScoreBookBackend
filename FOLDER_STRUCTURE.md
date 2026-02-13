# Backend Folder Structure

## Directory Layout

```
backend/
├── app.js                          # Express app entry point
├── package.json                    # Dependencies
├── DATABASE_SCHEMA.md              # Database documentation
├── FOLDER_STRUCTURE.md             # This file
│
├── public/                         # Static files
│   ├── css/
│   └── images/
│
└── src/
    ├── config/
    │   └── config.json             # Database configuration (PostgreSQL)
    │
    ├── models/                     # Sequelize ORM models
    │   ├── index.js                # Model initialization & associations
    │   ├── User.js                 # User model
    │   ├── Team.js                 # Team model
    │   ├── Player.js               # Player model
    │   ├── Match.js                # Match model
    │   └── Ball.js                 # Ball-by-ball events model
    │
    ├── controllers/                # Request handlers (TO BE CREATED)
    │   ├── authController.js       # User authentication
    │   ├── matchController.js      # Match management
    │   ├── teamController.js       # Team management
    │   ├── playerController.js     # Player management
    │   └── ballController.js       # Ball recording
    │
    ├── routes/                     # API endpoints (TO BE CREATED)
    │   ├── index.js                # Route aggregator
    │   ├── authRoutes.js           # /api/auth/*
    │   ├── matchRoutes.js          # /api/matches/*
    │   ├── teamRoutes.js           # /api/teams/*
    │   ├── playerRoutes.js         # /api/players/*
    │   └── ballRoutes.js           # /api/balls/*
    │
    ├── middleware/                 # Express middleware
    │   ├── errorHandler.js         # Global error handling
    │   ├── asyncHandler.js         # Async/await wrapper
    │   ├── authMiddleware.js       # JWT authentication (TO BE CREATED)
    │   └── validationMiddleware.js # Input validation (TO BE CREATED)
    │
    ├── utils/                      # Utility functions
    │   ├── errors.js               # Custom error classes
    │   ├── constants.js            # App constants
    │   ├── validators.js           # Input validators (TO BE CREATED)
    │   └── helpers.js              # Helper functions (TO BE CREATED)
    │
    ├── services/                   # Business logic (TO BE CREATED)
    │   ├── authService.js          # Auth logic
    │   ├── matchService.js         # Match logic
    │   ├── teamService.js          # Team logic
    │   ├── playerService.js        # Player logic
    │   └── ballService.js          # Ball logic
    │
    ├── migrations/                 # Database migrations
    │   ├── [timestamp]-create-users.js
    │   ├── [timestamp]-create-teams.js
    │   ├── [timestamp]-create-players.js
    │   ├── [timestamp]-create-matches.js
    │   ├── [timestamp]-create-balls.js
    │   └── seeders/                # Seed data
    │       └── [timestamp]-demo-data.js
    │
    └── websocket/                  # Socket.IO real-time (TO BE CREATED)
        ├── socketHandler.js        # Socket event handlers
        └── events.js               # Event definitions
```

## File Purposes

### Core Files
- **app.js**: Express server setup, middleware configuration, route mounting
- **package.json**: Dependencies (express, sequelize, pg, socket.io, jwt, etc.)

### Models (`src/models/`)
- **User.js**: User accounts with roles (admin, scorer, viewer)
- **Team.js**: Cricket teams with metadata
- **Player.js**: Individual players with roles (batsman, bowler, etc.)
- **Match.js**: Cricket matches with status and results
- **Ball.js**: Ball-by-ball events (runs, wickets, extras)

### Controllers (`src/controllers/`)
Handle HTTP requests and call services. Example:
```javascript
// matchController.js
exports.createMatch = async (req, res, next) => {
  // Validate input
  // Call matchService.createMatch()
  // Return response
};
```

### Routes (`src/routes/`)
Define API endpoints. Example:
```javascript
// matchRoutes.js
router.post('/', createMatch);
router.get('/:id', getMatch);
router.put('/:id', updateMatch);
```

### Middleware (`src/middleware/`)
- **errorHandler.js**: Catches and formats errors
- **asyncHandler.js**: Wraps async route handlers
- **authMiddleware.js**: JWT verification
- **validationMiddleware.js**: Input validation

### Utils (`src/utils/`)
- **errors.js**: Custom error classes (ValidationError, NotFoundError, etc.)
- **constants.js**: Enums and constants (MATCH_TYPES, USER_ROLES, etc.)
- **validators.js**: Input validation functions
- **helpers.js**: Utility functions (date formatting, calculations, etc.)

### Services (`src/services/`)
Business logic layer. Example:
```javascript
// matchService.js
exports.createMatch = async (teamAId, teamBId, createdBy) => {
  // Validate teams exist
  // Create match record
  // Return match
};
```

### Migrations (`src/migrations/`)
Database schema version control. Run with:
```bash
npx sequelize-cli db:migrate
```

### WebSocket (`src/websocket/`)
Real-time score updates via Socket.IO:
```javascript
// socketHandler.js
socket.on('ball-recorded', (data) => {
  // Broadcast to all connected clients
  io.emit('score-update', data);
});
```

## API Endpoint Structure

```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout

POST   /api/teams                  # Create team
GET    /api/teams                  # List teams
GET    /api/teams/:id              # Get team details
PUT    /api/teams/:id              # Update team
DELETE /api/teams/:id              # Delete team

POST   /api/teams/:teamId/players  # Add player to team
GET    /api/teams/:teamId/players  # List team players
PUT    /api/players/:id            # Update player
DELETE /api/players/:id            # Remove player

POST   /api/matches                # Create match
GET    /api/matches                # List matches
GET    /api/matches/:id            # Get match details
PUT    /api/matches/:id            # Update match
DELETE /api/matches/:id            # Delete match

POST   /api/matches/:matchId/balls # Record ball
GET    /api/matches/:matchId/balls # Get all balls
PUT    /api/balls/:id              # Update ball
DELETE /api/balls/:id              # Delete ball

GET    /api/matches/:matchId/scorecard  # Get scorecard
GET    /api/matches/:matchId/stats      # Get statistics
```

## Next Steps

1. **Create migrations** using `sequelize-cli`
2. **Implement controllers** for each resource
3. **Implement services** with business logic
4. **Create routes** and mount in app.js
5. **Add authentication** middleware
6. **Set up WebSocket** for real-time updates
7. **Write tests** for each layer

## Database Connection

The app connects to PostgreSQL using Sequelize ORM. Configuration in `src/config/config.json`:

```json
{
  "development": {
    "username": "postgres",
    "password": "postgres",
    "database": "scorebook_dev",
    "host": "127.0.0.1",
    "port": 5432,
    "dialect": "postgres"
  }
}
```

Ensure PostgreSQL is running and databases are created:
```bash
createdb scorebook_dev
createdb scorebook_test
createdb scorebook_prod
```
