# ScoreBook Backend Setup Guide

## Prerequisites

- Node.js (v16+)
- PostgreSQL (v12+)
- npm or yarn

## Installation Steps

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Create PostgreSQL Databases

```bash
# Create development database
createdb scorebook_dev

# Create test database
createdb scorebook_test

# Create production database (optional)
createdb scorebook_prod
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
NODE_ENV=development
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=scorebook_dev
JWT_SECRET=your_jwt_secret_key_here
```

### 4. Run Database Migrations

```bash
# Run all pending migrations
npm run db:migrate

# Undo last migration (if needed)
npm run db:migrate:undo

# Undo all migrations (if needed)
npm run db:migrate:undo:all
```

### 5. Seed Database (Optional)

```bash
npm run db:seed
```

### 6. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## Project Structure

```
backend/
├── app.js                    # Express app entry point
├── package.json              # Dependencies
├── .sequelizerc              # Sequelize CLI config
├── .env                      # Environment variables
│
├── src/
│   ├── config/
│   │   └── config.json       # Database configuration
│   │
│   ├── models/               # Sequelize ORM models
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── Team.js
│   │   ├── Player.js
│   │   ├── Match.js
│   │   └── Ball.js
│   │
│   ├── migrations/           # Database migrations
│   │   ├── 20240208000001-create-users.js
│   │   ├── 20240208000002-create-teams.js
│   │   ├── 20240208000003-create-players.js
│   │   ├── 20240208000004-create-matches.js
│   │   ├── 20240208000005-create-balls.js
│   │   └── seeders/
│   │
│   ├── controllers/          # Request handlers (TO BE CREATED)
│   ├── routes/               # API endpoints (TO BE CREATED)
│   ├── services/             # Business logic (TO BE CREATED)
│   ├── middleware/           # Express middleware
│   └── utils/                # Utility functions
```

## ES6 Module System

This project uses ES6 modules (`import`/`export`). Key points:

- All `.js` files use ES6 syntax
- `package.json` has `"type": "module"`
- Import statements: `import db from './src/models/index.js'`
- Export statements: `export default Model` or `export { Model }`

## Database Schema

The database includes 5 main tables:

1. **users** - User accounts with roles
2. **teams** - Cricket teams
3. **players** - Individual players
4. **matches** - Cricket matches
5. **balls** - Ball-by-ball events

See `DATABASE_SCHEMA.md` for detailed schema documentation.

## API Endpoints (To Be Implemented)

```
Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

Teams
POST   /api/teams
GET    /api/teams
GET    /api/teams/:id
PUT    /api/teams/:id
DELETE /api/teams/:id

Players
POST   /api/teams/:teamId/players
GET    /api/teams/:teamId/players
PUT    /api/players/:id
DELETE /api/players/:id

Matches
POST   /api/matches
GET    /api/matches
GET    /api/matches/:id
PUT    /api/matches/:id
DELETE /api/matches/:id

Balls
POST   /api/matches/:matchId/balls
GET    /api/matches/:matchId/balls
PUT    /api/balls/:id
DELETE /api/balls/:id

Analytics
GET    /api/matches/:matchId/scorecard
GET    /api/matches/:matchId/stats
```

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:** Ensure PostgreSQL is running:
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
# Start PostgreSQL service from Services
```

### Migration Error

```
Error: relation "users" already exists
```

**Solution:** Undo migrations and re-run:
```bash
npm run db:migrate:undo:all
npm run db:migrate
```

### Port Already in Use

```
Error: listen EADDRINUSE :::3000
```

**Solution:** Change PORT in `.env` or kill the process:
```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Next Steps

1. Implement authentication controllers and routes
2. Implement team management endpoints
3. Implement match management endpoints
4. Implement ball recording endpoints
5. Set up WebSocket for real-time updates
6. Add comprehensive error handling
7. Write unit and integration tests

## Development Commands

```bash
# Start development server
npm run dev

# Run migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Seed database
npm run db:seed

# Run tests (when available)
npm test
```

## Resources

- [Sequelize Documentation](https://sequelize.org/)
- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js ES6 Modules](https://nodejs.org/api/esm.html)
