/**
 * Match Management API routes
 */

import express, { Request, Response, Router } from 'express';
import MatchService from '../services/MatchService.js';
import AdminService from '../services/AdminService.js';
import AuditService from '../services/AuditService.js';
import MatchSetupService from '../services/MatchSetupService.js';
import BallScoringService from '../services/BallScoringService.js';
import StatisticsService from '../services/StatisticsService.js';
import LiveScoreService from '../services/LiveScoreService.js';
import MatchResultService from '../services/MatchResultService.js';
import UndoService from '../services/UndoService.js';
import InningsService from '../services/InningsService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { IAuthRequest } from '../types/index.js';
import db from '../models/index.js';

const router: Router = express.Router();

/**
 * Middleware to verify user has required role
 */
function requireRole(...roles: string[]) {
  return (req: IAuthRequest, res: Response, next: Function): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!roles.includes(req.user.role || '')) {
      res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `This action requires one of the following roles: ${roles.join(', ')}`,
          details: {
            requiredRoles: roles,
            userRole: req.user.role,
          },
        },
      });
      return;
    }

    next();
  };
}

/**
 * Helper to check if user has permission to edit match
 */
async function hasMatchPermission(matchId: string, userId: string): Promise<boolean> {
  const match = await db.Match.findByPk(matchId, { attributes: ['createdBy', 'scorerId'] });
  if (!match) return false;
  return match.createdBy === userId || match.scorerId === userId;
}

/**
 * POST /matches/teams
 * Create a new team
 * Requires: 'scorer' or 'admin' role
 */
router.post(
  '/teams',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const { name, shortName, logo, primaryColor } = req.body;

    if (!name || !shortName) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'name and shortName are required',
        },
      });
      return;
    }

    const team = await db.Team.create({
      name,
      shortName,
      logo,
      primaryColor,
      createdBy: req.user!.userId,
    });

    res.status(201).json(team);
  }) as any
);

/**
 * GET /matches/teams
 * List all teams
 */
router.get(
  '/teams',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.query;

    if (!userId) {
      res.json({ data: [] });
      return;
    }

    const where = { createdBy: userId };
    console.log(`🔍 [DEBUG-VERIFY] Filtering for userId: '${userId}' (Type: ${typeof userId})`);

    const teams = await db.Team.findAll({
      where,
      attributes: ['id', 'name', 'shortName', 'logo', 'primaryColor', 'createdAt', 'createdBy'],
      include: [
        {
          model: db.Player,
          as: 'players',
          attributes: ['id'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      data: teams,
    });
  })
);

/**
 * GET /matches/teams/:teamId
 * Get a specific team
 */
router.get(
  '/teams/:teamId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const team = await db.Team.findByPk(req.params.teamId);
    if (!team) {
      res.status(404).json({
        error: {
          code: 'TEAM_NOT_FOUND',
          message: 'Team not found',
        },
      });
      return;
    }
    res.json(team);
  })
);

/**
 * PUT /matches/teams/:teamId
 * Update a team
 * Requires: 'scorer' or 'admin' role
 */
router.put(
  '/teams/:teamId',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const { name, shortName, logo, primaryColor } = req.body;
    const { teamId } = req.params;

    const team = await db.Team.findByPk(teamId);
    if (!team) {
      res.status(404).json({
        error: {
          code: 'TEAM_NOT_FOUND',
          message: 'Team not found',
        },
      });
      return;
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (shortName) updateData.shortName = shortName;
    if (logo !== undefined) updateData.logo = logo;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;

    await team.update(updateData);

    res.json({
      ...team.toJSON(),
      message: 'Team updated successfully',
    });
  }) as any
);

/**
 * POST /matches/teams/:teamId/players
 * Add a player to a team
 * Requires: 'scorer' or 'admin' role
 */
router.post(
  '/teams/:teamId/players',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const { name, jerseyNumber, role } = req.body;
    const { teamId } = req.params;

    if (!name || !jerseyNumber || !role) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'name, jerseyNumber, and role are required',
        },
      });
      return;
    }

    // Verify team exists
    const team = await db.Team.findByPk(teamId);
    if (!team) {
      res.status(404).json({
        error: {
          code: 'TEAM_NOT_FOUND',
          message: 'Team not found',
        },
      });
      return;
    }

    const player = await db.Player.create({
      teamId,
      name,
      jerseyNumber,
      role,
    });

    res.status(201).json(player);
  }) as any
);

