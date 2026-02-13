/**
 * Ball Scoring Service
 * Records balls and validates against cricket rules
 * Uses rules engine for all state calculations
 */

import db from '../models/index.js';
import { isLegal } from '../utils/cricketRulesEngine.js';
import MatchStateService from './MatchStateService.js';

interface BallData {
  over: number;
  ballNumber: number;
  batsmanId: string;
  nonStrikerId: string;
  bowlerId: string;
  runs: number;
  isWicket: boolean;
  wicketType?: string;
  extras: 'none' | 'wide' | 'no-ball' | 'bye' | 'leg-bye';
  extraRuns: number;
}

class BallScoringService {
  /**
   * Record a ball
   * Validates basic constraints and state consistency
   */
  static async recordBall(matchId: string, ballData: BallData, scorerId: string) {
    console.log('🎯 Recording ball:', {
      over: ballData.over,
      ball: ballData.ballNumber,
      batsman: ballData.batsmanId,
      nonStriker: ballData.nonStrikerId,
      bowler: ballData.bowlerId,
      runs: ballData.runs,
      extras: ballData.extras,
    });

    try {
      const match = await db.Match.findByPk(matchId);
      if (!match) throw new Error('Match not found');
      if (match.status !== 'live') throw new Error('Match must be live');

      const currentInnings = match.currentInnings || 1;

      // Validate basic constraints
      if (ballData.over < 1) {
        throw new Error('Invalid over number');
      }

      // Validate nonStrikerId is provided
      if (!ballData.nonStrikerId) {
        throw new Error('Non-striker ID is required');
      }

      // Validate players are in playing 11
      const batsmanInTeamA = (match as any).teamAPlaying11?.includes(ballData.batsmanId);
      const batsmanInTeamB = (match as any).teamBPlaying11?.includes(ballData.batsmanId);
      if (!batsmanInTeamA && !batsmanInTeamB) {
        throw new Error('Batsman must be in playing 11');
      }

      const nonStrikerInTeamA = (match as any).teamAPlaying11?.includes(ballData.nonStrikerId);
      const nonStrikerInTeamB = (match as any).teamBPlaying11?.includes(ballData.nonStrikerId);
      if (!nonStrikerInTeamA && !nonStrikerInTeamB) {
        throw new Error('Non-striker must be in playing 11');
      }

      const bowlerInTeamA = (match as any).teamAPlaying11?.includes(ballData.bowlerId);
      const bowlerInTeamB = (match as any).teamBPlaying11?.includes(ballData.bowlerId);
      if (!bowlerInTeamA && !bowlerInTeamB) {
        throw new Error('Bowler must be in playing 11');
      }

      // Batsman and bowler from different teams
      if ((batsmanInTeamA && bowlerInTeamA) || (batsmanInTeamB && bowlerInTeamB)) {
        throw new Error('Batsman and bowler must be from different teams');
      }

      // Non-striker and bowler from different teams
      if ((nonStrikerInTeamA && bowlerInTeamA) || (nonStrikerInTeamB && bowlerInTeamB)) {
        throw new Error('Non-striker and bowler must be from different teams');
      }

      // Batsman and non-striker must be from same team
      if ((batsmanInTeamA && !nonStrikerInTeamA) || (batsmanInTeamB && !nonStrikerInTeamB)) {
        throw new Error('Batsman and non-striker must be from same team');
      }

      // Fetch current state for validation
      const currentState = await MatchStateService.getCurrentState(matchId);

      // Validate New Over Bowler Change
      // If it's the start of a new over (ball 1) and not the first over of the match
      if (currentState.currentBall === 1 && currentState.currentOver > 1) {
        if (currentState.bowler.playerId === ballData.bowlerId) {
          throw new Error('New bowler cannot be the same as the previous over bowler');
        }
      }

      // Batsman and non-striker must be different
      if (ballData.batsmanId === ballData.nonStrikerId) {
        throw new Error('Batsman and non-striker must be different players');
      }

      // Check if last ball was a wicket or if it's the start of the innings
      const lastBall = await db.Ball.findOne({
        where: { matchId, inningsNumber: currentInnings },
        order: [['over', 'DESC'], ['ballNumber', 'DESC']],
      });

      const lastBallWasWicket = lastBall?.isWicket;
      const isStartOfInnings = !lastBall;

      // CRITICAL: Validate batsman/non-striker match current state
      // Only validate strictly if we are in the flow of an over and no wicket just happened
      if (!isStartOfInnings && !lastBallWasWicket) {
        console.log('🔍 Validating batsmen match current state...');
        // We already have currentState, so we can validate directly
        const validStriker = currentState.striker.playerId === ballData.batsmanId;
        const validNonStriker = currentState.nonStriker.playerId === ballData.nonStrikerId;

        if (!validStriker) {
          const msg = `Expected striker: ${currentState.striker.playerName}, got: ${ballData.batsmanId}`;
          console.warn(`⚠️ State validation warning: ${msg}. Allowing manual override.`);
          // throw new Error(`State validation failed: ${msg}`); // Allow override
        }
        if (!validNonStriker) {
          const msg = `Expected non-striker: ${currentState.nonStriker.playerName}, got: ${ballData.nonStrikerId}`;
          console.warn(`⚠️ State validation warning: ${msg}. Allowing manual override.`);
          // throw new Error(`State validation failed: ${msg}`); // Allow override
        }
        console.log('✅ Batsmen checked (overrides allowed)');
      } else {
        console.log('ℹ️ Skipping strict batsman validation due to wicket or start of innings');
      }

      // Check if batsman already out in this innings
      const batsmanOutBall = await db.Ball.findOne({
        where: {
          matchId,
          inningsNumber: currentInnings,
          batsmanId: ballData.batsmanId,
          isWicket: true,
        },
      });
      if (batsmanOutBall) {
        throw new Error('Batsman already out in this innings');
      }

      // Check if non-striker already out in this innings
      const nonStrikerOutBall = await db.Ball.findOne({
        where: {
          matchId,
          inningsNumber: currentInnings,
          batsmanId: ballData.nonStrikerId,
          isWicket: true,
        },
      });
      if (nonStrikerOutBall) {
        throw new Error('Non-striker already out in this innings');
      }

      // Calculate next physical ball number (auto-increment)
      const ballsInOver = await db.Ball.count({
        where: {
          matchId,
          inningsNumber: currentInnings,
          over: ballData.over,
        },
      });
      const nextBallNumber = ballsInOver + 1;

      // Validate wicket type
      if (ballData.isWicket && ballData.wicketType) {
        const validTypes = ['bowled', 'lbw', 'caught', 'stumped', 'run-out', 'hit-wicket'];
        if (!validTypes.includes(ballData.wicketType)) {
          throw new Error('Invalid wicket type');
        }
      }

      // Validate extras
      const validExtras = ['none', 'wide', 'no-ball', 'bye', 'leg-bye'];
      if (!validExtras.includes(ballData.extras)) {
        throw new Error('Invalid extras type');
      }

      // Calculate legal ball number
      const legal = isLegal(ballData.extras as any);
      let legalBallNumber = 0;
      if (legal) {
        const legalCount = await db.Ball.count({
          where: {
            matchId,
            inningsNumber: currentInnings,
            over: ballData.over,
            extras: ['none', 'bye', 'leg-bye'],
          },
        });
        legalBallNumber = legalCount + 1;
        if (legalBallNumber > 6) {
          throw new Error('Over is complete - cannot record more than 6 legal balls');
        }
      }

      // Create ball record
      const ball = await db.Ball.create({
        matchId,
        inningsNumber: currentInnings,
        over: ballData.over,
        ballNumber: nextBallNumber, // Use auto-incremented value
        legalBallNumber,
        batsmanId: ballData.batsmanId,
        nonStrikerId: ballData.nonStrikerId,
        bowlerId: ballData.bowlerId,
        runs: ballData.runs,
        isWicket: ballData.isWicket,
        wicketType: ballData.wicketType,
        extras: ballData.extras,
        extraRuns: ballData.extraRuns,
        isLegal: legal,
        isValid: true,
      });

      console.log('✅ Ball recorded:', ball.id);

      // Check for Match Status Update (Innings change, Match end)
      await this.checkMatchStatus(matchId, currentInnings);

      return ball;
    } catch (error: any) {
      console.error('❌ Error recording ball:', error.message);
      throw error;
    }
  }

