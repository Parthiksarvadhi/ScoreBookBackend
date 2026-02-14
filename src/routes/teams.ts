import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import db from '../models/index.js';

const router = express.Router();

// Middleware to ensure authentication
router.use(authenticateToken);

/**
 * GET /teams/my-teams
 * Get all teams where the authenticated user is a player
 */
router.get(
    '/my-teams',
    asyncHandler(async (req: any, res: any) => {
        const userId = req.user.userId;

        // Find all players where userId matches
        const players = await db.Player.findAll({
            where: { userId },
            include: [
                {
                    model: db.Team,
                    as: 'team',
                    include: [
                        {
                            model: db.User,
                            as: 'creator',
                            attributes: ['firstName', 'lastName']
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Transform data to include team info and stats
        const teams = await Promise.all(players.map(async (player: any) => {
            const team = player.team;

            // Count matches for this team
            const matchCount = await db.Match.count({
                where: {
                    [db.Sequelize.Op.or]: [
                        { teamAId: team.id },
                        { teamBId: team.id }
                    ],
                    status: 'completed'
                }
            });

            // Get last match date
            const lastMatch = await db.Match.findOne({
                where: {
                    [db.Sequelize.Op.or]: [
                        { teamAId: team.id },
                        { teamBId: team.id }
                    ],
                    status: 'completed'
                },
                order: [['createdAt', 'DESC']]
            });

            return {
                id: team.id,
                name: team.name,
                shortName: team.shortName,
                logo: team.logo,
                primaryColor: team.primaryColor,
                role: player.role,
                jerseyNumber: player.jerseyNumber,
                joinedAt: player.createdAt,
                matchesPlayed: matchCount,
                lastMatchDate: lastMatch?.createdAt || null,
                creator: team.creator ? {
                    name: `${team.creator.firstName} ${team.creator.lastName}`
                } : null
            };
        }));

        res.json({ teams });
    })
);

/**
 * GET /teams/:teamId/my-matches
 * Get all matches for a specific team where the user participated
 */
router.get(
    '/:teamId/my-matches',
    asyncHandler(async (req: any, res: any) => {
        const { teamId } = req.params;
        const userId = req.user.userId;

        // Verify user is part of this team
        const player = await db.Player.findOne({
            where: { teamId, userId }
        });

        if (!player) {
            return res.status(403).json({ error: 'You are not a member of this team' });
        }

        // Get all matches for this team
        const matches = await db.Match.findAll({
            where: {
                [db.Sequelize.Op.or]: [
                    { teamAId: teamId },
                    { teamBId: teamId }
                ],
                status: 'completed'
            },
            include: [
                {
                    model: db.Team,
                    as: 'teamA',
                    attributes: ['id', 'name', 'shortName', 'logo']
                },
                {
                    model: db.Team,
                    as: 'teamB',
                    attributes: ['id', 'name', 'shortName', 'logo']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Transform matches to include opponent and user stats
        const matchHistory = matches.map((match: any) => {
            const isTeamA = match.teamAId === teamId;
            const opponent = isTeamA ? match.teamB : match.teamA;
            const myScore = isTeamA ? match.teamAScore : match.teamBScore;
            const opponentScore = isTeamA ? match.teamBScore : match.teamAScore;
            const myWickets = isTeamA ? match.teamAWickets : match.teamBWickets;
            const opponentWickets = isTeamA ? match.teamBWickets : match.teamAWickets;

            // Determine result
            let result = 'draw';
            if (match.winner === teamId) result = 'won';
            else if (match.winner && match.winner !== teamId) result = 'lost';

            return {
                id: match.id,
                opponent: {
                    name: opponent.name,
                    shortName: opponent.shortName,
                    logo: opponent.logo
                },
                date: match.createdAt,
                result,
                myScore: `${myScore}/${myWickets}`,
                opponentScore: `${opponentScore}/${opponentWickets}`,
                venue: match.venue || 'Unknown',
                // TODO: Add individual player stats when match_players table is available
                myStats: {
                    runs: 0,
                    wickets: 0,
                    catches: 0
                }
            };
        });

        res.json({ matches: matchHistory });
    })
);

export default router;
