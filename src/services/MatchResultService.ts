/**
 * Match Result Service
 * Handles match result determination and winner calculation
 */

import db from '../models/index.js';

class MatchResultService {
  /**
   * Determine match winner
   */
  static async determineWinner(matchId: string) {
    const match = await db.Match.findByPk(matchId, {
      include: [
        { model: db.Team, as: 'teamA', attributes: ['id', 'name'] },
        { model: db.Team, as: 'teamB', attributes: ['id', 'name'] },
      ],
    });

    if (!match) {
      throw new Error('Match not found');
    }

    if (!match.firstInningsRuns || !match.secondInningsRuns) {
      throw new Error('Both innings must be completed to determine winner');
    }

    let resultType: 'win-by-runs' | 'win-by-wickets' | 'tie' | 'no-result';
    let winnerTeamId: string | null = null;
    let margin: number | null = null;

    const firstInningsRuns = match.firstInningsRuns;
    const secondInningsRuns = match.secondInningsRuns;
    const secondInningsWickets = match.secondInningsWickets || 0;

    if (firstInningsRuns > secondInningsRuns) {
      // First team wins by runs
      resultType = 'win-by-runs';
      winnerTeamId = match.teamAId;
      margin = firstInningsRuns - secondInningsRuns;
    } else if (secondInningsRuns > firstInningsRuns) {
      // Second team wins by runs
      resultType = 'win-by-runs';
      winnerTeamId = match.teamBId;
      margin = secondInningsRuns - firstInningsRuns;
    } else if (firstInningsRuns === secondInningsRuns) {
      // Tie
      resultType = 'tie';
      winnerTeamId = null;
      margin = 0;
    } else {
      // No result
      resultType = 'no-result';
      winnerTeamId = null;
      margin = null;
    }

    // Update match with result
    await match.update({
      result: 'completed',
      resultType,
      winnerTeamId,
      margin,
    });

    return {
      matchId: match.id,
      resultType,
      winnerTeamId,
      winnerTeamName: winnerTeamId === match.teamAId ? (match as any).teamA?.name : (match as any).teamB?.name,
      margin,
      firstInningsRuns,
      secondInningsRuns,
    };
  }

  /**
   * Get match result
   */
  static async getMatchResult(matchId: string) {
    const match = await db.Match.findByPk(matchId, {
      include: [
        { model: db.Team, as: 'teamA', attributes: ['id', 'name'] },
        { model: db.Team, as: 'teamB', attributes: ['id', 'name'] },
        { model: db.Team, as: 'winnerTeam', attributes: ['id', 'name'] },
      ],
    });

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.result !== 'completed') {
      throw new Error('Match is not complete');
    }

    return {
      matchId: match.id,
      status: match.status,
      result: {
        resultType: match.resultType,
        winnerTeamId: match.winnerTeamId,
        winnerTeamName: (match as any).winnerTeam?.name || null,
        margin: match.margin,
        marginType: match.resultType === 'win-by-runs' ? 'runs' : 'wickets',
      },
      firstInnings: {
        teamId: match.teamAId,
        teamName: (match as any).teamA?.name,
        runs: match.firstInningsRuns,
        wickets: match.firstInningsWickets,
        overs: match.firstInningsOvers,
      },
      secondInnings: {
        teamId: match.teamBId,
        teamName: (match as any).teamB?.name,
        runs: match.secondInningsRuns,
        wickets: match.secondInningsWickets,
        overs: match.secondInningsOvers,
      },
    };
  }

  /**
   * Check if match is complete
   */
  static async checkMatchCompletion(matchId: string) {
    const match = await db.Match.findByPk(matchId);

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status !== 'live') {
      return { isComplete: true, reason: 'Match is not in live status' };
    }

    const balls = await db.Ball.findAll({
      where: { matchId },
    });

    let validBalls = 0;
    let wickets = 0;
    let runs = 0;

    for (const ball of balls) {
      if (ball.isValid && ball.extras !== 'wide' && ball.extras !== 'no-ball') {
        validBalls++;
      }
      if (ball.isWicket) {
        wickets++;
      }
      runs += ball.runs + ball.extraRuns;
    }

    // Check if all overs are bowled
    if (validBalls >= match.overs * 6) {
      return { isComplete: true, reason: 'All overs completed' };
    }

    // Check if all wickets are lost
    if (wickets >= 10) {
      return { isComplete: true, reason: 'All wickets lost' };
    }

    // Check if target is reached (second innings)
    if (match.currentInnings === 2 && match.target && runs >= match.target) {
      return { isComplete: true, reason: 'Target reached' };
    }

    // Check if target cannot be reached
    if (match.currentInnings === 2 && match.target) {
      const ballsRemaining = match.overs * 6 - validBalls;
      const runsNeeded = match.target - runs;
      if (ballsRemaining === 0 && runsNeeded > 0) {
        return { isComplete: true, reason: 'Target cannot be reached' };
      }
    }

    return { isComplete: false, reason: 'Match is ongoing' };
  }

  /**
   * Get run rates
   */
  static async getRunRates(matchId: string) {
    const match = await db.Match.findByPk(matchId);

    if (!match) {
      throw new Error('Match not found');
    }

    const balls = await db.Ball.findAll({
      where: { matchId },
    });

    let runs = 0;
    let validBalls = 0;

    for (const ball of balls) {
      runs += ball.runs + ball.extraRuns;
      if (ball.isValid && ball.extras !== 'wide' && ball.extras !== 'no-ball') {
        validBalls++;
      }
    }

    const overs = Math.floor(validBalls / 6);
    const ballsInCurrentOver = validBalls % 6;
    const oversCompleted = overs + ballsInCurrentOver / 6;

    const currentRunRate = oversCompleted > 0 ? (runs / oversCompleted).toFixed(2) : '0.00';

    let requiredRunRate = null;
    let oversRemaining = null;

    if (match.target) {
      const ballsRemaining = match.overs * 6 - validBalls;
      oversRemaining = ballsRemaining / 6;
      const runsNeeded = match.target - runs;
      requiredRunRate = oversRemaining > 0 ? (runsNeeded / oversRemaining).toFixed(2) : '0.00';
    }

    return {
      matchId: match.id,
      currentRunRate: parseFloat(currentRunRate as string),
      requiredRunRate: requiredRunRate ? parseFloat(requiredRunRate as string) : null,
      runRateDifference:
        requiredRunRate && currentRunRate
          ? (parseFloat(requiredRunRate as string) - parseFloat(currentRunRate as string)).toFixed(2)
          : null,
      oversCompleted: oversCompleted.toFixed(1),
      oversRemaining: oversRemaining ? oversRemaining.toFixed(1) : null,
    };
  }
}

export default MatchResultService;
