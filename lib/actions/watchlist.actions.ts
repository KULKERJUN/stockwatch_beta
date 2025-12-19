'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { auth } from '../better-auth/auth';

/**
 * Helper to ensure DB is connected before any operation
 */
async function ensureDb() {
    await connectToDatabase();
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    if (!email) return [];

    try {
        const mongoose = await ensureDb();
        // Accessing the raw driver for Better Auth compatibility
        const db = (mongoose as any).connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        const user = await db.collection('user').findOne({ email });
        if (!user) return [];

        const userId = user.id || String(user._id || '');
        const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();

        return items.map((i) => String(i.symbol));
    } catch (err) {
        console.error('getWatchlistSymbolsByEmail error:', err);
        return [];
    }
}

export const addToWatchlist = async (symbol: string, company: string) => {
    let shouldRedirect = false;

    try {
        await ensureDb();
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            shouldRedirect = true;
        } else {
            const normalizedSymbol = symbol.toUpperCase();

            const existingItem = await Watchlist.findOne({
                userId: session.user.id,
                symbol: normalizedSymbol,
            });

            if (existingItem) {
                return { success: false, error: 'Stock already in watchlist' };
            }

            await Watchlist.create({
                userId: session.user.id,
                symbol: normalizedSymbol,
                company: company.trim(),
            });

            revalidatePath('/watchlist');
            return { success: true, message: 'Stock added to watchlist' };
        }
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        return { success: false, error: 'Failed to add stock' };
    }

    if (shouldRedirect) redirect('/sign-in');
};

export const removeFromWatchlist = async (symbol: string) => {
    let shouldRedirect = false;

    try {
        await ensureDb();
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            shouldRedirect = true;
        } else {
            await Watchlist.deleteOne({
                userId: session.user.id,
                symbol: symbol.toUpperCase(),
            });

            revalidatePath('/watchlist');
            return { success: true, message: 'Stock removed' };
        }
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        return { success: false, error: 'Failed to remove stock' };
    }

    if (shouldRedirect) redirect('/sign-in');
};