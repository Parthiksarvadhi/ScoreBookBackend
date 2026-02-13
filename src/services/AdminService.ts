/**
 * AdminService
 * Manages admin-level operations including force release and scorer reassignment
 */

import db from '../models/index.js';
import AuditService from './AuditService.js';
import {
  InsufficientPermissionsError,
  InvalidStatusError,
  NotFoundError,
} from '../errors/CustomErrors.js';

/**
 * AdminService
 * Manages admin-level operations including force release and scorer reassignment
 */
class AdminService {
  /**
   * Force release a scorer lock on a match
   */
  async forceReleaseLock(matchId: string, adminId: string, reason: string): Promise<any> {
    const transaction = await db.sequelize!.transaction();

    try {
      // Verify admin user exists and has admin role
      const admin = await db.User.findByPk(adminId);
      if (!admin || admin.role !== 'admin') {
        await transaction.rollback();
        throw new InsufficientPermissionsError(
          'Only administrators can force release locks',
          {
            userId: adminId,
            requiredRole: 'admin',
          }
        );
      }

      // Fetch match
      const match = await db.Match.findOne(
        { where: { id: matchId } },
        { transaction }
      );

      if (!match) {
        await transaction.rollback();
        throw new NotFoundError('Match not found', { matchId });
      }

      // Verify match is in 'live' status
      if (match.status !== 'live') {
        await transaction.rollback();
        throw new InvalidStatusError(
          `Match must be in 'live' status for admin override. Current status: ${match.status}`,
          {
            matchId,
            currentStatus: match.status,
            requiredStatus: 'live',
          }
        );
      }

      // Get current scorer
      const currentScorerId = match.scorerId;

      // Clear lock fields
      await match.update(
        {
          scorerId: null,
          lockedAt: null,
        },
        { transaction }
      );

      // Create audit log entries
      await AuditService.logAction(
        matchId,
        adminId,
        currentScorerId,
        'lock_force_released',
        { reason }
      );

      await transaction.commit();

      // Reload match with associations
      const updatedMatch = await db.Match.findOne({
        where: { id: matchId },
        include: [
          { model: db.User, as: 'scorer', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: db.Team, as: 'teamA', attributes: ['id', 'name'] },
          { model: db.Team, as: 'teamB', attributes: ['id', 'name'] },
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
   * Reassign a scorer to a match
   */
  async reassignScorer(
    matchId: string,
    newScorerId: string,
    adminId: string,
    reason: string
  ): Promise<any> {
    const transaction = await db.sequelize!.transaction();

    try {
      // Verify admin user exists and has admin role
      const admin = await db.User.findByPk(adminId);
      if (!admin || admin.role !== 'admin') {
        await transaction.rollback();
        throw new InsufficientPermissionsError(
          'Only administrators can reassign scorers',
          {
            userId: adminId,
            requiredRole: 'admin',
          }
        );
      }

      // Verify new scorer exists
      const newScorer = await db.User.findByPk(newScorerId);
      if (!newScorer) {
        await transaction.rollback();
        throw new NotFoundError('New scorer not found', { newScorerId });
      }

      // Fetch match
      const match = await db.Match.findOne(
        { where: { id: matchId } },
        { transaction }
      );

      if (!match) {
        await transaction.rollback();
        throw new NotFoundError('Match not found', { matchId });
      }

      // Verify match is in 'live' status
      if (match.status !== 'live') {
        await transaction.rollback();
        throw new InvalidStatusError(
          `Match must be in 'live' status for scorer reassignment. Current status: ${match.status}`,
          {
            matchId,
            currentStatus: match.status,
            requiredStatus: 'live',
          }
        );
      }

      // Get old scorer
      const oldScorerId = match.scorerId;

      // Update match with new scorer
      const now = new Date();
      await match.update(
        {
          scorerId: newScorerId,
          lockedAt: now,
        },
        { transaction }
      );

      // Create audit log entry
      await AuditService.logAction(
        matchId,
        adminId,
        newScorerId,
        'scorer_reassigned',
        {
          oldScorerId,
          reason,
        }
      );

      await transaction.commit();

      // Reload match with associations
      const updatedMatch = await db.Match.findOne({
        where: { id: matchId },
        include: [
          { model: db.User, as: 'scorer', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: db.Team, as: 'teamA', attributes: ['id', 'name'] },
          { model: db.Team, as: 'teamB', attributes: ['id', 'name'] },
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

export default new AdminService();
