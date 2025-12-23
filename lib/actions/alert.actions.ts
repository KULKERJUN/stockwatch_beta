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

export const getUnnotifiedAlerts = async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        await connectToDatabase();

        const alerts = await PriceAlert.find({
            userId: session.user.id,
            status: 'TRIGGERED',
            notified: false,
        }).lean();

        if (alerts.length > 0) {
            // Mark them as notified
            await PriceAlert.updateMany(
                { _id: { $in: alerts.map((a: any) => a._id) } },
                { notified: true }
            );
        }

        return { success: true, data: JSON.parse(JSON.stringify(alerts)) };
    } catch (error) {
        console.error('Error getting unnotified alerts:', error);
        return { success: false, error: 'Failed to get unnotified alerts' };
    }
};