/**
 * GET /matches/teams/:teamId/players
 * List all players in a team
 */
router.get(
  '/teams/:teamId/players',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { teamId } = req.params;

    // Verify team exists
    const team = await db.Team.findByPk(teamId);
    if (!team) {
      res.status(404).json({
        error: {
          code: 'TEAM_NOT_FOUND',
          message: 'Team not found',
        },
      });
      return;
    }

    const players = await db.Player.findAll({
      where: { teamId },
      attributes: ['id', 'name', 'jerseyNumber', 'role', 'createdAt'],
    });

    res.json({
      data: players,
    });
  })
);

/**
 * PUT /matches/teams/:teamId/players/:playerId
 * Update a player
 * Requires: 'scorer' or 'admin' role
 */
router.put(
  '/teams/:teamId/players/:playerId',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const { name, jerseyNumber, role } = req.body;
    const { teamId, playerId } = req.params;

    const player = await db.Player.findOne({
      where: { id: playerId, teamId },
    });

    if (!player) {
      res.status(404).json({
        error: {
          code: 'PLAYER_NOT_FOUND',
          message: 'Player not found in this team',
        },
      });
      return;
    }

    // Verify team ownership
    const team = await db.Team.findByPk(teamId);
    if (!team || team.createdBy !== req.user!.userId) {
      // Allow admins or just creator? 
      // For now restrict to creator as per other routes (implicitly via logic elsewhere, but here explicit)
      // Actually requireRole checks role, but we should check ownership too?
      // The team update route doesn't check ownership explicitly? 
      // Post team doesn't.
      // Let's check ownership for safety.
      if (team?.createdBy !== req.user!.userId) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only edit your own teams' } });
        return;
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (jerseyNumber) updateData.jerseyNumber = jerseyNumber;
    if (role) updateData.role = role;

    await player.update(updateData);

    res.json({
      ...player.toJSON(),
      message: 'Player updated successfully',
    });
  }) as any
);

/**
 * DELETE /matches/teams/:teamId/players/:playerId
 * Remove a player from a team
 * Requires: 'scorer' or 'admin' role
 */
router.delete(
  '/teams/:teamId/players/:playerId',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const { teamId, playerId } = req.params;

    const player = await db.Player.findOne({
      where: { id: playerId, teamId },
    });

    if (!player) {
      res.status(404).json({
        error: {
          code: 'PLAYER_NOT_FOUND',
          message: 'Player not found in this team',
        },
      });
      return;
    }

    // Verify team ownership
    const team = await db.Team.findByPk(teamId);
    if (!team || team.createdBy !== req.user!.userId) {
      if (team?.createdBy !== req.user!.userId) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only edit your own teams' } });
        return;
      }
    }

    await player.destroy();

    res.json({
      message: 'Player removed successfully',
    });
  }) as any
);

/**
 * POST /matches
 * Create a new match
 * Requires: 'scorer' or 'admin' role
 */
router.post(
  '/',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const { teamAId, teamBId, matchType, overs, venue } = req.body;

    const match = await MatchService.createMatch(
      teamAId,
      teamBId,
      matchType,
      overs,
      venue,
      req.user!.userId
    );

    res.status(201).json(match);
  }) as any
);

/**
 * GET /matches
 * List all matches with optional filtering
 * Query parameters: status, scorerId, createdBy, page, limit
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { status, scorerId, createdBy, page, limit } = req.query;

    const result = await MatchService.listMatches({
      status: status as string,
      scorerId: scorerId as string,
      createdBy: createdBy as string,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20,
    });

    res.json(result);
  })
);

/**
 * GET /matches/:id
 * Get a specific match by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const match = await MatchService.getMatch(req.params.id);
    res.json(match);
  })
);

/**
 * PUT /matches/:id
 * Update a match (only for scheduled matches)
 * Requires: 'scorer' or 'admin' role
 */
