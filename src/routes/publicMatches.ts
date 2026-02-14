import express, { Request, Response } from 'express';
import MatchService from '../services/MatchService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import db from '../models/index.js';

const router = express.Router();

/**
 * GET /public/matches
 * List matches for public access (Widgets, etc.)
 * Primarily fetches live/in_progress matches, but can return others.
 */
router.get(
    '/',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
        // For the widget, we primarily want live matches.
        // However, the widget logic iterates through the list to find 'in_progress'.
        // We can just return all matches or filter by status 'in_progress' to optimize.
        // Let's return in_progress matches first.

        // Using existing MatchService or direct DB query if needed.
        // MatchService.listMatches returns { data, meta } usually? 
        // Let's check matches.ts: res.json(result). 
        // If result is paginated, it might be { data: [...], meta: ... }
        // But the widget expects JSONArray directly: val matches = JSONArray(response)
        // Wait, if existing GET /matches returns { data: [] }, the widget code will crash!
        // Widget code: val matches = JSONArray(response) -> This expects [ ... ]

        // Let's check matches.ts line 408: res.json(result).
        // And MatchService.listMatches return type.

        // Safe bet: Return an array directly for the widget endpoint to match current widget assumption OR fix widget assumption.
        // Widget code assumes: val matches = JSONArray(response)

        const matches = await db.Match.findAll({
            where: {
                status: 'live'
            },
            include: [
                { model: db.Team, as: 'teamA', attributes: ['name', 'shortName'] },
                { model: db.Team, as: 'teamB', attributes: ['name', 'shortName'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        res.json(matches);
    })
);

export default router;
