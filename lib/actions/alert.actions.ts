'use server';

import { connectToDatabase } from '@/database/mongoose';
import PriceAlert from '@/database/models/PriceAlert';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export const createPriceAlert = async (data: {
    symbol: string;
    targetPrice: number;
    condition: 'ABOVE' | 'BELOW';
}) => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        await connectToDatabase();

        const newAlert = await PriceAlert.create({
            userId: session.user.id,
            symbol: data.symbol.toUpperCase(),
            targetPrice: data.targetPrice,
            condition: data.condition,
            status: 'ACTIVE',
        });

        // Immediately check if this alert should be triggered
        // This provides instant feedback if the price already meets the condition
        try {
            const { getMultipleStockPrices } = await import('@/lib/actions/stock.actions');
            const { createNotification } = await import('@/lib/actions/notification.actions');
            const { sendPriceAlertEmail } = await import('@/lib/nodemailer');
            const UserProfile = (await import('@/database/models/UserProfile')).default;

            const prices = await getMultipleStockPrices([newAlert.symbol]);
            const currentPrice = prices[newAlert.symbol];

            if (currentPrice) {
                const isTriggered =
                    (newAlert.condition === 'ABOVE' && currentPrice >= newAlert.targetPrice) ||
                    (newAlert.condition === 'BELOW' && currentPrice <= newAlert.targetPrice);

                if (isTriggered) {
                    console.log(`Alert triggered immediately for ${newAlert.symbol}: Current Price ${currentPrice}, Target ${newAlert.targetPrice}`);

                    // Mark as triggered
                    await PriceAlert.findByIdAndUpdate(newAlert._id, {
                        status: 'TRIGGERED',
                        triggeredAt: new Date(),
                    });

                    // Create notification
                    const isUpper = newAlert.condition === 'ABOVE';
                    const title = `Price Alert: ${newAlert.symbol} ${isUpper ? 'Above' : 'Below'} Target`;

                    const alertMetadata = JSON.stringify({
                        symbol: newAlert.symbol,
                        currentPrice,
                        targetPrice: newAlert.targetPrice,
                        condition: newAlert.condition,
                    });

                    const content = `
                        <div style="padding: 16px;" data-alert-metadata='${alertMetadata}'>
                            <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #FDD458;">
                                ${newAlert.symbol} Price Alert Triggered
                            </h3>
                            <p style="margin: 0 0 8px 0; font-size: 14px; color: #CCDADC;">
                                <strong>Current Price:</strong> $${currentPrice.toFixed(2)}
                            </p>
                            <p style="margin: 0 0 8px 0; font-size: 14px; color: #CCDADC;">
                                <strong>Target Price:</strong> $${newAlert.targetPrice.toFixed(2)}
                            </p>
                            <p style="margin: 0; font-size: 14px; color: #CCDADC;">
                                <strong>Condition:</strong> Price ${isUpper ? 'exceeded' : 'dropped below'} your ${isUpper ? 'upper' : 'lower'} threshold
                            </p>
                        </div>
                    `;

                    const notificationResult = await createNotification({
                        userId: newAlert.userId,
                        type: 'PRICE_ALERT',
                        title,
                        content,
                    });

                    // Send email immediately if preferences allow
                    if (notificationResult.success && notificationResult.data?.shouldSendEmail) {
                        const profile = await UserProfile.findOne({ userId: newAlert.userId }).lean();
                        if (profile?.email) {
                            await sendPriceAlertEmail({
                                email: profile.email,
                                symbol: newAlert.symbol,
                                company: newAlert.symbol,
                                currentPrice,
                                targetPrice: newAlert.targetPrice,
                                condition: newAlert.condition,
                            });
                        }
                    }

                    // Update the alert status in the response
                    newAlert.status = 'TRIGGERED';
                    newAlert.triggeredAt = new Date();
                }
            }
        } catch (error) {
            // Don't fail alert creation if immediate check fails
            console.error('Error checking alert immediately after creation:', error);
        }

        revalidatePath('/alerts');
        return { success: true, data: JSON.parse(JSON.stringify(newAlert)) };
    } catch (error) {
        console.error('Error creating price alert:', error);
        return { success: false, error: 'Failed to create price alert' };
    }
};

export const getUserPriceAlerts = async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        await connectToDatabase();

        const alerts = await PriceAlert.find({ userId: session.user.id })
            .sort({ createdAt: -1 })
            .lean();

        return { success: true, data: JSON.parse(JSON.stringify(alerts)) };
    } catch (error) {
        console.error('Error getting user price alerts:', error);
        return { success: false, error: 'Failed to get price alerts' };
    }
};

export const deletePriceAlert = async (alertId: string) => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        await connectToDatabase();

        const result = await PriceAlert.findOneAndDelete({
            _id: alertId,
            userId: session.user.id,
        });

        if (!result) {
            return { success: false, error: 'Alert not found or unauthorized' };
        }

        revalidatePath('/alerts');
        return { success: true };
    } catch (error) {
        console.error('Error deleting price alert:', error);
        return { success: false, error: 'Failed to delete price alert' };
    }
};