router.put(
  '/:id',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const { matchType, overs, venue } = req.body;
    const matchId = req.params.id;

    if (!(await hasMatchPermission(matchId, req.user!.userId))) {
      res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only the match creator or assigned scorer can perform this action',
        },
      });
      return;
    }

    // Get the match first
    const match = await db.Match.findByPk(matchId);
    if (!match) {
      res.status(404).json({
        error: {
          code: 'MATCH_NOT_FOUND',
          message: 'Match not found',
        },
      });
      return;
    }

    // Only allow editing scheduled matches
    if (match.status !== 'scheduled') {
      res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Only scheduled matches can be edited',
          details: {
            currentStatus: match.status,
          },
        },
      });
      return;
    }

    // Update the match
    const updateData: any = {};
    if (matchType !== undefined) updateData.matchType = matchType;
    if (overs !== undefined) updateData.overs = overs;
    if (venue !== undefined) updateData.venue = venue;

    await match.update(updateData);

    // Reload with associations
    const updatedMatch = await db.Match.findOne({
      where: { id: matchId },
      include: [
        { model: db.User, as: 'scorer', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: db.Team, as: 'teamA', attributes: ['id', 'name', 'logo', 'primaryColor'] },
        { model: db.Team, as: 'teamB', attributes: ['id', 'name', 'logo', 'primaryColor'] },
        { model: db.User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.json({
      ...updatedMatch!.toJSON(),
      message: 'Match updated successfully',
    });
  }) as any
);

/**
 * POST /matches/:id/toss
 * Record toss result
 * Requires: 'scorer' or 'admin' role
 */
router.post(
  '/:id/toss',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const { tossWinnerId, tossChoice } = req.body;

    if (!tossWinnerId || !tossChoice) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'tossWinnerId and tossChoice are required',
        },
      });
      return;
    }

    if (!(await hasMatchPermission(req.params.id, req.user!.userId))) {
      res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only the match creator or assigned scorer can perform this action',
        },
      });
      return;
    }

    const match = await MatchSetupService.recordToss(
      req.params.id,
      tossWinnerId,
      tossChoice,
      req.user!.userId
    );

    res.json({
      ...match.toJSON(),
      message: 'Toss recorded successfully',
    });
  }) as any
);

/**
 * PUT /matches/:id/toss
 * Update toss result (allows changing toss if already recorded)
 * Requires: 'scorer' or 'admin' role
 */
router.put(
  '/:id/toss',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const { tossWinnerId, tossChoice } = req.body;

    if (!tossWinnerId || !tossChoice) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'tossWinnerId and tossChoice are required',
        },
      });
      return;
    }

    const match = await db.Match.findByPk(req.params.id);
    if (!match) {
      res.status(404).json({
        error: {
          code: 'MATCH_NOT_FOUND',
          message: 'Match not found',
        },
      });
      return;
    }

    if (match.status !== 'scheduled') {
      res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Match must be in scheduled status to update toss',
        },
      });
      return;
    }

    // Validate toss winner is one of the teams
    if (tossWinnerId !== match.teamAId && tossWinnerId !== match.teamBId) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Toss winner must be one of the match teams',
        },
      });
      return;
    }

    // Validate toss choice
    if (!['bat', 'field'].includes(tossChoice)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Toss choice must be bat or field',
        },
      });
      return;
    }

    await match.update({
      tossWinnerId,
      tossChoice,
    });

    res.json({
      ...match.toJSON(),
      message: 'Toss updated successfully',
    });
  }) as any
);

/**
 * POST /matches/:id/playing-11
 * Select playing 11 for a team
 * Requires: 'scorer' or 'admin' role
 */
router.post(
  '/:id/playing-11',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const { teamId, playerIds } = req.body;

    if (!teamId || !playerIds || !Array.isArray(playerIds)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'teamId and playerIds array are required',
        },
      });
      return;
    }

    const matchId = req.params.id;

    if (!(await hasMatchPermission(matchId, req.user!.userId))) {
      res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only the match creator or assigned scorer can perform this action',
        },
      });
      return;
    }

    const match = await MatchSetupService.selectPlaying11(
      matchId,
      teamId,
      playerIds,
      req.user!.userId
    );

    res.json({
      ...match.toJSON(),
      message: 'Playing 11 selected successfully',
    });
  }) as any
);

