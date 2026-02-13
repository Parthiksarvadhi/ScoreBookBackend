/**
 * Invitation Service
 * Manages team invitations
 */

import db from '../models/index.js';
import { NotificationService } from './NotificationService.js';
import { v4 as uuidv4 } from 'uuid';

export class InvitationService {
    /**
     * Create an invitation
     */
    static async createInvitation(teamId: string, inviterId: string, mobileNumber: string) {
        // Check if user already exists
        const existingUser = await db.User.findOne({ where: { phoneNumber: mobileNumber } });

        // Check if invitation already exists
        const existingInvite = await db.TeamInvitation.findOne({
            where: {
                teamId,
                mobileNumber,
                status: 'pending'
            }
        });

        if (existingInvite) {
            throw new Error('Invitation already sent to this number');
        }

        // Create invitation
        const token = uuidv4();
        const invitation = await db.TeamInvitation.create({
            teamId,
            inviterId,
            mobileNumber,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            status: 'pending'
        });

        const team = await db.Team.findByPk(teamId);
        const teamName = team?.name || 'a team';

        if (existingUser) {
            // User exists - Send Push Notification
            if (existingUser.fcmToken) {
                await NotificationService.sendPushNotification(
                    existingUser.fcmToken,
                    'Team Invitation',
                    `You have been invited to join ${teamName}`,
                    { type: 'TEAM_INVITE', invitationId: invitation.id, teamId }
                );
            }
            console.log(`[INVITE] User exists (${existingUser.id}). Sent Push.`);
            return { invitation, isNewUser: false };
        } else {
            // User does not exist - Return link for SMS
            // Deep link: scorebook://invite/<token>
            const link = `scorebook://invite/${token}`;
            // We still log it, but we return the info so frontend can open SMS app
            console.log(`[INVITE] User new. Returning link for SMS: ${link}`);
            return { invitation, isNewUser: true, inviteLink: link, teamName };
        }
    }

    /**
     * Get invitation by token (public/deep link resolution)
     */
    static async getInvitationByToken(token: string) {
        const invitation = await db.TeamInvitation.findOne({
            where: { token, status: 'pending' },
            include: [
                { model: db.Team, as: 'team', attributes: ['id', 'name', 'shortName'] },
                { model: db.User, as: 'inviter', attributes: ['firstName', 'lastName'] }
            ]
        });

        if (!invitation) return null;
        return invitation;
    }

    /**
     * Get pending invitations for a user (by phone number)
     */
    static async getPendingInvitations(userId: string) {
        const user = await db.User.findByPk(userId);
        if (!user?.phoneNumber) return [];

        return db.TeamInvitation.findAll({
            where: {
                mobileNumber: user.phoneNumber,
                status: 'pending'
            },
            include: [
                { model: db.Team, as: 'team' },
                { model: db.User, as: 'inviter', attributes: ['firstName', 'lastName'] }
            ]
        });
    }

    /**
     * Accept an invitation
     */
    static async acceptInvitation(userId: string, invitationId: string) {
        const invitation = await db.TeamInvitation.findByPk(invitationId);
        if (!invitation || invitation.status !== 'pending') {
            throw new Error('Invalid or expired invitation');
        }

        const user = await db.User.findByPk(userId);
        if (!user || user.phoneNumber !== invitation.mobileNumber) {
            throw new Error('Invitation does not belong to this user');
        }

        // Transaction to update invite and add player
        const t = await db.sequelize.transaction();
        try {
            // Update invitation status
            await invitation.update({ status: 'accepted' }, { transaction: t });

            // Add user as player to the team
            // Check if player already exists in team (by name or user link)
            // If name matches, link it? Or just create new?
            // Logic: Create new player entry linked to user.
            await db.Player.create({
                teamId: invitation.teamId,
                userId: userId,
                name: `${user.firstName} ${user.lastName}`,
                role: 'all-rounder', // Default
                jerseyNumber: 0
            }, { transaction: t });

            await t.commit();

            // Notify inviter
            const inviter = await db.User.findByPk(invitation.inviterId);
            if (inviter?.fcmToken) {
                await NotificationService.sendPushNotification(
                    inviter.fcmToken,
                    'Invitation Accepted',
                    `${user.firstName} accepted your invitation to join the team.`,
                    { type: 'INVITE_ACCEPTED', teamId: invitation.teamId }
                );
            }

            return { success: true };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Reject an invitation
     */
    static async rejectInvitation(userId: string, invitationId: string) {
        const invitation = await db.TeamInvitation.findByPk(invitationId);
        if (!invitation || invitation.status !== 'pending') {
            throw new Error('Invalid or expired invitation');
        }

        const user = await db.User.findByPk(userId);
        if (user?.phoneNumber !== invitation.mobileNumber) {
            throw new Error('Unauthorized');
        }

        await invitation.update({ status: 'rejected' });
        return { success: true };
    }
}
