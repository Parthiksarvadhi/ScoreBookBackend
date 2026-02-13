/**
 * Match Setup Service
 * Handles toss, playing 11, captain, and batting order setup
 */

import db from '../models/index.js';

class MatchSetupService {
  /**
   * Record toss result
   */
  static async recordToss(
    matchId: string,
    tossWinnerId: string,
    tossChoice: 'bat' | 'field',
    scorerId: string
  ) {
    const match = await db.Match.findByPk(matchId);

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status !== 'scheduled') {
      throw new Error('Match must be in scheduled status to record toss');
    }

    // Validate toss winner is one of the teams
    if (tossWinnerId !== match.teamAId && tossWinnerId !== match.teamBId) {
      throw new Error('Toss winner must be one of the match teams');
    }

    // Validate toss choice
    if (!['bat', 'field'].includes(tossChoice)) {
      throw new Error('Toss choice must be bat or field');
    }

    // Allow updating toss (removed duplicate check)
    // if (match.tossWinnerId) {
    //   throw new Error('Toss has already been recorded for this match');
    // }

    await match.update({
      tossWinnerId,
      tossChoice,
    });

    return match;
  }

  /**
   * Select playing 11 for a team
   */
  static async selectPlaying11(
    matchId: string,
    teamId: string,
    playerIds: string[],
    scorerId: string
  ) {
    const match = await db.Match.findByPk(matchId);

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status !== 'scheduled') {
      throw new Error('Match must be in scheduled status to select playing 11');
    }

    // Validate team
    if (teamId !== match.teamAId && teamId !== match.teamBId) {
      throw new Error('Team is not part of this match');
    }

    // Validate exactly 11 players
    if (playerIds.length !== 11) {
      throw new Error('Playing 11 must have exactly 11 players');
    }

    // Validate all players belong to the team
    const players = await db.Player.findAll({
      where: { id: playerIds, teamId },
    });

    if (players.length !== 11) {
      throw new Error('All players must belong to the selected team');
    }

    // Prevent duplicate selections
    const fieldName = teamId === match.teamAId ? 'teamAPlaying11' : 'teamBPlaying11';
    if ((match as any)[fieldName]) {
      throw new Error('Playing 11 has already been selected for this team');
    }

    const updateData: any = {};
    updateData[fieldName] = playerIds;

    await match.update(updateData);

    return match;
  }

  /**
   * Designate captain for a team
   */
  static async designateCaptain(
    matchId: string,
    teamId: string,
    captainId: string,
    scorerId: string
  ) {
    const match = await db.Match.findByPk(matchId);

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status !== 'scheduled') {
      throw new Error('Match must be in scheduled status to designate captain');
    }

    // Validate team
    if (teamId !== match.teamAId && teamId !== match.teamBId) {
      throw new Error('Team is not part of this match');
    }

    // Get playing 11 for the team
    const fieldName = teamId === match.teamAId ? 'teamAPlaying11' : 'teamBPlaying11';
    const playing11 = (match as any)[fieldName];

    if (!playing11) {
      throw new Error('Playing 11 must be selected before designating captain');
    }

    // Validate captain is in playing 11
    if (!playing11.includes(captainId)) {
      throw new Error('Captain must be in the playing 11');
    }

    // Validate captain belongs to the team
    const captain = await db.Player.findOne({
      where: { id: captainId, teamId },
    });

    if (!captain) {
      throw new Error('Captain must belong to the selected team');
    }

    const captainFieldName = teamId === match.teamAId ? 'teamACaptainId' : 'teamBCaptainId';
    const updateData: any = {};
    updateData[captainFieldName] = captainId;

    await match.update(updateData);

    return match;
  }

  /**
   * Set batting order for a team
   */
  static async setBattingOrder(
    matchId: string,
    teamId: string,
    playerIds: string[],
    scorerId: string
  ) {
    const match = await db.Match.findByPk(matchId);

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status !== 'scheduled') {
      throw new Error('Match must be in scheduled status to set batting order');
    }

    // Validate team
    if (teamId !== match.teamAId && teamId !== match.teamBId) {
      throw new Error('Team is not part of this match');
    }

    // Get playing 11 for the team
    const fieldName = teamId === match.teamAId ? 'teamAPlaying11' : 'teamBPlaying11';
    const playing11 = (match as any)[fieldName];

    if (!playing11) {
      throw new Error('Playing 11 must be selected before setting batting order');
    }

    // Validate all players in order are in playing 11
    for (const playerId of playerIds) {
      if (!playing11.includes(playerId)) {
        throw new Error('All players in batting order must be in playing 11');
      }
    }

    // Validate no duplicates in batting order
    if (new Set(playerIds).size !== playerIds.length) {
      throw new Error('Batting order cannot have duplicate players');
    }

    const battingOrderFieldName =
      teamId === match.teamAId ? 'teamABattingOrder' : 'teamBBattingOrder';
    const updateData: any = {};
    updateData[battingOrderFieldName] = playerIds;

    await match.update(updateData);

    return match;
  }

  /**
   * Get all setup information for a match
   */
  static async getMatchSetup(matchId: string) {
    const match = await db.Match.findByPk(matchId, {
      include: [
        { model: db.Team, as: 'teamA', attributes: ['id', 'name', 'logo', 'primaryColor'] },
        { model: db.Team, as: 'teamB', attributes: ['id', 'name', 'logo', 'primaryColor'] },
        { model: db.Team, as: 'tossWinner', attributes: ['id', 'name', 'logo', 'primaryColor'] },
      ],
    });

    if (!match) {
      throw new Error('Match not found');
    }

    return {
      id: match.id,
      toss: match.tossWinnerId
        ? {
          winnerId: match.tossWinnerId,
          choice: match.tossChoice,
        }
        : null,
      teamA: {
        id: match.teamAId,
        name: (match as any).teamA?.name,
        playing11: (match as any).teamAPlaying11,
        captainId: (match as any).teamACaptainId,
        battingOrder: (match as any).teamABattingOrder,
      },
      teamB: {
        id: match.teamBId,
        name: (match as any).teamB?.name,
        playing11: (match as any).teamBPlaying11,
        captainId: (match as any).teamBCaptainId,
        battingOrder: (match as any).teamBBattingOrder,
      },
    };
  }
}

export default MatchSetupService;