/**
 * PUT /matches/:id/playing-11
 * Update playing 11 for a team (allows changing if already selected)
 * Requires: 'scorer' or 'admin' role
 */
router.put(
  '/:id/playing-11',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const { teamId, playerIds } = req.body;

    if (!teamId || !playerIds || !Array.isArray(playerIds)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'teamId and playerIds array are required',
        },
      });
      return;
    }

    const match = await db.Match.findByPk(req.params.id);
    if (!match) {
      res.status(404).json({
        error: {
          code: 'MATCH_NOT_FOUND',
          message: 'Match not found',
        },
      });
      return;
    }

    if (match.status !== 'scheduled') {
      res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Match must be in scheduled status to update playing 11',
        },
      });
      return;
    }

    // Validate team
    if (teamId !== match.teamAId && teamId !== match.teamBId) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Team is not part of this match',
        },
      });
      return;
    }

    // Validate exactly 11 players
    if (playerIds.length !== 11) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Playing 11 must have exactly 11 players',
        },
      });
      return;
    }

    // Validate all players belong to the team
    const players = await db.Player.findAll({
      where: { id: playerIds, teamId },
    });

    if (players.length !== 11) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All players must belong to the selected team',
        },
      });
      return;
    }

    const fieldName = teamId === match.teamAId ? 'teamAPlaying11' : 'teamBPlaying11';
    const updateData: any = {};
    updateData[fieldName] = playerIds;

    await match.update(updateData);

    res.json({
      ...match.toJSON(),
      message: 'Playing 11 updated successfully',
    });
  }) as any
);

/**
 * POST /matches/:id/captain
 * Designate captain for a team
 * Requires: 'scorer' or 'admin' role
 */
router.post(
  '/:id/captain',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const { teamId, captainId } = req.body;

    if (!teamId || !captainId) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'teamId and captainId are required',
        },
      });
      return;
    }

    if (!(await hasMatchPermission(req.params.id, req.user!.userId))) {
      res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only the match creator or assigned scorer can perform this action',
        },
      });
      return;
    }

    const match = await MatchSetupService.designateCaptain(
      req.params.id,
      teamId,
      captainId,
      req.user!.userId
    );

    res.json({
      ...match.toJSON(),
      message: 'Captain designated successfully',
    });
  }) as any
);

/**
 * POST /matches/:id/batting-order
 * Set batting order for a team
 * Requires: 'scorer' or 'admin' role
 */
router.post(
  '/:id/batting-order',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const { teamId, playerIds } = req.body;

    if (!teamId || !playerIds || !Array.isArray(playerIds)) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'teamId and playerIds array are required',
        },
      });
      return;
    }

    if (!(await hasMatchPermission(req.params.id, req.user!.userId))) {
      res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only the match creator or assigned scorer can perform this action',
        },
      });
      return;
    }

    const match = await MatchSetupService.setBattingOrder(
      req.params.id,
      teamId,
      playerIds,
      req.user!.userId
    );

    res.json({
      ...match.toJSON(),
      message: 'Batting order set successfully',
    });
  }) as any
);

/**
 * GET /matches/:id/setup
 * Get all setup information for a match
 */
router.get(
  '/:id/setup',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const setup = await MatchSetupService.getMatchSetup(req.params.id);
    res.json(setup);
  })
);

/**
 * POST /matches/:id/balls
 * Record a ball
 * Requires: 'scorer' or 'admin' role
 * 
 * Body:
 *   over: number
 *   ballNumber: number
 *   batsmanId: string (striker - who faced the ball)
 *   nonStrikerId: string (non-striker - at other end)
 *   bowlerId: string
 *   runs: number
 *   extras: 'none' | 'wide' | 'no-ball' | 'bye' | 'leg-bye'
 *   extraRuns: number
 *   isWicket: boolean
 *   wicketType?: string
 */
