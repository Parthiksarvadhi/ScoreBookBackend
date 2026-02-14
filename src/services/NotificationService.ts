/**
 * Notification Service
 * Handles sending Push Notifications (FCM) and SMS (Mock/Twilio)
 */

import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin
try {
    // Check for service account file
    const serviceAccountPath = path.join(process.cwd(), 'scorebook-ef819-firebase-adminsdk-fbsvc-7cb14f0f4a.json');

    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('✅ Firebase Admin initialized successfully');
    } else {
        console.warn('⚠️ Firebase service account file not found at:', serviceAccountPath);
        console.warn('   Push notifications will be mocked.');
    }
} catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
}

export class NotificationService {
    /**
     * Send Push Notification via Firebase Cloud Messaging
     */
    static async sendPushNotification(token: string, title: string, body: string, data: any = {}) {
        console.log(`[PUSH] To: ${token} | Title: ${title} | Body: ${body}`);

        try {
            if (admin.apps.length > 0) {
                await admin.messaging().send({
                    token,
                    notification: { title, body },
                    data: data || {},
                });
                console.log('✅ Push notification sent successfully');
                return true;
            } else {
                console.log('ℹ️ Firebase not initialized, skipping push send (Mock Success)');
                return true;
            }
        } catch (error: any) {
            // Handle invalid/expired tokens gracefully
            if (error.code === 'messaging/registration-token-not-registered' ||
                error.code === 'messaging/invalid-registration-token') {
                console.log(`⚠️ Invalid/expired FCM token. User needs to re-login to get new token.`);
                return false;
            }

            console.error('❌ Error sending push notification:', error);
            // Return false but don't crash the request
            return false;
        }
    }

    /**
     * Send SMS
     * In production, use Twilio, AWS SNS, or local gateway.
     */
    static async sendSMS(phoneNumber: string, message: string) {
        console.log(`[SMS] To: ${phoneNumber} | Message: ${message}`);
        // Mock implementation
        return true;
    }
}