export const togglePriceAlertStatus = async (alertId: string, status: 'ACTIVE' | 'DISABLED') => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        await connectToDatabase();

        const alert = await PriceAlert.findOneAndUpdate(
            { _id: alertId, userId: session.user.id },
            { status },
            { new: true }
        ).lean();

        if (!alert) {
            return { success: false, error: 'Alert not found or unauthorized' };
        }

        revalidatePath('/alerts');
        return { success: true, data: JSON.parse(JSON.stringify(alert)) };
    } catch (error) {
        console.error('Error toggling price alert status:', error);
        return { success: false, error: 'Failed to update price alert status' };
    }
};

export const getTriggeredAlerts = async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        await connectToDatabase();

        const alerts = await PriceAlert.find({
            userId: session.user.id,
            status: 'TRIGGERED',
        })
            .sort({ triggeredAt: -1 })
            .lean();

        return { success: true, data: JSON.parse(JSON.stringify(alerts)) };
    } catch (error) {
        console.error('Error getting triggered alerts:', error);
        return { success: false, error: 'Failed to get triggered alerts' };
    }
};

// DEPRECATED: This function is no longer used as price alerts are now handled
// through the notifications system. Price alerts are delivered via the notification
// center and respect user preferences (email/in-app/quiet hours).
// Keeping this function for backward compatibility but it will return empty results.
export const getUnnotifiedAlerts = async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Price alerts are now handled through the notifications system
        // Users should check the notification center at /notifications
        return { success: true, data: [] };
    } catch (error) {
        console.error('Error getting unnotified alerts:', error);
        return { success: false, error: 'Failed to get unnotified alerts' };
    }
};

/**
 * Manually check price alerts for the current user
 * This allows immediate checking without waiting for the cron job
 */
export const checkPriceAlertsManually = async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        await connectToDatabase();

        // Get all active alerts for the user
        const alerts = await PriceAlert.find({
            userId: session.user.id,
            status: 'ACTIVE',
        }).lean();

        if (alerts.length === 0) {
            return { success: true, message: 'No active alerts to check', triggeredCount: 0 };
        }

        // Import the price checking logic
        const { getMultipleStockPrices } = await import('@/lib/actions/stock.actions');
        const { createNotification } = await import('@/lib/actions/notification.actions');
        const { sendPriceAlertEmail } = await import('@/lib/nodemailer');
        const UserProfile = (await import('@/database/models/UserProfile')).default;

        const symbols = [...new Set(alerts.map((a: any) => a.symbol))];
        const prices = await getMultipleStockPrices(symbols);

        const results = [];
        let triggeredCount = 0;

        for (const alert of alerts) {
            const currentPrice = prices[alert.symbol];
            if (!currentPrice) continue;

            const isTriggered =
                (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) ||
                (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice);

            if (isTriggered) {
                console.log(`Alert triggered for ${alert.symbol}: Current Price ${currentPrice}, Target ${alert.targetPrice} (${alert.condition})`);

                // Mark as triggered first to avoid double processing
                await PriceAlert.findByIdAndUpdate(alert._id, {
                    status: 'TRIGGERED',
                    triggeredAt: new Date(),
                });

                // Create notification through the notifications system
                const isUpper = alert.condition === 'ABOVE';
                const title = `Price Alert: ${alert.symbol} ${isUpper ? 'Above' : 'Below'} Target`;

                const alertMetadata = JSON.stringify({
                    symbol: alert.symbol,
                    currentPrice,
                    targetPrice: alert.targetPrice,
                    condition: alert.condition,
                });

                const content = `
                    <div style="padding: 16px;" data-alert-metadata='${alertMetadata}'>
                        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #FDD458;">
                            ${alert.symbol} Price Alert Triggered
                        </h3>
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #CCDADC;">
                            <strong>Current Price:</strong> $${currentPrice.toFixed(2)}
                        </p>
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #CCDADC;">
                            <strong>Target Price:</strong> $${alert.targetPrice.toFixed(2)}
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #CCDADC;">
                            <strong>Condition:</strong> Price ${isUpper ? 'exceeded' : 'dropped below'} your ${isUpper ? 'upper' : 'lower'} threshold
                        </p>
                    </div>
                `;

                const notificationResult = await createNotification({
                    userId: alert.userId,
                    type: 'PRICE_ALERT',
                    title,
                    content,
                });

                // Send email immediately if preferences allow (not in quiet hours)
                if (notificationResult.success && notificationResult.data?.shouldSendEmail) {
                    const profile = await UserProfile.findOne({ userId: alert.userId }).lean();
                    if (profile?.email) {
                        await sendPriceAlertEmail({
                            email: profile.email,
                            symbol: alert.symbol,
                            company: alert.symbol,
                            currentPrice,
                            targetPrice: alert.targetPrice,
                            condition: alert.condition,
                        });
                        console.log(`✉️  Price alert email sent to ${profile.email}`);
                    }
                }

                results.push({
                    alertId: alert._id.toString(),
                    symbol: alert.symbol,
                    triggered: true,
                    currentPrice,
                    targetPrice: alert.targetPrice,
                });
                triggeredCount++;
            }
        }

        revalidatePath('/alerts');
        return {
            success: true,
            message: `Checked ${alerts.length} alerts`,
            triggeredCount,
            results,
        };
    } catch (error) {
        console.error('Error manually checking price alerts:', error);
        return { success: false, error: 'Failed to check price alerts' };
    }
};