router.post(
  '/:id/balls',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    let { over, ballNumber, batsmanId, nonStrikerId, bowlerId, runs, isWicket, wicketType, extras, extraRuns } =
      req.body;

    if (!(await hasMatchPermission(req.params.id, req.user!.userId))) {
      res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only the match creator or assigned scorer can perform this action',
        },
      });
      return;
    }

    console.log('📥 RECEIVED BALL DATA FROM FRONTEND:');
    console.log('====================================');
    console.log(`  Raw Body: ${JSON.stringify(req.body)}`);
    console.log(`  Match ID: ${req.params.id}`);
    console.log(`  Over: ${over} (type: ${typeof over})`);
    console.log(`  Ball: ${ballNumber} (type: ${typeof ballNumber})`);
    console.log(`  Striker (Batsman): ${batsmanId}`);
    console.log(`  Non-Striker: ${nonStrikerId}`);
    console.log(`  Bowler ID: ${bowlerId}`);
    console.log(`  Runs: ${runs}`);
    console.log(`  Extras: ${extras}`);
    console.log(`  Extra Runs: ${extraRuns}`);
    console.log(`  Wicket: ${isWicket}`);
    if (isWicket) {
      console.log(`  Wicket Type: ${wicketType}`);
    }
    console.log('====================================\n');

    if (!over || !ballNumber || !batsmanId || !bowlerId) {
      console.log('❌ VALIDATION ERROR: Missing required fields');
      console.log(`  over: ${over}, ballNumber: ${ballNumber}, batsmanId: ${batsmanId}, bowlerId: ${bowlerId}`);
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'over, ballNumber, batsmanId, and bowlerId are required',
        },
      });
      return;
    }

    // If nonStrikerId not provided, derive it from current match state
    if (!nonStrikerId) {
      console.log('ℹ️ Non-striker not provided, deriving from match state...');
      const match = await db.Match.findByPk(req.params.id);
      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      const currentInnings = match.currentInnings || 1;
      const allBalls = await db.Ball.findAll({
        where: {
          matchId: req.params.id,
          inningsNumber: currentInnings,
        },
        order: [['over', 'ASC'], ['ballNumber', 'ASC']],
      });

      // Get batting order
      let battingOrder: string[];
      if (currentInnings === 1) {
        const battingTeamId = match.tossChoice === 'bat' ? match.teamAId : match.teamBId;
        battingOrder = battingTeamId === match.teamAId ? match.teamABattingOrder : match.teamBBattingOrder;
      } else {
        const firstInningsBatting = match.tossChoice === 'bat' ? match.teamAId : match.teamBId;
        const battingTeamId = firstInningsBatting === match.teamAId ? match.teamBId : match.teamAId;
        battingOrder = battingTeamId === match.teamAId ? match.teamABattingOrder : match.teamBBattingOrder;
      }

      // Calculate current state
      const ballRecords = allBalls.map((b: any) => ({
        batsmanId: b.batsmanId,
        bowlerId: b.bowlerId,
        runs: b.runs,
        extraRuns: b.extraRuns,
        extras: b.extras,
        isWicket: b.isWicket,
        wicketType: b.wicketType,
      }));

      const initialState = {
        striker: battingOrder?.[0] || '',
        nonStriker: battingOrder?.[1] || '',
        bowler: ballRecords.length > 0 ? ballRecords[0].bowlerId : '',
        over: 1,
        ballInOver: 1,
        legalBallsInOver: 0,
      };

      const { calculateMatchState } = await import('../utils/cricketRulesEngine.js');
      const currentState = calculateMatchState(ballRecords, initialState, () => null);

      nonStrikerId = currentState.nonStriker;
      console.log(`✅ Derived non-striker: ${nonStrikerId}`);
    }

    const ball = await BallScoringService.recordBall(
      req.params.id,
      {
        over,
        ballNumber,
        batsmanId,
        nonStrikerId,
        bowlerId,
        runs: runs || 0,
        isWicket: isWicket || false,
        wicketType,
        extras: extras || 'none',
        extraRuns: extraRuns || 0,
      },
      req.user!.userId
    );

    console.log('✅ BALL RECORDED SUCCESSFULLY');
    res.status(201).json(ball);
  }) as any
);

