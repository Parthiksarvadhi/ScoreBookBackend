/**
 * Live Score Service
 * Derives live score by replaying all balls of current innings
 * Single source of truth: ball records
 * No manual calculations or state mutations
 */

import db from '../models/index.js';
import { calculateMatchState, calculateInningsStats, BallRecord } from '../utils/cricketRulesEngine.js';

interface LiveScoreResponse {
  matchId: string;
  currentInnings: number;
  status: string;

  // Match Info
  matchInfo: {
    venue?: string;
    matchType: string;
    scorerName?: string;
    tossWinnerName?: string;
    tossChoice?: string;
    startTime?: Date;
  };

  // Teams Info
  teams: {
    teamA: { id: string; name: string; logo?: string; playing11: any[] };
    teamB: { id: string; name: string; logo?: string; playing11: any[] };
  };

  // Batting team info (Current)
  battingTeam: {
    teamId: string;
    teamName: string;
    runs: number;
    wickets: number;
    overs: string;
    ballsFaced: number;
    runRate: number;
  };

  // Fielding team info (Current)
  fieldingTeam: {
    teamId: string;
    teamName: string;
  };

  // Current batsmen
  striker: {
    playerId: string;
    playerName: string;
    runs: number;
    ballsFaced: number;
  } | null;

  nonStriker: {
    playerId: string;
    playerName: string;
    runs: number;
    ballsFaced: number;
  } | null;

  // Current bowler
  bowler: {
    playerId: string;
    playerName: string;
    ballsBowled: number;
    runsConceded: number;
    wickets: number;
  } | null;

  // Match state
  currentOver: number;
  currentBall: number;
  recentBalls: Array<{
    runs: number;
    extras: string;
    extraRuns: number;
    isWicket: boolean;
    wicketType?: string;
  }>;
  overs?: Array<{
    overNumber: number;
    runs: number;
    wickets: number;
    balls: Array<{
      runs: number;
      extras: string;
      extraRuns: number;
      isWicket: boolean;
      wicketType?: string;
    }>;
  }>;

  // Innings Data for Scorecard Tab
  scorecards: Array<{
    inningsNumber: number;
    battingTeamName: string;
    runs: number;
    wickets: number;
    overs: string;
    batting: any[];
    bowling: any[];
    extras: any;
  }>;

  // Second innings specific
  target?: number;
  ballsRemaining?: number;
  runsNeeded?: number;
  requiredRunRate?: number;
}

