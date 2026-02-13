/**
 * Innings Service
 * Handles manual innings completion and second innings setup
 * Innings transition is ONLY via explicit manual action
 */

import db from '../models/index.js';
import { calculateInningsStats, BallRecord } from '../utils/cricketRulesEngine.js';

class InningsService {
  /**
   * Complete current innings and prepare for next
   * This is the ONLY way to transition innings
   */
  static async completeInnings(matchId: string, scorerId: string) {
    console.log('🏁 Completing innings for match:', matchId);

    try {
      const match = await db.Match.findByPk(matchId);
      if (!match) throw new Error('Match not found');
      if (match.status !== 'live') throw new Error('Match must be live');

      const currentInnings = match.currentInnings || 1;

      // Get all balls for current innings
      const balls = await db.Ball.findAll({
        where: {
          matchId,
          inningsNumber: currentInnings,
        },
        order: [['over', 'ASC'], ['ballNumber', 'ASC']],
      });

      // Calculate final stats
      const stats = calculateInningsStats(
        balls.map((b: any) => ({
          batsmanId: b.batsmanId,
          bowlerId: b.bowlerId,
          runs: b.runs,
          extraRuns: b.extraRuns,
          extras: b.extras,
          isWicket: b.isWicket,
          wicketType: b.wicketType,
        }))
      );

      // Update current innings stats
      if (currentInnings === 1) {
        await match.update({
          firstInningsRuns: stats.runs,
          firstInningsWickets: stats.wickets,
          firstInningsOvers: stats.oversString,
          firstInningsComplete: true,
        });

        // Calculate target for second innings
        const target = stats.runs + 1;

        console.log(`✅ First innings complete: ${stats.runs}/${stats.wickets}`);
        console.log(`🎯 Target for second innings: ${target}`);

        return {
          success: true,
          inningsNumber: 1,
          runs: stats.runs,
          wickets: stats.wickets,
          overs: stats.oversString,
          target,
          message: 'First innings complete. Second innings ready.',
        };
      } else {
        // Second innings complete
        await match.update({
          secondInningsRuns: stats.runs,
          secondInningsWickets: stats.wickets,
          secondInningsOvers: stats.oversString,
          secondInningsComplete: true,
          status: 'completed',
        });

        const firstInningsRuns = match.firstInningsRuns || 0;
        const result =
          stats.runs > firstInningsRuns
            ? 'Chasing team won'
            : stats.runs === firstInningsRuns
              ? 'Tie'
              : 'Batting team won';

        console.log(`✅ Second innings complete: ${stats.runs}/${stats.wickets}`);
        console.log(`🏆 Result: ${result}`);

        return {
          success: true,
          inningsNumber: 2,
          runs: stats.runs,
          wickets: stats.wickets,
          overs: stats.oversString,
          result,
          message: 'Match complete.',
        };
      }
    } catch (error: any) {
      console.error('❌ Error completing innings:', error.message);
      throw error;
    }
  }

  /**
   * Start second innings
   * Called after first innings is complete
   */
  static async startSecondInnings(matchId: string) {
    console.log('🔄 Starting second innings for match:', matchId);

    try {
      const match = await db.Match.findByPk(matchId);
      if (!match) throw new Error('Match not found');
      if (!match.firstInningsComplete) throw new Error('First innings must be complete');

      // Transition to second innings
      await match.update({
        currentInnings: 2,
        secondInningsRuns: 0,
        secondInningsWickets: 0,
        secondInningsOvers: '0.0',
      });

      console.log('✅ Second innings started');

      return {
        success: true,
        currentInnings: 2,
        target: (match.firstInningsRuns || 0) + 1,
      };
    } catch (error: any) {
      console.error('❌ Error starting second innings:', error.message);
      throw error;
    }
  }
}

export default InningsService;
