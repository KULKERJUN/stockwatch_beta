'use server';

import { connectToDatabase } from '@/database/mongoose';
import UserProfile from '@/database/models/UserProfile';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export const getUserProfile = async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        await connectToDatabase();

        let profile = await UserProfile.findOne({ userId: session.user.id }).lean();

        // If profile doesn't exist, create one with basic info
        if (!profile) {
            const newProfile = await UserProfile.create({
                userId: session.user.id,
                name: session.user.name || '',
                email: session.user.email || '',
            });
            profile = await UserProfile.findById(newProfile._id).lean();
        }

        return { success: true, data: JSON.parse(JSON.stringify(profile)) };
    } catch (error) {
        console.error('Error getting user profile:', error);
        return { success: false, error: 'Failed to get user profile' };
    }
};

export const updateUserProfile = async (data: {
    bio?: string;
    name?: string;
    email?: string;
}) => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        await connectToDatabase();

        const updateData: { bio?: string; name?: string; email?: string } = {};
        if (data.bio !== undefined) updateData.bio = data.bio;
        if (data.name !== undefined) updateData.name = data.name;
        if (data.email !== undefined) updateData.email = data.email;

        // Note: Email updates in better-auth may require email verification
        // For now, we only update email in UserProfile model
        // If email update in better-auth is needed, it should be handled separately with verification

        // If name is being updated, also update it in better-auth
        if (data.name && data.name !== session.user.name) {
            try {
                const updateResult = await auth.api.updateUser({
                    headers: await headers(),
                    body: {
                        name: data.name,
                    } as any, // Type assertion needed due to better-auth type definitions
                });
                if (!updateResult) {
                    console.warn('Name update in auth returned no result');
                }
            } catch (error) {
                console.error('Error updating name in auth:', error);
                // Don't fail the whole update if name update fails
            }
        }

        const profile = await UserProfile.findOneAndUpdate(
            { userId: session.user.id },
            updateData,
            { new: true, upsert: true }
        ).lean();

        return { success: true, data: JSON.parse(JSON.stringify(profile)) };
    } catch (error) {
        console.error('Error updating user profile:', error);
        return { success: false, error: 'Failed to update user profile' };
    }
};

export const changePassword = async (data: {
    currentPassword: string;
    newPassword: string;
}) => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Verify current password by attempting to sign in
        try {
            await auth.api.signInEmail({
                body: {
                    email: session.user.email || '',
                    password: data.currentPassword,
                },
            });
        } catch (error) {
            return { success: false, error: 'Current password is incorrect' };
        }

        // Update password using better-auth
        try {
            const result = await auth.api.changePassword({
                headers: await headers(),
                body: {
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword,
                },
            });

            if (!result) {
                throw new Error('Password change failed');
            }

            return { success: true };
        } catch (error: any) {
            console.error('Error changing password:', error);
            return { success: false, error: error?.message || 'Failed to change password' };
        }
    } catch (error) {
        console.error('Error changing password:', error);
        return { success: false, error: 'Failed to change password' };
    }
};

export const updateAccountSettings = async (data: {
    notifications?: {
        priceAlerts?: boolean;
        marketNews?: boolean;
        portfolioUpdates?: boolean;
    };
    display?: {
        defaultView?: 'dashboard' | 'watchlist' | 'portfolio';
        theme?: 'dark' | 'light';
        currency?: string;
    };
    stockTracking?: {
        autoRefresh?: boolean;
        refreshInterval?: number;
        showAdvancedMetrics?: boolean;
        defaultTimeframe?: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
    };
}) => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        await connectToDatabase();

        const profile = await UserProfile.findOne({ userId: session.user.id });

        if (!profile) {
            return { success: false, error: 'Profile not found' };
        }

        // Merge settings with existing ones
        const currentSettings = profile.settings || {
            notifications: { priceAlerts: true, marketNews: true, portfolioUpdates: true },
            display: { defaultView: 'dashboard', theme: 'dark', currency: 'USD' },
            stockTracking: { autoRefresh: true, refreshInterval: 30, showAdvancedMetrics: false, defaultTimeframe: '1M' },
        };

        const updatedSettings = {
            notifications: {
                ...currentSettings.notifications,
                ...data.notifications,
            },
            display: {
                ...currentSettings.display,
                ...data.display,
            },
            stockTracking: {
                ...currentSettings.stockTracking,
                ...data.stockTracking,
            },
        };

        const updatedProfile = await UserProfile.findOneAndUpdate(
            { userId: session.user.id },
            { settings: updatedSettings },
            { new: true }
        ).lean();

        return { success: true, data: JSON.parse(JSON.stringify(updatedProfile)) };
    } catch (error) {
        console.error('Error updating account settings:', error);
        return { success: false, error: 'Failed to update account settings' };
    }
};