class LiveScoreService {
  /**
   * Get live score for current innings
   * Replays all balls for all innings to derive authoritative state
   */
  static async getLiveScore(matchId: string): Promise<LiveScoreResponse> {
    try {
      const match = await db.Match.findByPk(matchId, {
        include: [
          { model: db.User, as: 'scorer', attributes: ['id', 'firstName', 'lastName'] },
          { model: db.Team, as: 'teamA', include: [{ model: db.Player, as: 'players' }] },
          { model: db.Team, as: 'teamB', include: [{ model: db.Player, as: 'players' }] },
          { model: db.Team, as: 'tossWinner', attributes: ['name'] },
        ]
      });

      if (!match) {
        console.log(`[LiveScoreService] ❌ Match not found for ID: ${matchId}`);
        throw new Error('Match not found');
      }

      console.log(`[LiveScoreService] 🏟️ Match fetched: ${match.name} (Status: ${match.status}, Innings: ${match.currentInnings})`);
      console.log(`[LiveScoreService] 👥 Team A: ${match.teamA?.name} (Players: ${match.teamA?.players?.length || 0})`);
      console.log(`[LiveScoreService] 👥 Team B: ${match.teamB?.name} (Players: ${match.teamB?.players?.length || 0})`);
      console.log(`[LiveScoreService] 🏏 Toss: Winner=${match.tossWinnerId}, Choice=${match.tossChoice}`);
      console.log(`[LiveScoreService] 📝 Playing11: A=${match.teamAPlaying11 ? 'Yes' : 'No'}, B=${match.teamBPlaying11 ? 'Yes' : 'No'}`);

      if (match.status !== 'live' && match.status !== 'completed') throw new Error('Match must be live or completed');

      const currentInnings = match.currentInnings || 1;

      // Get ALL balls for the match to build scorecards for all innings
      const allMatchBalls = await db.Ball.findAll({
        where: { matchId },
        order: [['inningsNumber', 'ASC'], ['over', 'ASC'], ['ballNumber', 'ASC']],
      });

      // Filter balls for current innings for the "Live" summary
      const currentInningsBalls = allMatchBalls.filter((b: any) => b.inningsNumber === currentInnings);

      const ballRecords: BallRecord[] = currentInningsBalls.map((b: any) => ({
        batsmanId: b.batsmanId,
        bowlerId: b.bowlerId,
        runs: b.runs,
        extraRuns: b.extraRuns,
        extras: b.extras,
        isWicket: b.isWicket,
        wicketType: b.wicketType,
      }));

      // Determine batting/fielding team ids for current innings
      const firstInningsBatting = match.tossChoice === 'bat' ? (match.teamAId || match.team1Id) : (match.teamBId || match.team2Id);
      let battingTeamId: string;
      let fieldingTeamId: string;
      let battingOrder: string[];

      if (currentInnings === 1) {
        battingTeamId = firstInningsBatting;
        fieldingTeamId = battingTeamId === (match.teamAId || match.team1Id) ? (match.teamBId || match.team2Id) : (match.teamAId || match.team1Id);
        battingOrder = battingTeamId === match.teamAId ? match.teamABattingOrder : match.teamBBattingOrder;
      } else {
        battingTeamId = firstInningsBatting === (match.teamAId || match.team1Id) ? (match.teamBId || match.team2Id) : (match.teamAId || match.team1Id);
        fieldingTeamId = firstInningsBatting;
        battingOrder = battingTeamId === match.teamAId ? match.teamABattingOrder : match.teamBBattingOrder;
      }

      const battingTeam = battingTeamId === match.teamAId ? match.teamA : match.teamB;
      const fieldingTeam = fieldingTeamId === match.teamAId ? match.teamA : match.teamB;

      const playerMap = new Map<string, string>();
      [...(match.teamA?.players || []), ...(match.teamB?.players || [])].forEach((p: any) => playerMap.set(p.id, p.name));

      // Calculate scorecards for all innings that have balls OR the current innings
      const inningsWithBalls = [...new Set(allMatchBalls.map((b: any) => b.inningsNumber))].filter(Boolean);
      const inningsNumbers = [...new Set([...inningsWithBalls, currentInnings])].filter(n => typeof n === 'number').sort();

      const scorecards = inningsNumbers.map((inv: any) => {
        const invBalls = allMatchBalls.filter((b: any) => b.inningsNumber === inv);
        const invBattingId = inv === 1 ? firstInningsBatting : (firstInningsBatting === (match.teamAId || match.team1Id) ? (match.teamBId || match.team2Id) : (match.teamAId || match.team1Id));
        const invBattingTeam = invBattingId === match.teamAId ? match.teamA : match.teamB;

        // Ensure battingOrder is an array
        let invBattingOrder: string[] = (invBattingId === match.teamAId ? match.teamABattingOrder : match.teamBBattingOrder) || [];
        if (invBattingOrder && typeof invBattingOrder === 'string') {
          try { invBattingOrder = JSON.parse(invBattingOrder); } catch (e) { invBattingOrder = []; }
        }
        if (!Array.isArray(invBattingOrder)) invBattingOrder = [];

        return this.calculateInningsScorecard(inv, invBattingTeam, invBalls, invBattingOrder, playerMap);
      });

      // Calculate current innings stats
      const inningsStats = calculateInningsStats(ballRecords);

      // Get initial state
      // Ensure current battingOrder is an array
      let currentBattingOrder: string[] = battingOrder || [];
      if (currentBattingOrder && typeof currentBattingOrder === 'string') {
        try { currentBattingOrder = JSON.parse(currentBattingOrder); } catch (e) { currentBattingOrder = []; }
      }
      if (!Array.isArray(currentBattingOrder)) currentBattingOrder = [];

      const initialState = {
        striker: currentBattingOrder[0] || '',
        nonStriker: currentBattingOrder[1] || '',
        bowler: ballRecords.length > 0 ? ballRecords[0].bowlerId : '',
        over: 1,
        ballInOver: 1,
        legalBallsInOver: 0,
      };

      // Track out batsmen for current innings
      const outBatsmen = new Set<string>();
      for (const ball of ballRecords) {
        if (ball.isWicket) outBatsmen.add(ball.batsmanId);
      }

      const currentState = calculateMatchState(ballRecords, initialState, (excludeIds) => {
        for (const playerId of currentBattingOrder) {
          if (!outBatsmen.has(playerId) && !excludeIds.includes(playerId)) return playerId;
        }
        return null;
      });

      // Get detailed stats for current striker/non-striker/bowler
      const strikerStats = currentState.striker ? this.getPlayerStats(ballRecords, currentState.striker) : null;
      const nonStrikerStats = currentState.nonStriker ? this.getPlayerStats(ballRecords, currentState.nonStriker) : null;
      const bowlerStats = currentState.bowler ? this.getBowlerStats(ballRecords, currentState.bowler) : null;

      // Safely parse playing11 if they are strings
      let teamAPlaying11 = match.teamAPlaying11;
      if (teamAPlaying11 && typeof teamAPlaying11 === 'string') {
        try { teamAPlaying11 = JSON.parse(teamAPlaying11); } catch (e) { teamAPlaying11 = null; }
      }

      let teamBPlaying11 = match.teamBPlaying11;
      if (teamBPlaying11 && typeof teamBPlaying11 === 'string') {
        try { teamBPlaying11 = JSON.parse(teamBPlaying11); } catch (e) { teamBPlaying11 = null; }
      }

      const response: LiveScoreResponse = {
        matchId,
        currentInnings,
        status: match.status,
        matchInfo: {
          venue: match.venue,
          matchType: match.matchType,
          scorerName: match.scorer ? `${match.scorer.firstName} ${match.scorer.lastName}` : 'System',
          tossWinnerName: match.tossWinner?.name,
          tossChoice: match.tossChoice,
          startTime: match.startTime,
        },
        teams: {
          teamA: {
            id: match.teamAId,
            name: match.teamA?.name || 'Team A',
            logo: match.teamA?.logo,
            playing11: match.teamA?.players ? (Array.isArray(teamAPlaying11) ? match.teamA.players.filter((p: any) => teamAPlaying11.includes(p.id)) : match.teamA.players) : [],
          },
          teamB: {
            id: match.teamBId,
            name: match.teamB?.name || 'Team B',
            logo: match.teamB?.logo,
            playing11: match.teamB?.players ? (Array.isArray(teamBPlaying11) ? match.teamB.players.filter((p: any) => teamBPlaying11.includes(p.id)) : match.teamB.players) : [],
          },
        },
        battingTeam: {
          teamId: battingTeamId,
          teamName: battingTeam?.name || (battingTeamId === match.teamAId ? 'Team A' : 'Team B'),
          runs: inningsStats.runs,
          wickets: inningsStats.wickets,
          overs: inningsStats.oversString,
          ballsFaced: inningsStats.legalBalls,
          runRate: inningsStats.legalBalls > 0 ? parseFloat((inningsStats.runs / inningsStats.legalBalls * 6).toFixed(2)) : 0,
        },
        fieldingTeam: {
          teamId: fieldingTeamId,
          teamName: fieldingTeam?.name || 'Team B',
        },
        striker: currentState.striker ? {
          playerId: currentState.striker,
          playerName: playerMap.get(currentState.striker) || 'Striker',
          runs: strikerStats?.runs || 0,
          ballsFaced: strikerStats?.ballsFaced || 0,
        } : null,
        nonStriker: currentState.nonStriker ? {
          playerId: currentState.nonStriker,
          playerName: playerMap.get(currentState.nonStriker) || 'Non-Striker',
          runs: nonStrikerStats?.runs || 0,
          ballsFaced: nonStrikerStats?.ballsFaced || 0,
        } : null,
        bowler: currentState.bowler ? {
          playerId: currentState.bowler,
          playerName: playerMap.get(currentState.bowler) || 'Bowler',
          ballsBowled: bowlerStats?.ballsBowled || 0,
          runsConceded: bowlerStats?.runsConceded || 0,
          wickets: bowlerStats?.wickets || 0,
        } : null,
        currentOver: currentState.over,
        currentBall: currentState.ballInOver,
        recentBalls: ballRecords.slice(-12).map(b => ({
          runs: b.runs,
          extras: b.extras,
          extraRuns: b.extraRuns,
          isWicket: b.isWicket,
          wicketType: b.wicketType,
        })),
        overs: this.processOvers(currentInningsBalls),
        scorecards: scorecards,
      };

      console.log(`[LiveScoreService] 🛰️ PREPARING RESPONSE. Keys: ${Object.keys(response).join(', ')}`);
      console.log(`[LiveScoreService] 🛰️ Response Status: ${response.status}, Scorecards: ${response.scorecards.length}`);

      return response;
    } catch (error: any) {
      console.error('❌ Error getting live score:', error.message);
      throw error;
    }
  }

