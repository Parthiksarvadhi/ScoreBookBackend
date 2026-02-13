/**
 * MatchService
 * Manages match lifecycle including creation, status transitions, and lock management
 */

import db from '../models/index.js';
import LockService from './LockService.js';
import AuditService from './AuditService.js';
import {
  ValidationError,
  NotFoundError,
  InvalidStatusError,
  UnauthorizedError,
} from '../errors/CustomErrors.js';
import { IMatch, IPaginatedResponse, IMatchFilters } from '../types/index.js';

/**
 * MatchService
 * Manages match lifecycle including creation, status transitions, and lock management
 */
class MatchService {
  /**
   * Create a new match
   */
  async createMatch(
    teamAId: string,
    teamBId: string,
    matchType: string,
    overs: number,
    venue: string,
    userId: string
  ): Promise<any> {
    // Validate required fields
    if (!teamAId || !teamBId || !matchType) {
      throw new ValidationError('Missing required fields: teamAId, teamBId, matchType', {
        missingFields: [!teamAId && 'teamAId', !teamBId && 'teamBId', !matchType && 'matchType'].filter(
          Boolean
        ),
      });
    }

    // Validate teams are different
    if (teamAId === teamBId) {
      throw new ValidationError('Team A and Team B must be different', {
        teamAId,
        teamBId,
      });
    }

    try {
      // Verify both teams exist
      const teamA = await db.Team.findByPk(teamAId);
      const teamB = await db.Team.findByPk(teamBId);

      if (!teamA) {
        throw new NotFoundError('Team A not found', { teamAId });
      }

      if (!teamB) {
        throw new NotFoundError('Team B not found', { teamBId });
      }

      // Create match with status 'scheduled'
      const match = await db.Match.create({
        teamAId,
        teamBId,
        createdBy: userId,
        matchType,
        overs,
        venue,
        status: 'scheduled',
        scorerId: null,
        lockedAt: null,
      });

      // Reload with associations
      const createdMatch = await db.Match.findOne({
        where: { id: match.id },
        include: [
          { model: db.User, as: 'scorer', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: db.Team, as: 'teamA', attributes: ['id', 'name', 'logo', 'primaryColor'] },
          { model: db.Team, as: 'teamB', attributes: ['id', 'name', 'logo', 'primaryColor'] },
          { model: db.User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
        ],
      });

      return createdMatch;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error creating match:', error);
      throw new Error(`Failed to create match: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific match by ID
   */
  async getMatch(matchId: string): Promise<any> {
    try {
      const match = await db.Match.findOne({
        where: { id: matchId },
        include: [
          { model: db.User, as: 'scorer', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: db.Team, as: 'teamA', attributes: ['id', 'name', 'logo', 'primaryColor'] },
          { model: db.Team, as: 'teamB', attributes: ['id', 'name', 'logo', 'primaryColor'] },
          { model: db.User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
        ],
      });

      if (!match) {
        throw new NotFoundError('Match not found', { matchId });
      }

      return match;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching match:', error);
      throw new Error(`Failed to fetch match: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List matches with optional filtering
   */
  async listMatches(filters: IMatchFilters = {}): Promise<IPaginatedResponse<any>> {
    try {
      const { status, scorerId, createdBy, page = 1, limit = 20 } = filters;
      const offset = (page - 1) * limit;

      const where: Record<string, any> = {};
      if (status) where.status = status;
      if (scorerId) where.scorerId = scorerId;
      if (createdBy) where.createdBy = createdBy;

      const { count, rows } = await db.Match.findAndCountAll({
        where,
        include: [
          { model: db.User, as: 'scorer', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: db.Team, as: 'teamA', attributes: ['id', 'name', 'logo', 'primaryColor'] },
          { model: db.Team, as: 'teamB', attributes: ['id', 'name', 'logo', 'primaryColor'] },
          { model: db.User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
        ],
        offset,
        limit,
        order: [['createdAt', 'DESC']],
      });

      return {
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      console.error('Error listing matches:', error);
      throw new Error(`Failed to list matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start a match (acquire scorer lock and transition to 'live')
   */
  async startMatch(
    matchId: string,
    scorerId: string,
    initialPlayers?: { strikerId: string; nonStrikerId: string; bowlerId: string }
  ): Promise<any> {
    try {
      // Delegate to LockService for atomic lock acquisition
      const match = await LockService.acquireLock(matchId, scorerId);

      // If initial players provided, update batting order and bowler
      if (initialPlayers) {
        const { strikerId, nonStrikerId, bowlerId } = initialPlayers;

        // 1. Update Batting Order: Move Striker and Non-Striker to top
        const battingTeamId = match.tossChoice === 'bat'
          ? (match.tossWinnerId === match.teamAId ? match.teamAId : match.teamBId) // If winner bats, they are batting team
          : (match.tossWinnerId === match.teamAId ? match.teamBId : match.teamAId); // If winner fields, loser is batting team

        // Wait, current logic in MatchStateService determines batting team dynamically.
        // We just need to ensure the correct team's batting order is updated.
        // We should fetch the match again with associations or trust the locked match object if it has them?
        // LockService returns match with associations usually? Let's assume we need to fetch or use what we have.
        // Actually, LockService returns fresh match.

        // Let's refine batting team logic to match MatchStateService
        let firstInningsBattingTeamId: string;
        if (match.tossChoice === 'bat') {
          firstInningsBattingTeamId = match.tossWinnerId!;
        } else {
          firstInningsBattingTeamId = match.tossWinnerId === match.teamAId ? match.teamBId : match.teamAId;
        }

        const isTeamA = firstInningsBattingTeamId === match.teamAId;
        const currentOrder = isTeamA ? match.teamABattingOrder || [] : match.teamBBattingOrder || [];

        // Remove selected players from current order
        const filteredOrder = currentOrder.filter((id: string) => id !== strikerId && id !== nonStrikerId);

        // Prepend them
        const newOrder = [strikerId, nonStrikerId, ...filteredOrder];

        const updateData: any = {};
        if (isTeamA) {
          updateData.teamABattingOrder = newOrder;
        } else {
          updateData.teamBBattingOrder = newOrder;
        }

        // 2. Update Bowler: Move Bowler to top of Playing 11 (fielding team)
        // Actually, for bowler, MatchStateService takes playing11[0] if no balls.
        // So we should move the selected bowler to the top of their team's playing 11.
        const fieldingTeamId = isTeamA ? match.teamBId : match.teamAId;
        const isFieldingTeamA = fieldingTeamId === match.teamAId;
        const currentPlaying11 = isFieldingTeamA ? match.teamAPlaying11 || [] : match.teamBPlaying11 || [];

        const filtered11 = currentPlaying11.filter((id: string) => id !== bowlerId);
        const newPlaying11 = [bowlerId, ...filtered11];

        if (isFieldingTeamA) {
          updateData.teamAPlaying11 = newPlaying11;
        } else {
          updateData.teamBPlaying11 = newPlaying11;
        }

        await match.update(updateData);
      }

      // Create audit log entry for match start
      await AuditService.logAction(matchId, scorerId, scorerId, 'match_started', { initialPlayers });

      return match;
    } catch (error) {
      throw error;
    }
  }

  /**
   * End a match (release scorer lock and transition to 'completed')
   */
  async endMatch(matchId: string, scorerId: string): Promise<any> {
    const transaction = await db.sequelize!.transaction();

    try {
      // Verify match is in 'live' status
      const match = await db.Match.findOne(
        { where: { id: matchId } },
        { transaction }
      );

      if (!match) {
        await transaction.rollback();
        throw new NotFoundError('Match not found', { matchId });
      }

      if (match.status !== 'live') {
        await transaction.rollback();
        throw new InvalidStatusError(
          `Match must be in 'live' status to end. Current status: ${match.status}`,
          {
            matchId,
            currentStatus: match.status,
            requiredStatus: 'live',
          }
        );
      }

      // Verify requesting scorer is the lock holder
      if (match.scorerId !== scorerId) {
        await transaction.rollback();
        throw new UnauthorizedError(
          'Only the scorer who locked the match can end it',
          {
            matchId,
            expectedScorerId: match.scorerId,
            requestingScorerId: scorerId,
          }
        );
      }

      // Update match status to 'completed' and clear lock
      const now = new Date();
      await match.update(
        {
          status: 'completed',
          endTime: now,
          scorerId: null,
          lockedAt: null,
        },
        { transaction }
      );

      // Create audit log entries
      await AuditService.logAction(matchId, scorerId, scorerId, 'lock_released', {});
      await AuditService.logAction(matchId, scorerId, scorerId, 'match_ended', {});

      await transaction.commit();

      // Reload match with associations
      const updatedMatch = await db.Match.findOne({
        where: { id: matchId },
        include: [
          { model: db.User, as: 'scorer', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: db.Team, as: 'teamA', attributes: ['id', 'name', 'logo', 'primaryColor'] },
          { model: db.Team, as: 'teamB', attributes: ['id', 'name', 'logo', 'primaryColor'] },
          { model: db.User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
        ],
      });

      return updatedMatch;
    } catch (error) {
      if ((transaction as any).finished !== 'commit') {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Abandon a match (release scorer lock and transition to 'abandoned')
   */
  async abandonMatch(matchId: string, scorerId: string): Promise<any> {
    const transaction = await db.sequelize!.transaction();

    try {
      // Verify match is in 'live' status
      const match = await db.Match.findOne(
        { where: { id: matchId } },
        { transaction }
      );

      if (!match) {
        await transaction.rollback();
        throw new NotFoundError('Match not found', { matchId });
      }

      if (match.status !== 'live') {
        await transaction.rollback();
        throw new InvalidStatusError(
          `Match must be in 'live' status to abandon. Current status: ${match.status}`,
          {
            matchId,
            currentStatus: match.status,
            requiredStatus: 'live',
          }
        );
      }

      // Verify requesting scorer is the lock holder
      if (match.scorerId !== scorerId) {
        await transaction.rollback();
        throw new UnauthorizedError(
          'Only the scorer who locked the match can abandon it',
          {
            matchId,
            expectedScorerId: match.scorerId,
            requestingScorerId: scorerId,
          }
        );
      }

      // Update match status to 'abandoned' and clear lock
      const now = new Date();
      await match.update(
        {
          status: 'abandoned',
          endTime: now,
          scorerId: null,
          lockedAt: null,
        },
        { transaction }
      );

      // Create audit log entries
      await AuditService.logAction(matchId, scorerId, scorerId, 'lock_released', {});
      await AuditService.logAction(matchId, scorerId, scorerId, 'match_abandoned', {});

      await transaction.commit();

      // Reload match with associations
      const updatedMatch = await db.Match.findOne({
        where: { id: matchId },
        include: [
          { model: db.User, as: 'scorer', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: db.Team, as: 'teamA', attributes: ['id', 'name', 'logo', 'primaryColor'] },
          { model: db.Team, as: 'teamB', attributes: ['id', 'name', 'logo', 'primaryColor'] },
          { model: db.User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
        ],
      });

      return updatedMatch;
    } catch (error) {
      if ((transaction as any).finished !== 'commit') {
        await transaction.rollback();
      }
      throw error;
    }
  }
}

export default new MatchService();