  /**
   * Get all balls for a match
   */
  static async getBalls(matchId: string, inningsNumber?: number) {
    const where: any = { matchId };
    if (inningsNumber) where.inningsNumber = inningsNumber;

    return await db.Ball.findAll({
      where,
      order: [['over', 'ASC'], ['ballNumber', 'ASC']],
    });
  }

  /**
   * Delete a ball (for undo)
   */
  static async deleteBall(matchId: string, ballId: string) {
    const ball = await db.Ball.findOne({
      where: { id: ballId, matchId },
    });

    if (!ball) throw new Error('Ball not found');

    await ball.destroy();
    console.log('✅ Ball deleted:', ballId);
    return { message: 'Ball deleted' };
  }

  /**
   * Check if innings or match is complete
   */
  static async checkMatchStatus(matchId: string, currentInnings: number) {
    const match = await db.Match.findByPk(matchId);
    if (!match) return;

    // Get all balls for current innings
    const balls = await db.Ball.findAll({
      where: { matchId, inningsNumber: currentInnings },
    });

    // Calculate stats
    let legalBalls = 0;
    let wickets = 0;
    let currentRuns = 0;

    for (const ball of balls) {
      if (isLegal(ball.extras as any)) legalBalls++;
      if (ball.isWicket) wickets++;
      currentRuns += ball.runs + ball.extraRuns;
    }

    const oversBowled = Math.floor(legalBalls / 6);
    const ballsInCurrentOver = legalBalls % 6;
    const isOverComplete = ballsInCurrentOver === 0 && legalBalls > 0;
    const oversString = `${oversBowled}.${ballsInCurrentOver}`;

    // Update Live Score in Match Table (Denormalization for list view)
    if (currentInnings === 1) {
      await match.update({
        firstInningsRuns: currentRuns,
        firstInningsWickets: wickets,
        firstInningsOvers: oversString,
      });
    } else {
      await match.update({
        secondInningsRuns: currentRuns,
        secondInningsWickets: wickets,
        secondInningsOvers: oversString,
      });
    }

    // Check Overs Limit
    const maxOvers = match.overs || 20;
    const isInningsOversComplete = oversBowled >= maxOvers;

    // Check All Out
    const isAllOut = wickets >= 10; // Assuming 11 players

    // Check Target (2nd Innings)
    let matchEnded = false;
    let winner = null;
    let resultMessage = '';

    if (currentInnings === 2) {
      const target = match.target || 0;
      const battingTeamId = match.tossChoice === 'bat' ? match.teamBId : match.teamAId; // 2nd innings batting team
      const fieldingTeamId = match.tossChoice === 'bat' ? match.teamAId : match.teamBId; // 2nd innings fielding team

      if (currentRuns >= target) {
        // Chasing team won
        matchEnded = true;
        winner = battingTeamId; // Chasing team
        const wickedFallen = wickets;
        const totalWickets = 10; // Assuming 10 wickets
        const margin = totalWickets - wickedFallen;

        await match.update({
          status: 'completed',
          result: 'completed',
          winnerTeamId: winner,
          resultType: 'win-by-wickets',
          margin: margin
        });

        const winningTeam = await db.Team.findByPk(winner);
        resultMessage = `Match Won by ${winningTeam?.name} by ${margin} wickets`;

      } else if (isAllOut || isInningsOversComplete) {
        // Innings 2 ended without reaching target
        if (currentRuns === target - 1) {
          // TIE
          matchEnded = true;
          await match.update({
            status: 'completed',
            result: 'completed',
            resultType: 'tie',
            margin: 0
          });
          resultMessage = 'Match Tied';
        } else {
          // Defending team won
          matchEnded = true;
          winner = fieldingTeamId; // Defending team
          const margin = (target - 1) - currentRuns;

          await match.update({
            status: 'completed',
            result: 'completed',
            winnerTeamId: winner,
            resultType: 'win-by-runs',
            margin: margin
          });

          const winningTeam = await db.Team.findByPk(winner);
          resultMessage = `Match Won by ${winningTeam?.name} by ${margin} runs`;
        }
      }
    }

    if (matchEnded) {
      console.log('🏁 Match Ended:', resultMessage);
      console.log('🏁 Match Ended:', resultMessage);
      return {
        status: 'completed',
        message: resultMessage,
        winnerTeamId: winner,
        resultType: match.resultType,
        margin: match.margin
      };
    }

    // Handle End of 1st Innings
    if (currentInnings === 1 && (isAllOut || isInningsOversComplete)) {
      // Switch to 2nd Innings
      console.log('🔄 End of 1st Innings. Switching...');
      await match.update({
        currentInnings: 2,
        firstInningsRuns: currentRuns,
        firstInningsWickets: wickets,
        firstInningsOvers: `${oversBowled}.${ballsInCurrentOver}`,
        target: currentRuns + 1
      });
      return { status: 'innings_break', message: 'Innings Break' };
    }
  }
}

export default BallScoringService;