  /**
   * Helper to calculate a full scorecard for a given set of balls
   */
  private static calculateInningsScorecard(inningsNumber: number, battingTeam: any, balls: any[], battingOrder: string[], playerMap: Map<string, string>) {
    const battingStats = new Map<string, any>();
    const bowlingStats = new Map<string, any>();
    const extras = { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 };

    // Initialize batting stats for all team players or batting order
    const squad = battingTeam?.players || [];
    const orderedPlayers = battingOrder ?
      [...battingOrder.map(id => squad.find((p: any) => p.id === id)).filter(Boolean), ...squad.filter((p: any) => !battingOrder.includes(p.id))]
      : squad;

    orderedPlayers.forEach((p: any) => {
      battingStats.set(p.id, {
        id: p.id,
        name: p.name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        dismissal: '',
        status: 'did_not_bat'
      });
    });

    balls.forEach(ball => {
      // Batting
      const bats = battingStats.get(ball.batsmanId);
      if (bats) {
        if (bats.status === 'did_not_bat') bats.status = 'batting';
        if (ball.extras !== 'wide') bats.balls++;
        bats.runs += ball.runs;
        if (ball.runs === 4) bats.fours++;
        if (ball.runs === 6) bats.sixes++;
        if (ball.isWicket) {
          bats.isOut = true;
          bats.status = 'out';
          bats.dismissal = ball.wicketType || 'out';
        }
      }

      // Bowling
      if (!bowlingStats.has(ball.bowlerId)) {
        bowlingStats.set(ball.bowlerId, {
          id: ball.bowlerId,
          name: playerMap.get(ball.bowlerId) || 'Unknown',
          overs: 0,
          balls: 0,
          maidens: 0,
          runs: 0,
          wickets: 0
        });
      }
      const bowl = bowlingStats.get(ball.bowlerId);
      if (ball.extras !== 'wide' && ball.extras !== 'no-ball') bowl.balls++;
      bowl.runs += ball.runs + (ball.extras === 'wide' || ball.extras === 'no-ball' ? ball.extraRuns : 0);
      if (ball.isWicket && ball.wicketType !== 'run-out') bowl.wickets++;

      // Extras
      if (ball.extras === 'wide') extras.wides += ball.extraRuns, extras.total += ball.extraRuns;
      if (ball.extras === 'no-ball') extras.noBalls += ball.extraRuns, extras.total += ball.extraRuns;
      if (ball.extras === 'bye') extras.byes += ball.extraRuns, extras.total += ball.extraRuns;
      if (ball.extras === 'leg-bye') extras.legByes += ball.extraRuns, extras.total += ball.extraRuns;
    });

    const battingArr = Array.from(battingStats.values()).map(s => ({
      ...s,
      strikeRate: s.balls > 0 ? (s.runs / s.balls * 100).toFixed(1) : '0.0'
    }));

    const bowlingArr = Array.from(bowlingStats.values()).map(s => ({
      ...s,
      overs: Math.floor(s.balls / 6) + (s.balls % 6) / 10,
      economy: s.balls > 0 ? (s.runs / (s.balls / 6)).toFixed(2) : '0.0'
    }));

    const stats = calculateInningsStats(balls);

    return {
      inningsNumber,
      battingTeamName: battingTeam?.name || `Innings ${inningsNumber}`,
      runs: stats.runs,
      wickets: stats.wickets,
      overs: stats.oversString,
      batting: battingArr,
      bowling: bowlingArr,
      extras
    };
  }

