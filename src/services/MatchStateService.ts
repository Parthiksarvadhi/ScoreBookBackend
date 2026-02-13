/**
 * Match State Service
 * Tracks and manages current match state
 * Single source of truth for who is batting/bowling
 */

import db from '../models/index.js';
import { calculateMatchState, calculateInningsStats, BallRecord, isLegal } from '../utils/cricketRulesEngine.js';

interface CurrentMatchState {
  striker: {
    playerId: string;
    playerName: string;
  };
  nonStriker: {
    playerId: string;
    playerName: string;
  };
  bowler: {
    playerId: string;
    playerName: string;
  };
  currentOver: number;
  currentBall: number;
  legalBallsInOver: number;
}

class MatchStateService {
  /**
   * Get current match state
   * Replays all balls to derive authoritative state
   */
  static async getCurrentState(matchId: string): Promise<CurrentMatchState> {
    try {
      const match = await db.Match.findByPk(matchId);
      if (!match) throw new Error('Match not found');
      if (match.status !== 'live' && match.status !== 'completed') {
        throw new Error('Match must be live or completed');
      }

      const currentInnings = match.currentInnings || 1;

      // Get all balls for current innings
      const allBalls = await db.Ball.findAll({
        where: {
          matchId,
          inningsNumber: currentInnings,
        },
        order: [['over', 'ASC'], ['ballNumber', 'ASC']],
      });

      // Convert to BallRecord format
      const ballRecords: BallRecord[] = allBalls.map((b: any) => ({
        batsmanId: b.batsmanId,
        nonStrikerId: b.nonStrikerId,
        bowlerId: b.bowlerId,
        runs: b.runs,
        extraRuns: b.extraRuns,
        extras: b.extras,
        isWicket: b.isWicket,
        wicketType: b.wicketType,
      }));

      // Determine who batted first based on toss
      let firstInningsBattingTeamId: string;
      if (match.tossChoice === 'bat') {
        firstInningsBattingTeamId = match.tossWinnerId!;
      } else {
        firstInningsBattingTeamId = match.tossWinnerId === match.teamAId ? match.teamBId : match.teamAId;
      }

      let battingTeamId: string;
      let battingOrder: string[];

      if (currentInnings === 1) {
        battingTeamId = firstInningsBattingTeamId;
        battingOrder = battingTeamId === match.teamAId ? match.teamABattingOrder : match.teamBBattingOrder;
      } else {
        battingTeamId = firstInningsBattingTeamId === match.teamAId ? match.teamBId : match.teamAId;
        battingOrder = battingTeamId === match.teamAId ? match.teamABattingOrder : match.teamBBattingOrder;
      }

      // Get initial state
      const initialState = {
        striker: battingOrder?.[0] || '',
        nonStriker: battingOrder?.[1] || '',
        bowler: ballRecords.length > 0 ? ballRecords[0].bowlerId : '',
        over: 1,
        ballInOver: 1,
        legalBallsInOver: 0,
      };

      // If no balls yet, we need to get the bowler from the fielding team
      // For now, just use the first player from fielding team
      let bowlerId = initialState.bowler;
      if (!bowlerId && ballRecords.length === 0) {
        // Get fielding team
        let fieldingTeamId: string;
        if (currentInnings === 1) {
          fieldingTeamId = battingTeamId === match.teamAId ? match.teamBId : match.teamAId;
        } else {
          const firstInningsBatting = match.tossChoice === 'bat' ? match.teamAId : match.teamBId;
          fieldingTeamId = firstInningsBatting;
        }

        // Get fielding team's playing 11
        const fieldingPlaying11 = fieldingTeamId === match.teamAId ? match.teamAPlaying11 : match.teamBPlaying11;
        if (fieldingPlaying11 && fieldingPlaying11.length > 0) {
          bowlerId = fieldingPlaying11[0];
        }
      }

      const initialStateWithBowler = {
        ...initialState,
        bowler: bowlerId,
      };

      // Track out batsmen
      const outBatsmen = new Set<string>();
      for (const ball of ballRecords) {
        if (ball.isWicket) {
          outBatsmen.add(ball.batsmanId);
        }
      }

      // Calculate current state by replaying all balls
      const currentState = calculateMatchState(ballRecords, initialStateWithBowler, (excludeIds) => {
        // Get next batsman from batting order who hasn't been out yet
        for (const playerId of battingOrder || []) {
          if (!outBatsmen.has(playerId) && !excludeIds.includes(playerId)) {
            return playerId;
          }
        }
        return null;
      });

      // Get player details
      const strikerPlayer = currentState.striker ? await db.Player.findByPk(currentState.striker) : null;
      const nonStrikerPlayer = currentState.nonStriker ? await db.Player.findByPk(currentState.nonStriker) : null;
      const bowlerPlayer = currentState.bowler ? await db.Player.findByPk(currentState.bowler) : null;

      return {
        striker: {
          playerId: strikerPlayer?.id || '',
          playerName: strikerPlayer?.name || 'Unknown',
        },
        nonStriker: {
          playerId: nonStrikerPlayer?.id || '',
          playerName: nonStrikerPlayer?.name || 'Unknown',
        },
        bowler: {
          playerId: bowlerPlayer?.id || '',
          playerName: bowlerPlayer?.name || 'Unknown',
        },
        currentOver: currentState.over,
        currentBall: currentState.ballInOver,
        legalBallsInOver: currentState.legalBallsInOver,
      };
    } catch (error: any) {
      console.error('❌ Error getting current state:', error.message);
      throw error;
    }
  }

