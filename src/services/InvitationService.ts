/**
 * Invitation Service
 * Manages team invitations
 */

import db from '../models/index.js';
import { NotificationService } from './NotificationService.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto'; // Added for new token generation

export class InvitationService {
    /**
     * Normalize phone number for matching
     * Removes country codes (+91, +1, etc.) and keeps only digits
     */
    private static normalizePhone(phone: string): string {
        // Remove all non-digit characters
        let normalized = phone.replace(/\D/g, '');

        // Remove common country codes from the start
        // India: 91, US: 1, UK: 44, etc.
        const countryCodes = ['91', '1', '44', '61', '86', '81', '49', '33'];
        for (const code of countryCodes) {
            if (normalized.startsWith(code) && normalized.length > code.length + 8) {
                // Only remove if remaining number is long enough to be valid
                normalized = normalized.substring(code.length);
                break;
            }
        }

        return normalized;
    }

    /**
     * Create an invitation
     */
    static async createInvitation(teamId: string, inviterId: string, mobileNumber: string) {
        const team = await db.Team.findByPk(teamId);
        if (!team) throw new Error('Team not found');

        const teamName = team.name;
        const token = crypto.randomBytes(32).toString('hex');

        // Normalize the input phone number for matching
        const normalizedInput = this.normalizePhone(mobileNumber);
        console.log(`[INVITE] Input: ${mobileNumber} → Normalized: ${normalizedInput}`);

        // Find user by matching normalized phone numbers
        const allUsers = await db.User.findAll({
            attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'fcmToken']
        });

        const existingUser = allUsers.find((u: any) => {
            if (!u.phoneNumber) return false;
            const normalizedDb = this.normalizePhone(u.phoneNumber);
            const match = normalizedDb === normalizedInput;
            if (match) {
                console.log(`[INVITE] Match found: DB ${u.phoneNumber} → ${normalizedDb} = Input ${normalizedInput}`);
            }
            return match;
        });

        // Check if invitation already exists for the normalized number
        const existingInvite = await db.TeamInvitation.findOne({
            where: {
                teamId,
                mobileNumber: mobileNumber, // Keep original mobileNumber for the invitation record
                status: 'pending'
            }
        });

        if (existingInvite) {
            throw new Error('Invitation already sent to this number');
        }

        // Create invitation
        const invitation = await db.TeamInvitation.create({
            teamId,
            inviterId,
            mobileNumber,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            status: 'pending'
        });

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
            // Use HTTPS link that redirects to deep link (clickable in SMS)
            // Frontend will handle the redirect to scorebook://invite/<token>
            const link = `http://192.168.2.31:3000/invite/${token}`;
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
        console.log('[INVITE] Getting pending invitations for userId:', userId);
        const user = await db.User.findByPk(userId);
        console.log('[INVITE] User found:', user?.firstName, 'Phone:', user?.phoneNumber);

        if (!user?.phoneNumber) {
            console.log('[INVITE] No phone number for user, returning empty array');
            return [];
        }

        const invitations = await db.TeamInvitation.findAll({
            where: {
                mobileNumber: user.phoneNumber,
                status: 'pending'
            },
            include: [
                { model: db.Team, as: 'team' },
                { model: db.User, as: 'inviter', attributes: ['firstName', 'lastName'] }
            ]
        });

        console.log('[INVITE] Found', invitations.length, 'pending invitations for phone:', user.phoneNumber);
        return invitations;
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

        // Notify inviter
        const inviter = await db.User.findByPk(invitation.inviterId);
        const team = await db.Team.findByPk(invitation.teamId);

        if (inviter?.fcmToken) {
            await NotificationService.sendPushNotification(
                inviter.fcmToken,
                'Invitation Declined',
                `${user.firstName} declined your invitation to join ${team?.name || 'the team'}.`,
                { type: 'INVITATION_REJECTED', teamId: invitation.teamId }
            );
        }

        return { success: true };
    }
}
