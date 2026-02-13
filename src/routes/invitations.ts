import express from 'express';
import { InvitationService } from '../services/InvitationService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// Middleware to ensure authentication
router.use(authenticateToken);

/**
 * POST /invitations/teams/:teamId/invite
 * Invite a player by phone number
 */
router.post(
    '/teams/:teamId/invite',
    asyncHandler(async (req: any, res: any) => {
        const { teamId } = req.params;
        const { mobileNumber } = req.body;
        const inviterId = req.user.userId;

        if (!mobileNumber) {
            return res.status(400).json({ error: 'Mobile number is required' });
        }

        const invitation = await InvitationService.createInvitation(teamId, inviterId, mobileNumber);

        res.status(201).json({
            message: 'Invitation sent successfully',
            data: invitation
        });
    })
);

/**
 * GET /invitations/pending
 * Get pending invitations for the current user
 */
router.get(
    '/pending',
    asyncHandler(async (req: any, res: any) => {
        const userId = req.user.userId;
        const invitations = await InvitationService.getPendingInvitations(userId);

        res.json({
            data: invitations
        });
    })
);

/**
 * GET /invitations/token/:token
 * Get invitation details by token (Public endpoint, but we can keep it auth'd if user needs to be logged in to invoke it. 
 * Actually, usually deep link resolution might happen before login, BUT we decided user should register first. 
 * However, to show "You are invited to X", we might want this public? 
 * For now, let's keep it authenticated as our plan assumes user logs in/registers first.)
 */
router.get(
    '/token/:token',
    asyncHandler(async (req: any, res: any) => {
        const { token } = req.params;
        const invitation = await InvitationService.getInvitationByToken(token);

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found or expired' });
        }

        res.json({
            data: invitation
        });
    })
);

/**
 * POST /invitations/:id/accept
 * Accept an invitation
 */
router.post(
    '/:id/accept',
    asyncHandler(async (req: any, res: any) => {
        const { id } = req.params;
        const userId = req.user.userId;

        await InvitationService.acceptInvitation(userId, id);

        res.json({
            message: 'Invitation accepted successfully'
        });
    })
);

/**
 * POST /invitations/:id/reject
 * Reject an invitation
 */
router.post(
    '/:id/reject',
    asyncHandler(async (req: any, res: any) => {
        const { id } = req.params;
        const userId = req.user.userId;

        await InvitationService.rejectInvitation(userId, id);

        res.json({
            message: 'Invitation rejected successfully'
        });
    })
);

export default router;
