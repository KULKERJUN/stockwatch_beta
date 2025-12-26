'use server';

import { connectToDatabase } from '@/database/mongoose';
import Notification from '@/database/models/Notification';
import NotificationPreferences from '@/database/models/NotificationPreferences';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { isWithinQuietHours, computeDeliverAfter } from '@/lib/utils';

/**
 * Get current user from session
 */
async function getCurrentUser() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        throw new Error('Unauthorized');
    }
    return session.user;
}

/**
 * Get notification preferences for current user
 */
export async function getNotificationPreferences() {
    try {
        const user = await getCurrentUser();
        await connectToDatabase();

        let preferences = await NotificationPreferences.findOne({ userId: user.id }).lean();

        // Create default preferences if they don't exist
        if (!preferences) {
            preferences = await NotificationPreferences.create({
                userId: user.id,
                emailEnabled: true,
                inAppEnabled: true,
                quietHoursEnabled: false,
                quietStart: '22:00',
                quietEnd: '07:00',
            });
        }

        return {
            success: true,
            data: {
                emailEnabled: preferences.emailEnabled,
                inAppEnabled: preferences.inAppEnabled,
                quietHoursEnabled: preferences.quietHoursEnabled,
                quietStart: preferences.quietStart,
                quietEnd: preferences.quietEnd,
            },
        };
    } catch (error) {
        console.error('Error getting notification preferences:', error);
        return { success: false, error: 'Failed to get notification preferences' };
    }
}

/**
 * Update notification preferences for current user
 */
export async function updateNotificationPreferences(data: {
    emailEnabled?: boolean;
    inAppEnabled?: boolean;
    quietHoursEnabled?: boolean;
    quietStart?: string;
    quietEnd?: string;
}) {
    try {
        const user = await getCurrentUser();
        await connectToDatabase();

        const preferences = await NotificationPreferences.findOneAndUpdate(
            { userId: user.id },
            { $set: data },
            { new: true, upsert: true }
        ).lean();

        return {
            success: true,
            data: {
                emailEnabled: preferences.emailEnabled,
                inAppEnabled: preferences.inAppEnabled,
                quietHoursEnabled: preferences.quietHoursEnabled,
                quietStart: preferences.quietStart,
                quietEnd: preferences.quietEnd,
            },
        };
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        return { success: false, error: 'Failed to update notification preferences' };
    }
}

/**
 * Get notifications for current user
 */
export async function getNotifications(limit = 50) {
    try {
        const user = await getCurrentUser();
        await connectToDatabase();

        console.log('🔍 Fetching notifications for user:', user.id);

        const notifications = await Notification.find({
            userId: user.id,
            status: 'DELIVERED',
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        console.log('📬 Found notifications:', {
            userId: user.id,
            count: notifications.length,
            notifications: notifications.map(n => ({
                id: n._id.toString(),
                type: n.type,
                status: n.status,
                createdAt: n.createdAt,
            })),
        });

        return {
            success: true,
            data: notifications.map((n: any) => ({
                id: n._id.toString(),
                type: n.type,
                title: n.title,
                content: n.content,
                createdAt: n.createdAt,
            })),
        };
    } catch (error) {
        console.error('❌ Error getting notifications:', error);
        return { success: false, error: 'Failed to get notifications' };
    }
}

/**
 * Create a notification for a user
 * Handles quiet hours logic
 */
export async function createNotification(data: {
    userId: string;
    type: 'DAILY_NEWS_SUMMARY' | 'PRICE_ALERT' | 'SYSTEM';
    title: string;
    content: string;
}) {
    try {
        await connectToDatabase();

        // Get user preferences - create defaults if not found
        let preferences = await NotificationPreferences.findOne({ userId: data.userId }).lean();

        if (!preferences) {
            // Create default preferences for new users
            preferences = await NotificationPreferences.create({
                userId: data.userId,
                emailEnabled: true,
                inAppEnabled: true,
                quietHoursEnabled: false,
                quietStart: '22:00',
                quietEnd: '07:00',
            });
        }

        const now = new Date();
        let status: 'PENDING' | 'DELIVERED' = 'DELIVERED';
        let deliverAfter: Date | null = null;

        // Check if quiet hours are enabled and active
        if (
            preferences?.quietHoursEnabled &&
            isWithinQuietHours(now, preferences.quietStart, preferences.quietEnd)
        ) {
            status = 'PENDING';
            deliverAfter = computeDeliverAfter(now, preferences.quietStart, preferences.quietEnd);
        }

        // Always create notification if status is PENDING (for quiet hours)
        // OR if in-app is enabled (default true if no preferences exist)
        const inAppEnabled = preferences?.inAppEnabled !== false; // Default to true
        const shouldCreateNotification = status === 'PENDING' || inAppEnabled;

        if (shouldCreateNotification) {
            const notification = await Notification.create({
                userId: data.userId,
                type: data.type,
                title: data.title,
                content: data.content,
                status,
                deliverAfter,
            });

            console.log('✅ Notification created:', {
                notificationId: notification._id.toString(),
                userId: data.userId,
                type: data.type,
                status,
                inAppEnabled,
                emailEnabled: preferences?.emailEnabled,
            });

            return {
                success: true,
                data: {
                    id: notification._id.toString(),
                    shouldSendEmail:
                        preferences?.emailEnabled !== false && status === 'DELIVERED',
                    isPending: status === 'PENDING',
                },
            };
        }

        console.log('⚠️  Notification NOT created (in-app disabled):', {
            userId: data.userId,
            type: data.type,
            inAppEnabled,
        });

        return {
            success: true,
            data: {
                shouldSendEmail: preferences?.emailEnabled !== false,
                isPending: false,
            },
        };
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        return { success: false, error: 'Failed to create notification' };
    }
}

/**
 * Get user preferences by user ID (for background jobs)
 */
export async function getNotificationPreferencesByUserId(userId: string) {
    try {
        await connectToDatabase();

        const preferences = await NotificationPreferences.findOne({ userId }).lean();

        if (!preferences) {
            // Return defaults if not found
            return {
                success: true,
                data: {
                    emailEnabled: true,
                    inAppEnabled: true,
                    quietHoursEnabled: false,
                    quietStart: '22:00',
                    quietEnd: '07:00',
                },
            };
        }

        return {
            success: true,
            data: {
                emailEnabled: preferences.emailEnabled,
                inAppEnabled: preferences.inAppEnabled,
                quietHoursEnabled: preferences.quietHoursEnabled,
                quietStart: preferences.quietStart,
                quietEnd: preferences.quietEnd,
            },
        };
    } catch (error) {
        console.error('Error getting notification preferences by userId:', error);
        return { success: false, error: 'Failed to get notification preferences' };
    }
}

