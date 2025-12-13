import mongoose, { Schema, models, model } from 'mongoose';

export interface IUserProfile {
    userId: string;
    name: string;
    email: string;
    bio?: string;
    country?: string;
    investmentGoals?: string;
    riskTolerance?: string;
    preferredIndustry?: string;
    // Account settings
    settings?: {
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
            refreshInterval?: number; // in seconds
            showAdvancedMetrics?: boolean;
            defaultTimeframe?: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
        };
    };
    createdAt?: Date;
    updatedAt?: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        bio: {
            type: String,
            default: '',
        },
        country: {
            type: String,
        },
        investmentGoals: {
            type: String,
        },
        riskTolerance: {
            type: String,
        },
        preferredIndustry: {
            type: String,
        },
        settings: {
            type: {
                notifications: {
                    priceAlerts: { type: Boolean, default: true },
                    marketNews: { type: Boolean, default: true },
                    portfolioUpdates: { type: Boolean, default: true },
                },
                display: {
                    defaultView: { type: String, enum: ['dashboard', 'watchlist', 'portfolio'], default: 'dashboard' },
                    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
                    currency: { type: String, default: 'USD' },
                },
                stockTracking: {
                    autoRefresh: { type: Boolean, default: true },
                    refreshInterval: { type: Number, default: 30 }, // seconds
                    showAdvancedMetrics: { type: Boolean, default: false },
                    defaultTimeframe: { type: String, enum: ['1D', '1W', '1M', '3M', '1Y', 'ALL'], default: '1M' },
                },
            },
            default: {
                notifications: {
                    priceAlerts: true,
                    marketNews: true,
                    portfolioUpdates: true,
                },
                display: {
                    defaultView: 'dashboard',
                    theme: 'dark',
                    currency: 'USD',
                },
                stockTracking: {
                    autoRefresh: true,
                    refreshInterval: 30,
                    showAdvancedMetrics: false,
                    defaultTimeframe: '1M',
                },
            },
        },
    },
    {
        timestamps: true,
    }
);

const UserProfile = models.UserProfile || model<IUserProfile>('UserProfile', UserProfileSchema);

export default UserProfile;

