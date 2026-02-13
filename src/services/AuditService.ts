/**
 * AuditService
 * Manages audit logging for all scorer assignments and lock state changes
 */

import db from '../models/index.js';

/**
 * AuditService
 * Manages audit logging for all scorer assignments and lock state changes
 */
class AuditService {
  /**
   * Log an action to the audit trail
   * @param {string} matchId - ID of the match
   * @param {string} userId - ID of the user performing the action
   * @param {string} scorerId - ID of the scorer involved (nullable)
   * @param {string} actionType - Type of action (lock_acquired, lock_released, etc.)
   * @param {object} metadata - Additional metadata (oldScorerId, reason, etc.)
   * @returns {Promise<object>} Created audit log record
   * @throws {Error} If audit log creation fails
   */
  async logAction(
    matchId: string,
    userId: string,
    scorerId: string | null,
    actionType: string,
    metadata: Record<string, any> = {}
  ): Promise<any> {
    try {
      const auditLog = await db.AuditLog.create({
        matchId,
        userId,
        scorerId,
        actionType,
        oldScorerId: metadata.oldScorerId || null,
        reason: metadata.reason || null,
        timestamp: new Date(),
      });

      return auditLog;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  /**
   * Get audit history for a specific match
   * @param {string} matchId - ID of the match
   * @returns {Promise<array>} Array of audit log records ordered by timestamp
   * @throws {Error} If query fails
   */
  async getMatchAuditHistory(matchId: string): Promise<any[]> {
    try {
      const auditLogs = await db.AuditLog.findAll({
        where: { matchId },
        include: [
          { model: db.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: db.User, as: 'scorer', attributes: ['id', 'firstName', 'lastName', 'email'] },
        ],
        order: [['timestamp', 'ASC']],
      });

      return auditLogs;
    } catch (error) {
      console.error('Error fetching audit history:', error);
      throw error;
    }
  }

  /**
   * Get lock-related audit history for a specific match
   * @param {string} matchId - ID of the match
   * @returns {Promise<array>} Array of lock-related audit log records
   * @throws {Error} If query fails
   */
  async getMatchLockHistory(matchId: string): Promise<any[]> {
    try {
      const lockActions = [
        'lock_acquired',
        'lock_released',
        'lock_timeout_released',
        'lock_force_released',
        'scorer_reassigned',
      ];

      const auditLogs = await db.AuditLog.findAll({
        where: {
          matchId,
          actionType: lockActions,
        },
        include: [
          { model: db.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: db.User, as: 'scorer', attributes: ['id', 'firstName', 'lastName', 'email'] },
        ],
        order: [['timestamp', 'ASC']],
      });

      return auditLogs;
    } catch (error) {
      console.error('Error fetching lock history:', error);
      throw error;
    }
  }
}

export default new AuditService();
