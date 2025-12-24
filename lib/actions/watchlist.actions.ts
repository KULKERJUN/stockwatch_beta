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
        await ensureDb();

        // Get the current session to find the user by email
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) return [];

        // Find watchlist items for the authenticated user
        const items = await Watchlist.find({ userId: session.user.id }, { symbol: 1 }).lean();

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

// Get user's watchlist
export const getUserWatchlist = async () => {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session?.user) redirect('/sign-in');

        const watchlist = await Watchlist.find({ userId: session.user.id })
            .sort({ addedAt: -1 })
            .lean();

        return JSON.parse(JSON.stringify(watchlist));
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        throw new Error('Failed to fetch watchlist');
    }
};

// Get user's watchlist with detailed stock data
export const getWatchlistWithData = async () => {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session?.user) redirect('/sign-in');

        const watchlist = await Watchlist.find({ userId: session.user.id })
            .sort({ addedAt: -1 })
            .lean();

        if (watchlist.length === 0) return [];

        // Import getStocksDetails dynamically to avoid circular dependency
        const { getStocksDetails } = await import('./finnhub.actions');

        const stocksWithData = await Promise.all(
            watchlist.map(async (item) => {
                try {
                    const stockData = await getStocksDetails(item.symbol);

                    if (!stockData) {
                        console.warn(`Failed to fetch data for ${item.symbol}`);
                        return item;
                    }

                    return {
                        company: stockData.company,
                        symbol: stockData.symbol,
                        currentPrice: stockData.currentPrice,
                        priceFormatted: stockData.priceFormatted,
                        changeFormatted: stockData.changeFormatted,
                        changePercent: stockData.changePercent,
                        marketCap: stockData.marketCapFormatted,
                        peRatio: stockData.peRatio,
                    };
                } catch (error) {
                    console.error(`Error fetching data for ${item.symbol}:`, error);
                    return item;
                }
            })
        );

        return JSON.parse(JSON.stringify(stocksWithData));
    } catch (error) {
        console.error('Error loading watchlist:', error);
        throw new Error('Failed to fetch watchlist');
    }
};
