/**
 * Undo Service
 * Hard-deletes last ball and replays all remaining balls
 * No manual reversal - pure replay only
 */

import db from '../models/index.js';
import { calculateMatchState, calculateInningsStats, BallRecord } from '../utils/cricketRulesEngine.js';

class UndoService {
  /**
   * Undo last ball: delete it and recompute state
   */
  static async undoLastBall(matchId: string, scorerId: string) {
    console.log('🔄 Undo requested for match:', matchId);

    try {
      const match = await db.Match.findByPk(matchId);
      if (!match) throw new Error('Match not found');
      if (match.status !== 'live') throw new Error('Match must be live');

      const currentInnings = match.currentInnings || 1;

      // Get all balls for current innings
      const allBalls = await db.Ball.findAll({
        where: {
          matchId,
          inningsNumber: currentInnings,
        },
        order: [['over', 'ASC'], ['ballNumber', 'ASC']],
      });

      if (allBalls.length === 0) throw new Error('No balls to undo');

      // Get last ball
      const lastBall = allBalls[allBalls.length - 1];
      console.log(`📍 Deleting: Over ${lastBall.over}.${lastBall.ballNumber}`);

      // Hard delete
      await lastBall.destroy();

      // Get remaining balls
      const remainingBalls = await db.Ball.findAll({
        where: {
          matchId,
          inningsNumber: currentInnings,
        },
        order: [['over', 'ASC'], ['ballNumber', 'ASC']],
      });

      // Calculate stats from remaining balls
      const stats = calculateInningsStats(
        remainingBalls.map((b: any) => ({
          batsmanId: b.batsmanId,
          bowlerId: b.bowlerId,
          runs: b.runs,
          extraRuns: b.extraRuns,
          extras: b.extras,
          isWicket: b.isWicket,
          wicketType: b.wicketType,
        }))
      );

      // Update match stats
      if (currentInnings === 1) {
        await match.update({
          firstInningsRuns: stats.runs,
          firstInningsWickets: stats.wickets,
          firstInningsOvers: stats.oversString,
        });
      } else {
        await match.update({
          secondInningsRuns: stats.runs,
          secondInningsWickets: stats.wickets,
          secondInningsOvers: stats.oversString,
        });
      }

      console.log(`✅ Undo complete: ${stats.runs}/${stats.wickets} in ${stats.oversString}`);

      return {
        success: true,
        deletedBall: {
          over: lastBall.over,
          ballNumber: lastBall.ballNumber,
          batsmanId: lastBall.batsmanId,
          bowlerId: lastBall.bowlerId,
          runs: lastBall.runs,
          extraRuns: lastBall.extraRuns,
          isWicket: lastBall.isWicket,
        },
        updatedStats: stats,
      };
    } catch (error: any) {
      console.error('❌ Undo error:', error.message);
      throw error;
    }
  }
}

export default UndoService;
