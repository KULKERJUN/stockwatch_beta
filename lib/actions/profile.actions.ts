'use server';

import { connectToDatabase } from '@/database/mongoose';
import UserProfile from '@/database/models/UserProfile';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

export const getUserProfile = async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        
        if (!session?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        await connectToDatabase();
        
        let profile = await UserProfile.findOne({ userId: session.user.id });

        // If profile doesn't exist, create one with basic info
        if (!profile) {
            profile = await UserProfile.create({
                userId: session.user.id,
                name: session.user.name || '',
                email: session.user.email || '',
            });
        }

        return { success: true, data: profile };
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

        // If email is being updated, also update it in better-auth
        if (data.email && data.email !== session.user.email) {
            try {
                // Better-auth uses updateUser method
                const updateResult = await auth.api.updateUser({
                    headers: await headers(),
                    body: {
                        email: data.email,
                    },
                });
                if (!updateResult) {
                    throw new Error('Failed to update email');
                }
            } catch (error: any) {
                console.error('Error updating email in auth:', error);
                return { success: false, error: error?.message || 'Failed to update email. It may already be in use.' };
            }
        }

        // If name is being updated, also update it in better-auth
        if (data.name && data.name !== session.user.name) {
            try {
                await auth.api.updateUser({
                    headers: await headers(),
                    body: {
                        name: data.name,
                    },
                });
            } catch (error) {
                console.error('Error updating name in auth:', error);
                // Don't fail the whole update if name update fails
            }
        }

        const profile = await UserProfile.findOneAndUpdate(
            { userId: session.user.id },
            updateData,
            { new: true, upsert: true }
        );

        return { success: true, data: profile };
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
        );

        return { success: true, data: updatedProfile };
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
        );

        return { success: true, data: profile };
    } catch (error) {
        console.error('Error creating user profile:', error);
        return { success: false, error: 'Failed to create user profile' };
    }
};

