/**
 * ScoreBook Backend Application
 * Real-Time Cricket Scoring & Match Analytics System
 */

import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import authRoutes from './src/routes/authRoutes.js';
import matchRoutes from './src/routes/matches.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { authenticateToken } from './src/middleware/authMiddleware.js';

// Load environment variables
dotenv.config();

console.log('🔐 JWT_SECRET loaded:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'NOT SET');

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req: Request, res: Response): void => {
  res.json({ message: 'ScoreBook API is running!' });
});

// Health check
app.get('/health', (req: Request, res: Response): void => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

import uploadRoutes from './src/routes/uploadRoutes.js';
import invitationRoutes from './src/routes/invitations.js';
import teamsRoutes from './src/routes/teams.js';

// ... existing code ...

// Static files
app.use('/uploads', express.static('public/uploads'));

// Invite redirect page (for SMS deep links)
app.get('/invite/:token', (req: Request, res: Response): void => {
  res.sendFile('invite.html', { root: './public' });
});

import publicMatchesRoutes from './src/routes/publicMatches.js';
// Public routes (No Auth Required)
app.use('/public/matches', publicMatchesRoutes);

// Authentication routes
app.use('/auth', authRoutes);

// Apply authentication middleware to protected routes
app.use('/matches', authenticateToken as any);
app.use('/upload', authenticateToken as any, uploadRoutes);
app.use('/invitations', authenticateToken as any, invitationRoutes);
app.use('/teams', authenticateToken as any, teamsRoutes);

// Match management routes
app.use('/matches', matchRoutes);

// Error handling middleware
app.use(errorHandler);

// Database sync and start server
const startServer = async (): Promise<void> => {
  try {
    console.log('Starting server...');
    console.log('Database Config:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || '5432',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Import db after defining app to ensure models load first
    const db = await import('./src/models/index.js').then(m => m.default);

    // Wait for models to be fully initialized
    let attempts = 0;
    while (!db.sequelize && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!db.sequelize) {
      throw new Error('Database not initialized. Models failed to load.');
    }

    console.log('Attempting to authenticate with database...');
    await db.sequelize.authenticate();
    console.log('✓ Database connection established successfully.');

    // Sync models with database (use alter: true to add missing columns)
    console.log('Syncing database models...');
    await db.sequelize.sync({ alter: true });
    console.log('✓ Database models synced.');

    app.listen(PORT, (): void => {
      console.log(`✓ Server is running on http://localhost:${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error: any) {
    console.error('❌ Unable to connect to the database');
    console.error('Error Details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || '5432',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    console.error('Full Error:', error);
    process.exit(1);
  }
};

startServer();

export default app;