export const createUserProfile = async (data: {
    userId: string;
    name: string;
    email: string;
    country?: string;
    investmentGoals?: string;
    riskTolerance?: string;
    preferredIndustry?: string;
}) => {
    try {
        await connectToDatabase();

        const profile = await UserProfile.findOneAndUpdate(
            { userId: data.userId },
            {
                userId: data.userId,
                name: data.name,
                email: data.email,
                country: data.country,
                investmentGoals: data.investmentGoals,
                riskTolerance: data.riskTolerance,
                preferredIndustry: data.preferredIndustry,
            },
            { new: true, upsert: true }
        ).lean();

        return { success: true, data: JSON.parse(JSON.stringify(profile)) };
    } catch (error) {
        console.error('Error creating user profile:', error);
        return { success: false, error: 'Failed to create user profile' };
    }
};

export const addToWatchlist = async (symbol: string) => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        await connectToDatabase();

        const normalizedSymbol = symbol.toUpperCase();
        
        // Get or create profile
        let profile = await UserProfile.findOne({ userId: session.user.id });

        if (!profile) {
            // Create profile if it doesn't exist
            profile = await UserProfile.create({
                userId: session.user.id,
                name: session.user.name || '',
                email: session.user.email || '',
                watchlist: [normalizedSymbol],
            });
            const newProfile = await UserProfile.findById(profile._id).lean();
            return { success: true, data: JSON.parse(JSON.stringify(newProfile)) };
        }

        const currentWatchlist = profile.watchlist || [];

        // Check if already in watchlist
        if (currentWatchlist.includes(normalizedSymbol)) {
            return { success: true, data: JSON.parse(JSON.stringify(profile)) };
        }

        // Add to watchlist - create new array to ensure Mongoose detects the change
        const updatedWatchlist = [...currentWatchlist, normalizedSymbol];
        const updatedProfile = await UserProfile.findOneAndUpdate(
            { userId: session.user.id },
            { $set: { watchlist: updatedWatchlist } },
            { new: true, runValidators: true }
        ).lean();

        if (!updatedProfile) {
            return { success: false, error: 'Failed to update profile' };
        }

        // Revalidate relevant paths
        revalidatePath('/profile');
        revalidatePath('/watchlist');
        revalidatePath(`/stocks/${normalizedSymbol.toLowerCase()}`);

        return { success: true, data: JSON.parse(JSON.stringify(updatedProfile)) };
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        return { success: false, error: 'Failed to add to watchlist' };
    }
};

export const removeFromWatchlist = async (symbol: string) => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        await connectToDatabase();

        const profile = await UserProfile.findOne({ userId: session.user.id });

        if (!profile) {
            return { success: false, error: 'Profile not found' };
        }

        const normalizedSymbol = symbol.toUpperCase();
        const currentWatchlist = profile.watchlist || [];
        const updatedWatchlist = currentWatchlist.filter((s: string) => s !== normalizedSymbol);

        const updatedProfile = await UserProfile.findOneAndUpdate(
            { userId: session.user.id },
            { $set: { watchlist: updatedWatchlist } },
            { new: true, runValidators: true }
        ).lean();

        if (!updatedProfile) {
            return { success: false, error: 'Failed to update profile' };
        }

        // Revalidate relevant paths
        revalidatePath('/profile');
        revalidatePath('/watchlist');
        revalidatePath(`/stocks/${normalizedSymbol.toLowerCase()}`);

        return { success: true, data: JSON.parse(JSON.stringify(updatedProfile)) };
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        return { success: false, error: 'Failed to remove from watchlist' };
    }
};

export const getWatchlist = async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        await connectToDatabase();

        const profile = await UserProfile.findOne({ userId: session.user.id }).lean();

        if (!profile) {
            return { success: true, data: [] };
        }

        const watchlist = profile.watchlist || [];
        return { success: true, data: watchlist };
    } catch (error) {
        console.error('Error getting watchlist:', error);
        return { success: false, error: 'Failed to get watchlist' };
    }
};

export const isStockInWatchlist = async (symbol: string) => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return { success: true, data: false };
        }

        await connectToDatabase();

        const profile = await UserProfile.findOne({ userId: session.user.id }).lean();

        if (!profile) {
            return { success: true, data: false };
        }

        const normalizedSymbol = symbol.toUpperCase();
        const watchlist = profile.watchlist || [];
        const isInWatchlist = watchlist.includes(normalizedSymbol);

        return { success: true, data: isInWatchlist };
    } catch (error) {
        console.error('Error checking watchlist:', error);
        return { success: true, data: false };
    }
};

