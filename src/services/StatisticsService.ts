/**
 * Statistics Service
 * Calculates match and player statistics
 */

import db from '../models/index.js';

class StatisticsService {
  /**
   * Calculate match statistics
   */
  static async calculateMatchStats(matchId: string) {
    const match = await db.Match.findByPk(matchId);

    if (!match) {
      throw new Error('Match not found');
    }

    const balls = await db.Ball.findAll({
      where: { matchId },
      order: [['over', 'ASC'], ['ballNumber', 'ASC']],
    });

    // Determine which team is batting and which is fielding based on toss
    const battingTeamId = match.tossChoice === 'bat' ? match.tossWinnerId : 
                          (match.tossWinnerId === match.teamAId ? match.teamBId : match.teamAId);
    const fieldingTeamId = battingTeamId === match.teamAId ? match.teamBId : match.teamAId;

    let teamAStats = { runs: 0, wickets: 0, overs: 0, balls: 0 };
    let teamBStats = { runs: 0, wickets: 0, overs: 0, balls: 0 };

    for (const ball of balls) {
      const isBattingTeamA = battingTeamId === match.teamAId;
      const stats = isBattingTeamA ? teamAStats : teamBStats;

      // Count valid balls
      if (ball.isValid && ball.extras !== 'wide' && ball.extras !== 'no-ball') {
        stats.balls++;
        if (stats.balls > 6) {
          stats.overs++;
          stats.balls = 1;
        }
      }

      // Add runs
      stats.runs += ball.runs + ball.extraRuns;

      // Count wickets
      if (ball.isWicket) {
        stats.wickets++;
      }
    }

    // Calculate overs properly
    teamAStats.overs = Math.floor(teamAStats.balls / 6);
    teamAStats.balls = teamAStats.balls % 6;
    teamBStats.overs = Math.floor(teamBStats.balls / 6);
    teamBStats.balls = teamBStats.balls % 6;

    const teamARunRate = teamAStats.overs > 0 || teamAStats.balls > 0 
      ? (teamAStats.runs / (teamAStats.overs + teamAStats.balls / 6)).toFixed(2)
      : '0.00';

    const teamBRunRate = teamBStats.overs > 0 || teamBStats.balls > 0
      ? (teamBStats.runs / (teamBStats.overs + teamBStats.balls / 6)).toFixed(2)
      : '0.00';

    return {
      teamA: {
        runs: teamAStats.runs,
        wickets: teamAStats.wickets,
        overs: `${teamAStats.overs}.${teamAStats.balls}`,
        runRate: parseFloat(teamARunRate as string),
      },
      teamB: {
        runs: teamBStats.runs,
        wickets: teamBStats.wickets,
        overs: `${teamBStats.overs}.${teamBStats.balls}`,
        runRate: parseFloat(teamBRunRate as string),
      },
    };
  }

  /**
   * Calculate player statistics
   */
  static async calculatePlayerStats(matchId: string, playerId: string) {
    const player = await db.Player.findByPk(playerId);

    if (!player) {
      throw new Error('Player not found');
    }

    const balls = await db.Ball.findAll({
      where: { matchId },
    });

    // Batting stats
    const batsmanBalls = balls.filter((b: any) => b.batsmanId === playerId);
    let batsmanRuns = 0;
    let ballsFaced = 0;

    for (const ball of batsmanBalls) {
      batsmanRuns += ball.runs;
      if (ball.isValid && ball.extras !== 'wide' && ball.extras !== 'no-ball') {
        ballsFaced++;
      }
    }

    const strikeRate = ballsFaced > 0 ? ((batsmanRuns / ballsFaced) * 100).toFixed(2) : '0.00';

    // Bowling stats
    const bowlerBalls = balls.filter((b: any) => b.bowlerId === playerId);
    let bowlerWickets = 0;
    let bowlerRuns = 0;
    let ballsBowled = 0;

    for (const ball of bowlerBalls) {
      if (ball.isValid && ball.extras !== 'wide' && ball.extras !== 'no-ball') {
        ballsBowled++;
      }
      bowlerRuns += ball.runs + ball.extraRuns;
      if (ball.isWicket) {
        bowlerWickets++;
      }
    }

    const overs = Math.floor(ballsBowled / 6);
    const remainingBalls = ballsBowled % 6;
    const economy = ballsBowled > 0 ? ((bowlerRuns / ballsBowled) * 6).toFixed(2) : '0.00';

    return {
      playerId,
      playerName: player.name,
      batting: {
        runs: batsmanRuns,
        ballsFaced,
        strikeRate: parseFloat(strikeRate as string),
      },
      bowling: {
        wickets: bowlerWickets,
        runs: bowlerRuns,
        overs: `${overs}.${remainingBalls}`,
        economy: parseFloat(economy as string),
      },
    };
  }

  /**
   * Get complete match scorecard
   */
  static async getScorecard(matchId: string) {
    const match = await db.Match.findByPk(matchId, {
      include: [
        { model: db.Team, as: 'teamA', attributes: ['id', 'name'] },
        { model: db.Team, as: 'teamB', attributes: ['id', 'name'] },
      ],
    });

    if (!match) {
      throw new Error('Match not found');
    }

    const stats = await this.calculateMatchStats(matchId);

    // Get all players in playing 11
    const teamAPlaying11 = (match as any).teamAPlaying11 || [];
    const teamBPlaying11 = (match as any).teamBPlaying11 || [];

    // Calculate player stats for all players
    const teamAPlayerStats = await Promise.all(
      teamAPlaying11.map((playerId: string) => this.calculatePlayerStats(matchId, playerId))
    );

    const teamBPlayerStats = await Promise.all(
      teamBPlaying11.map((playerId: string) => this.calculatePlayerStats(matchId, playerId))
    );

    return {
      id: match.id,
      teamA: {
        id: match.teamAId,
        name: (match as any).teamA?.name,
        runs: stats.teamA.runs,
        wickets: stats.teamA.wickets,
        overs: stats.teamA.overs,
        runRate: stats.teamA.runRate,
        players: teamAPlayerStats,
      },
      teamB: {
        id: match.teamBId,
        name: (match as any).teamB?.name,
        runs: stats.teamB.runs,
        wickets: stats.teamB.wickets,
        overs: stats.teamB.overs,
        runRate: stats.teamB.runRate,
        players: teamBPlayerStats,
      },
    };
  }
}

export default StatisticsService;