/**
 * GET /matches/:id/balls
 * Get all balls for a match
 */
router.get(
  '/:id/balls',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { inningsNumber } = req.query;

    const balls = await BallScoringService.getBalls(
      req.params.id,
      inningsNumber ? parseInt(inningsNumber as string) : undefined
    );

    res.json({
      data: balls,
      count: balls.length,
    });
  })
);

/**
 * DELETE /matches/:id/balls/:ballId
 * Delete a ball
 * Requires: 'scorer' or 'admin' role
 */
router.delete(
  '/:id/balls/:ballId',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const result = await BallScoringService.deleteBall(
      req.params.id,
      req.params.ballId
    );

    res.json(result);
  }) as any
);

/**
 * POST /matches/:id/undo
 * Undo the last recorded ball and recalculate match state
 * Requires: 'scorer' or 'admin' role
 */
router.post(
  '/:id/undo',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    console.log('📥 UNDO REQUEST RECEIVED');
    console.log(`  Match ID: ${req.params.id}`);
    console.log(`  Match ID: ${req.params.id}`);
    console.log(`  Scorer ID: ${req.user!.userId}`);

    if (!(await hasMatchPermission(req.params.id, req.user!.userId))) {
      res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only the match creator or assigned scorer can perform this action',
        },
      });
      return;
    }

    const result = await UndoService.undoLastBall(
      req.params.id,
      req.user!.userId
    );

    console.log('✅ UNDO COMPLETED SUCCESSFULLY');
    res.json(result);
  }) as any
);

/**
 * GET /matches/:id/scorecard
 * Get match scorecard
 */
router.get(
  '/:id/scorecard',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const scorecard = await StatisticsService.getScorecard(req.params.id);
    res.json(scorecard);
  })
);

/**
 * POST /matches/:id/start
 * Start a match and acquire scorer lock
 * Requires: 'scorer' role
 */
router.post(
  '/:id/start',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    // initialPlayers: { strikerId, nonStrikerId, bowlerId }
    const { initialPlayers } = req.body;

    const match = await MatchService.startMatch(
      req.params.id,
      req.user!.userId,
      initialPlayers
    );

    res.json({
      ...match.toJSON(),
      message: 'Match started successfully',
    });
  }) as any
);

/**
 * POST /matches/:id/end
 * End a match and release scorer lock
 * Requires: 'scorer' role
 */
router.post(
  '/:id/end',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const match = await MatchService.endMatch(req.params.id, req.user!.userId);

    res.json({
      ...match.toJSON(),
      message: 'Match ended successfully',
    });
  }) as any
);

/**
 * POST /matches/:id/abandon
 * Abandon a match and release scorer lock
 * Requires: 'scorer' role
 */
router.post(
  '/:id/abandon',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const match = await MatchService.abandonMatch(req.params.id, req.user!.userId);

    res.json({
      ...match.toJSON(),
      message: 'Match abandoned successfully',
    });
  }) as any
);

/**
 * POST /matches/:id/reset
 * Reset a match back to scheduled status (only if no balls recorded)
 * Requires: 'scorer' or 'admin' role
 */
router.post(
  '/:id/reset',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const match = await db.Match.findByPk(req.params.id);

    if (!match) {
      res.status(404).json({
        error: {
          code: 'MATCH_NOT_FOUND',
          message: 'Match not found',
        },
      });
      return;
    }

    if (match.status !== 'live') {
      res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Only live matches can be reset',
        },
      });
      return;
    }

    // Check if any balls have been recorded
    const ballCount = await db.Ball.count({
      where: { matchId: req.params.id },
    });

    if (ballCount > 0) {
      res.status(400).json({
        error: {
          code: 'BALLS_RECORDED',
          message: 'Cannot reset match - balls have already been recorded',
        },
      });
      return;
    }

    // Reset match to scheduled status and clear the lock
    await match.update({
      status: 'scheduled',
      scorerId: null,
      lockedAt: null,
    });

    res.json({
      ...match.toJSON(),
      message: 'Match reset to scheduled status successfully',
    });
  }) as any
);