  /**
   * Validate that provided batsman/non-striker match expected state
   */
  static async validateBatsmen(
    matchId: string,
    providedBatsmanId: string,
    providedNonStrikerId: string
  ): Promise<{ valid: boolean; message: string }> {
    try {
      const currentState = await this.getCurrentState(matchId);

      if (currentState.striker.playerId !== providedBatsmanId) {
        return {
          valid: false,
          message: `Expected striker: ${currentState.striker.playerName}, got: ${providedBatsmanId}`,
        };
      }

      if (currentState.nonStriker.playerId !== providedNonStrikerId) {
        return {
          valid: false,
          message: `Expected non-striker: ${currentState.nonStriker.playerName}, got: ${providedNonStrikerId}`,
        };
      }

      return { valid: true, message: 'Batsmen match expected state' };
    } catch (error: any) {
      return { valid: false, message: error.message };
    }
  }

  /**
   * Get next expected state after recording a ball
   * Used by frontend to show what will happen
   */
  static async getNextState(
    matchId: string,
    ballData: {
      runs: number;
      extras: 'none' | 'wide' | 'no-ball' | 'bye' | 'leg-bye';
      extraRuns: number;
      isWicket: boolean;
      wicketType?: string;
    }
  ): Promise<CurrentMatchState> {
    try {
      const currentState = await this.getCurrentState(matchId);
      const match = await db.Match.findByPk(matchId);
      if (!match) throw new Error('Match not found');

      const currentInnings = match.currentInnings || 1;

      // Determine who batted first based on toss
      let firstInningsBattingTeamId: string;
      if (match.tossChoice === 'bat') {
        firstInningsBattingTeamId = match.tossWinnerId!;
      } else {
        firstInningsBattingTeamId = match.tossWinnerId === match.teamAId ? match.teamBId : match.teamAId;
      }

      // Get batting order
      let battingTeamId: string;
      let battingOrder: string[];

      if (currentInnings === 1) {
        battingTeamId = firstInningsBattingTeamId;
        battingOrder = battingTeamId === match.teamAId ? match.teamABattingOrder : match.teamBBattingOrder;
      } else {
        battingTeamId = firstInningsBattingTeamId === match.teamAId ? match.teamBId : match.teamAId;
        battingOrder = battingTeamId === match.teamAId ? match.teamABattingOrder : match.teamBBattingOrder;
      }

      // Get all balls to find out batsmen
      const allBalls = await db.Ball.findAll({
        where: {
          matchId,
          inningsNumber: currentInnings,
        },
      });

      const outBatsmen = new Set<string>();
      for (const ball of allBalls) {
        if (ball.isWicket) {
          outBatsmen.add(ball.batsmanId);
        }
      }

      // Get fielding team for bowler
      let fieldingTeamId: string;
      if (currentInnings === 1) {
        fieldingTeamId = battingTeamId === match.teamAId ? match.teamBId : match.teamAId;
      } else {
        const firstInningsBatting = match.tossChoice === 'bat' ? match.teamAId : match.teamBId;
        fieldingTeamId = firstInningsBatting;
      }

      // Get fielding team's playing 11
      const fieldingPlaying11 = fieldingTeamId === match.teamAId ? match.teamAPlaying11 : match.teamBPlaying11;
      let defaultBowler = fieldingPlaying11 && fieldingPlaying11.length > 0 ? fieldingPlaying11[0] : '';

      // Simulate the ball
      const legal = isLegal(ballData.extras as any);
      const totalRuns = ballData.runs + ballData.extraRuns;
      let nextStriker = currentState.striker.playerId;
      let nextNonStriker = currentState.nonStriker.playerId;
      let nextBowler = currentState.bowler.playerId || defaultBowler;
      let nextOver = currentState.currentOver;
      let nextLegalBalls = currentState.legalBallsInOver;

      // Handle wicket
      if (ballData.isWicket) {
        outBatsmen.add(nextStriker);
        // Get next batsman
        for (const playerId of battingOrder || []) {
          if (!outBatsmen.has(playerId) && playerId !== nextNonStriker) {
            nextStriker = playerId;
            break;
          }
        }
      }
      // Handle strike rotation on legal ball with odd runs
      else if (legal && totalRuns % 2 === 1) {
        [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
      }

      // Increment legal ball count
      if (legal) {
        nextLegalBalls += 1;
      }

      // Check if over is complete
      if (nextLegalBalls === 6) {
        nextOver += 1;
        nextLegalBalls = 0;
        // Strike swaps at end of over
        [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
      }

      // Get player details
      const strikerPlayer = await db.Player.findByPk(nextStriker);
      const nonStrikerPlayer = await db.Player.findByPk(nextNonStriker);
      const bowlerPlayer = await db.Player.findByPk(nextBowler);

      return {
        striker: {
          playerId: strikerPlayer?.id || '',
          playerName: strikerPlayer?.name || 'Unknown',
        },
        nonStriker: {
          playerId: nonStrikerPlayer?.id || '',
          playerName: nonStrikerPlayer?.name || 'Unknown',
        },
        bowler: {
          playerId: bowlerPlayer?.id || '',
          playerName: bowlerPlayer?.name || 'Unknown',
        },
        currentOver: nextOver,
        currentBall: nextLegalBalls + 1,
        legalBallsInOver: nextLegalBalls,
      };
    } catch (error: any) {
      console.error('❌ Error getting next state:', error.message);
      throw error;
    }
  }
}

export default MatchStateService;
