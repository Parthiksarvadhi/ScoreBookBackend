/**
 * LockService
 * Manages exclusive scorer locks for matches using atomic database transactions
 */

import db from '../models/index.js';
import AuditService from './AuditService.js';
import { Op } from 'sequelize';
import {
  LockConflictError,
  ScorerAlreadyActiveError,
  InvalidStatusError,
  UnauthorizedError,
  LockAcquisitionFailedError,
  NotFoundError,
} from '../errors/CustomErrors.js';

/**
 * LockService
 * Manages exclusive scorer locks for matches using atomic database transactions
 */
class LockService {
  /**
   * Acquire an exclusive lock on a match for a scorer
   * Uses SERIALIZABLE isolation level to prevent race conditions
   * @param {string} matchId - ID of the match to lock
   * @param {string} scorerId - ID of the scorer acquiring the lock
   * @returns {Promise<object>} Updated match object with lock acquired
   * @throws {LockConflictError} If match is already locked by another scorer
   * @throws {ScorerAlreadyActiveError} If scorer is already locking another match
   * @throws {InvalidStatusError} If match is not in 'scheduled' status
   * @throws {NotFoundError} If match does not exist
   * @throws {LockAcquisitionFailedError} If transaction fails
   */
  async acquireLock(matchId: string, scorerId: string): Promise<any> {
    try {
      // Step 1: Verify scorer is not already locking another 'live' match
      const activeLock = await this.checkActiveLock(scorerId);
      if (activeLock && activeLock.id !== matchId) {
        throw new ScorerAlreadyActiveError(
          'Scorer is already actively scoring another match',
          {
            scorerId,
            activeMatchId: activeLock.id,
            lockedAt: activeLock.lockedAt,
          }
        );
      }

      // Step 2: Get match and verify conditions
      const match = await db.Match.findOne({
        where: { id: matchId },
      });

      if (!match) {
        throw new NotFoundError('Match not found', { matchId });
      }

      // Step 3: Verify match status is 'scheduled'
      if (match.status !== 'scheduled') {
        throw new InvalidStatusError(
          `Match must be in 'scheduled' status to acquire lock. Current status: ${match.status}`,
          {
            matchId,
            currentStatus: match.status,
            requiredStatus: 'scheduled',
          }
        );
      }

      // Step 4: Verify scorerId is NULL (not already locked)
      if (match.scorerId !== null) {
        throw new LockConflictError(
          'Match is already being scored by another scorer',
          {
            matchId,
            currentScorerId: match.scorerId,
            lockedAt: match.lockedAt,
          }
        );
      }

      // Step 5: Update match with lock and transition to 'live'
      const now = new Date();
      await match.update({
        scorerId,
        lockedAt: now,
        status: 'live',
        startTime: now,
      });

      // Step 6: Create audit log entry
      await AuditService.logAction(matchId, scorerId, scorerId, 'lock_acquired', {});

      // Step 7: Reload match with associations
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
      // Re-throw custom errors
      if (
        error instanceof LockConflictError ||
        error instanceof ScorerAlreadyActiveError ||
        error instanceof InvalidStatusError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }

      // Wrap other errors
      console.error('Lock acquisition failed:', error);
      throw new LockAcquisitionFailedError('Failed to acquire lock on match', {
        matchId,
        scorerId,
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Release an exclusive lock on a match
   * @param {string} matchId - ID of the match to unlock
   * @param {string} scorerId - ID of the scorer releasing the lock
   * @returns {Promise<object>} Updated match object with lock released
   * @throws {InvalidStatusError} If match is not in terminal status
   * @throws {UnauthorizedError} If scorer is not the lock holder
   * @throws {NotFoundError} If match does not exist
   */
  async releaseLock(matchId: string, scorerId: string): Promise<any> {
    const transaction = await db.sequelize!.transaction();

    try {
      // Step 1: Fetch match with lock
      const match = await db.Match.findOne(
        {
          where: { id: matchId },
          lock: true as any,
          transaction,
        },
        { transaction }
      );

      if (!match) {
        await transaction.rollback();
        throw new NotFoundError('Match not found', { matchId });
      }

      // Step 2: Verify match is in 'live', 'completed', or 'abandoned' status
      if (!['live', 'completed', 'abandoned'].includes(match.status)) {
        await transaction.rollback();
        throw new InvalidStatusError(
          `Cannot release lock on match in '${match.status}' status`,
          {
            matchId,
            currentStatus: match.status,
            allowedStatuses: ['live', 'completed', 'abandoned'],
          }
        );
      }

      // Step 3: Verify scorerId matches the lock holder
      if (match.scorerId !== scorerId) {
        await transaction.rollback();
        throw new UnauthorizedError(
          'Only the scorer who holds the lock can release it',
          {
            matchId,
            expectedScorerId: match.scorerId,
            requestingScorerId: scorerId,
          }
        );
      }

      // Step 4: Clear lock fields
      await match.update(
        {
          scorerId: null,
          lockedAt: null,
        },
        { transaction }
      );

      // Step 5: Create audit log entry
      await AuditService.logAction(matchId, scorerId, scorerId, 'lock_released', {});

      // Step 6: Commit transaction
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

      // Re-throw custom errors
      if (
        error instanceof InvalidStatusError ||
        error instanceof UnauthorizedError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }

      // Wrap other errors
      console.error('Lock release failed:', error);
      throw new Error(`Failed to release lock: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a scorer has an active lock on any 'live' match
   * @param {string} scorerId - ID of the scorer
   * @returns {Promise<object|null>} Active match if found, null otherwise
   */
  async checkActiveLock(scorerId: string): Promise<any | null> {
    try {
      const activeLock = await db.Match.findOne({
        where: {
          scorerId,
          status: 'live',
        },
      });

      return activeLock;
    } catch (error) {
      console.error('Error checking active lock:', error);
      return null;
    }
  }

  /**
   * Release stale locks that have exceeded the timeout duration
   * @param {number} timeoutHours - Timeout duration in hours (default 24)
   * @returns {Promise<number>} Count of released locks
   */
  async releaseStaleLocks(timeoutHours: number = 24): Promise<number> {
    const transaction = await db.sequelize!.transaction();
    let releasedCount = 0;

    try {
      // Calculate cutoff time
      const cutoffTime = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);

      // Find stale locks
      const staleLocks = await db.Match.findAll(
        {
          where: {
            status: 'live',
            lockedAt: {
              [Op.lt]: cutoffTime,
            },
          },
          transaction,
        } as any,
        { transaction }
      );

      // Release each stale lock
      for (const match of staleLocks) {
        try {
          const lockDuration = Date.now() - match.lockedAt.getTime();
          const lockDurationHours = Math.round(lockDuration / (60 * 60 * 1000));

          // Update match to clear lock
          await match.update(
            {
              scorerId: null,
              lockedAt: null,
            },
            { transaction }
          );

          // Create audit log entry
          await AuditService.logAction(
            match.id,
            match.createdBy,
            match.scorerId,
            'lock_timeout_released',
            {
              reason: `Lock timeout after ${lockDurationHours} hours`,
            }
          );

          releasedCount++;

          console.log(
            `Released stale lock on match ${match.id} (locked for ${lockDurationHours} hours)`
          );
        } catch (error) {
          console.error(`Error releasing stale lock on match ${match.id}:`, error);
        }
      }

      await transaction.commit();
      return releasedCount;
    } catch (error) {
      if ((transaction as any).finished !== 'commit') {
        await transaction.rollback();
      }
      console.error('Error releasing stale locks:', error);
      return 0;
    }
  }
}

export default new LockService();