/**
 * POST /matches/:id/admin/override
 * Admin override: force release lock or reassign scorer
 * Requires: 'admin' role
 * Body: { action: 'force_release' | 'reassign_scorer', reason: string, newScorerId?: string }
 */
router.post(
  '/:id/admin/override',
  requireRole('admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const { action, reason, newScorerId } = req.body;

    let match;

    if (action === 'force_release') {
      match = await AdminService.forceReleaseLock(req.params.id, req.user!.userId, reason);
    } else if (action === 'reassign_scorer') {
      if (!newScorerId) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'newScorerId is required for scorer reassignment',
          },
        });
        return;
      }
      match = await AdminService.reassignScorer(
        req.params.id,
        newScorerId,
        req.user!.userId,
        reason
      );
    } else {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: "action must be 'force_release' or 'reassign_scorer'",
        },
      });
      return;
    }

    res.json({
      ...match.toJSON(),
      message: 'Admin override completed successfully',
    });
  }) as any
);

/**
 * GET /matches/:id/audit
 * Get audit history for a match
 * Requires: 'admin' role
 */
router.get(
  '/:id/audit',
  requireRole('admin') as any,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auditLogs = await AuditService.getMatchAuditHistory(req.params.id);

    res.json({
      data: auditLogs,
    });
  }) as any
);

/**
 * GET /matches/:id/current-state
 * Get current match state (who is batting/bowling)
 * Used by frontend to show current players and validate ball input
 */
router.get(
  '/:id/current-state',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const MatchStateService = (await import('../services/MatchStateService.js')).default;
    const currentState = await MatchStateService.getCurrentState(req.params.id);
    res.json(currentState);
  })
);

/**
 * POST /matches/:id/next-state
 * Get next match state after recording a ball (for preview)
 * Body: { runs, extras, extraRuns, isWicket, wicketType }
 */
router.post(
  '/:id/next-state',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { runs, extras, extraRuns, isWicket, wicketType } = req.body;
    const MatchStateService = (await import('../services/MatchStateService.js')).default;
    const nextState = await MatchStateService.getNextState(req.params.id, {
      runs: runs || 0,
      extras: extras || 'none',
      extraRuns: extraRuns || 0,
      isWicket: isWicket || false,
      wicketType,
    });
    res.json(nextState);
  })
);

/**
 * GET /matches/:id/live-score
 * Get live score for current innings
 */
router.get(
  '/:id/live-score',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    console.log(`[ROUTE] 🎯 GET /matches/${req.params.id}/live-score`);
    const liveScore = await LiveScoreService.getLiveScore(req.params.id);
    console.log(`[ROUTE] 📦 Sending response with keys: ${Object.keys(liveScore).join(', ')}`);
    console.log(`[ROUTE] 📦 Status: ${liveScore.status}, Teams: ${liveScore.teams ? 'Present' : 'Missing'}, Scorecards: ${liveScore.scorecards?.length || 0}`);
    res.json(liveScore);
  })
);

/**
 * GET /matches/:id/innings
 * Get innings information (same as live score)
 */
router.get(
  '/:id/innings',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const inningsInfo = await LiveScoreService.getLiveScore(req.params.id);
    res.json(inningsInfo);
  })
);

/**
 * POST /matches/:id/innings/complete
 * Complete current innings
 * Requires: 'scorer' or 'admin' role
 */
router.post(
  '/:id/innings/complete',
  requireRole('scorer', 'admin') as any,
  asyncHandler(async (req: IAuthRequest, res: Response): Promise<void> => {
    const result = await InningsService.completeInnings(req.params.id, req.user!.userId);
    res.json(result);
  }) as any
);

/**
 * GET /matches/:id/result
 * Get match result
 */
router.get(
  '/:id/result',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await MatchResultService.getMatchResult(req.params.id);
    res.json(result);
  })
);

/**
 * GET /matches/:id/run-rates
 * Get run rates
 */
router.get(
  '/:id/run-rates',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const runRates = await MatchResultService.getRunRates(req.params.id);
    res.json(runRates);
  })
);

export default router;