  private static processOvers(currentInningsBalls: any[]) {
    const oversMap = new Map<number, any>();

    currentInningsBalls.forEach(ball => {
      if (!oversMap.has(ball.over)) {
        oversMap.set(ball.over, {
          overNumber: ball.over,
          runs: 0,
          wickets: 0,
          balls: []
        });
      }
      const over = oversMap.get(ball.over);
      over.balls.push({
        runs: ball.runs,
        extras: ball.extras,
        extraRuns: ball.extraRuns,
        isWicket: ball.isWicket,
        wicketType: ball.wicketType,
        ballNumber: ball.ballNumber
      });
      over.runs += ball.runs + ball.extraRuns;
      if (ball.isWicket) over.wickets += 1;
    });

    return Array.from(oversMap.values()).sort((a, b) => b.overNumber - a.overNumber);
  }

  private static getPlayerStats(ballRecords: BallRecord[], playerId: string) {
    let runs = 0;
    let ballsFaced = 0;
    for (const ball of ballRecords) {
      if (ball.batsmanId === playerId) {
        runs += ball.runs;
        if (ball.extras !== 'wide') ballsFaced++;
      }
    }
    return { runs, ballsFaced };
  }

  private static getBowlerStats(ballRecords: BallRecord[], bowlerId: string) {
    let ballsBowled = 0;
    let runsConceded = 0;
    let wickets = 0;
    for (const ball of ballRecords) {
      if (ball.bowlerId === bowlerId) {
        if (ball.extras !== 'wide' && ball.extras !== 'no-ball') ballsBowled++;
        runsConceded += ball.runs + (ball.extras === 'wide' || ball.extras === 'no-ball' ? ball.extraRuns : 0);
        if (ball.isWicket && ball.wicketType !== 'run-out') wickets++;
      }
    }
    return { ballsBowled, runsConceded, wickets };
  }
}

export default LiveScoreService;
