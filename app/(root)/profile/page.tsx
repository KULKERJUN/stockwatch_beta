'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import SelectField from '@/components/forms/SelectField';
import { getUserProfile, updateUserProfile, changePassword, updateAccountSettings } from '@/lib/actions/profile.actions';
import { getUserWatchlist } from '@/lib/actions/watchlist.actions';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import countryList from 'react-select-country-list';
import { Controller } from 'react-hook-form';
import Link from 'next/link';
import WatchlistButton from '@/components/WatchlistButton';

type ProfileFormData = {
    bio: string;
    name: string;
    email: string;
};

type PasswordFormData = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
};

type SettingsFormData = {
    priceAlerts: boolean;
    marketNews: boolean;
    portfolioUpdates: boolean;
    defaultView: 'dashboard' | 'watchlist' | 'portfolio';
    currency: string;
    autoRefresh: boolean;
    refreshInterval: number;
    showAdvancedMetrics: boolean;
    defaultTimeframe: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
};

type UserProfileData = {
    userId: string;
    name: string;
    email: string;
    bio?: string;
    country?: string;
    investmentGoals?: string;
    riskTolerance?: string;
    preferredIndustry?: string;
    watchlist?: string[];
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
            refreshInterval?: number;
            showAdvancedMetrics?: boolean;
            defaultTimeframe?: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
        };
    };
};

const ProfilePage = () => {
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isEditingSettings, setIsEditingSettings] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [watchlist, setWatchlist] = useState<string[]>([]);
    
    const getCountryName = (countryCode: string | undefined) => {
        if (!countryCode) return '';
        const countries = countryList().getData();
        return countries.find(c => c.value === countryCode)?.label || countryCode;
    };

    const profileForm = useForm<ProfileFormData>({
        mode: 'onBlur',
    });

    const passwordForm = useForm<PasswordFormData>({
        mode: 'onBlur',
    });

    const settingsForm = useForm<SettingsFormData>({
        mode: 'onBlur',
    });

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const result = await getUserProfile();
                if (result.success && result.data) {
                    const profileData = result.data as UserProfileData;
                    setProfile(profileData);
                    profileForm.reset({
                        bio: profileData.bio || '',
                        name: profileData.name || '',
                        email: profileData.email || '',
                    });
                    
                    // Reset settings form
                    const settings = profileData.settings || {
                        notifications: { priceAlerts: true, marketNews: true, portfolioUpdates: true },
                        display: { defaultView: 'dashboard', currency: 'USD' },
                        stockTracking: { autoRefresh: true, refreshInterval: 30, showAdvancedMetrics: false, defaultTimeframe: '1M' },
                    };
                    settingsForm.reset({
                        priceAlerts: settings.notifications?.priceAlerts ?? true,
                        marketNews: settings.notifications?.marketNews ?? true,
                        portfolioUpdates: settings.notifications?.portfolioUpdates ?? true,
                        defaultView: settings.display?.defaultView || 'dashboard',
                        currency: settings.display?.currency || 'USD',
                        autoRefresh: settings.stockTracking?.autoRefresh ?? true,
                        refreshInterval: settings.stockTracking?.refreshInterval || 30,
                        showAdvancedMetrics: settings.stockTracking?.showAdvancedMetrics ?? false,
                        defaultTimeframe: settings.stockTracking?.defaultTimeframe || '1M',
                    });
                } else {
                    toast.error('Failed to load profile', {
                        description: result.error || 'Could not load your profile information.',
                    });
                }
            } catch (error) {
                console.error('Error loading profile:', error);
                toast.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        const loadWatchlist = async () => {
            try {
                const watchlistItems = await getUserWatchlist();
                const symbols = watchlistItems.map((item: { symbol: string }) => item.symbol);
                setWatchlist(symbols);
            } catch (error) {
                console.error('Error loading watchlist:', error);
                setWatchlist([]);
            }
        };

        loadProfile();
        loadWatchlist();
    }, [profileForm, settingsForm]);

    const onProfileSubmit = async (data: ProfileFormData) => {
        setIsSaving(true);
        try {
            const result = await updateUserProfile({
                bio: data.bio,
                name: data.name,
                email: data.email,
            });

            if (result.success && result.data) {
                setProfile(result.data as UserProfileData);
                setIsEditingProfile(false);
                setIsEditingEmail(false);
                toast.success('Profile updated successfully');
            } else {
                toast.error('Failed to update profile', {
                    description: result.error || 'Could not update your profile.',
                });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const onPasswordSubmit = async (data: PasswordFormData) => {
        if (data.newPassword !== data.confirmPassword) {
            passwordForm.setError('confirmPassword', { message: 'Passwords do not match' });
            return;
        }

        if (data.newPassword.length < 8) {
            passwordForm.setError('newPassword', { message: 'Password must be at least 8 characters' });
            return;
        }

        setIsSaving(true);
        try {
            const result = await changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });

            if (result.success) {
                passwordForm.reset();
                setIsChangingPassword(false);
                toast.success('Password changed successfully');
            } else {
                toast.error('Failed to change password', {
                    description: result.error || 'Could not change your password.',
                });
            }
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error('Failed to change password');
        } finally {
            setIsSaving(false);
        }
    };

    const onSettingsSubmit = async (data: SettingsFormData) => {
        setIsSaving(true);
        try {
            const result = await updateAccountSettings({
                notifications: {
                    priceAlerts: data.priceAlerts,
                    marketNews: data.marketNews,
                    portfolioUpdates: data.portfolioUpdates,
                },
                display: {
                    defaultView: data.defaultView,
                    currency: data.currency,
                },
                stockTracking: {
                    autoRefresh: data.autoRefresh,
                    refreshInterval: data.refreshInterval,
                    showAdvancedMetrics: data.showAdvancedMetrics,
                    defaultTimeframe: data.defaultTimeframe,
                },
            });

            if (result.success && result.data) {
                setProfile(result.data as UserProfileData);
                setIsEditingSettings(false);
                toast.success('Settings updated successfully');
            } else {
                toast.error('Failed to update settings', {
                    description: result.error || 'Could not update your settings.',
                });
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error('Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    const refreshWatchlist = async () => {
        try {
            const watchlistItems = await getUserWatchlist();
            const symbols = watchlistItems.map((item: { symbol: string }) => item.symbol);
            setWatchlist(symbols);
        } catch (error) {
            console.error('Error refreshing watchlist:', error);
            setWatchlist([]);
        }
    };

    const handleWatchlistChange = async (symbol: string, isAdded: boolean) => {
        // Always refresh from server to ensure consistency
        await refreshWatchlist();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-gray-400">Profile not found</p>
            </div>
        );
    }

    const defaultViewOptions = [
        { value: 'dashboard', label: 'Dashboard' },
        { value: 'watchlist', label: 'Watchlist' },
        { value: 'portfolio', label: 'Portfolio' },
    ];

    const timeframeOptions = [
        { value: '1D', label: '1 Day' },
        { value: '1W', label: '1 Week' },
        { value: '1M', label: '1 Month' },
        { value: '3M', label: '3 Months' },
        { value: '1Y', label: '1 Year' },
        { value: 'ALL', label: 'All Time' },
    ];

    const currencyOptions = [
        { value: 'USD', label: 'USD ($)' },
        { value: 'EUR', label: 'EUR (€)' },
        { value: 'GBP', label: 'GBP (£)' },
        { value: 'JPY', label: 'JPY (¥)' },
        { value: 'CAD', label: 'CAD (C$)' },
        { value: 'AUD', label: 'AUD (A$)' },
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
            {/* Profile Header */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 md:p-8">
                <div className="flex items-center gap-6 mb-8">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src="https://www.thesprucepets.com/thmb/Sp4CuorEpzsE130_eUqqKaClCuk=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/33351631_260594934684461_1144904437047754752_n-5b17d77604d1cf0037f3ea5a.jpg" />
                        <AvatarFallback className="bg-yellow-500 text-yellow-900 text-2xl font-bold">
                            {profile.name[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-100 mb-2">Profile</h1>
                        <p className="text-gray-400">Manage your account information and settings</p>
                    </div>
                </div>

                {/* Personal Information Section */}
                <div className="border-t border-gray-800 pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-100">Personal Information</h2>
                        {!isEditingProfile && (
                            <Button
                                onClick={() => setIsEditingProfile(true)}
                                variant="outline"
                                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-yellow-500"
                            >
                                Edit
                            </Button>
                        )}
                    </div>

                    {isEditingProfile ? (
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5">
                            <InputField
                                name="name"
                                label="Full Name"
                                placeholder="Enter your full name"
                                register={profileForm.register}
                                error={profileForm.formState.errors.name}
                                validation={{ required: 'Name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } }}
                            />

                            <div className="space-y-2">
                                <label htmlFor="bio" className="form-label">
                                    Bio
                                </label>
                                <textarea
                                    id="bio"
                                    placeholder="Tell us about yourself..."
                                    rows={4}
                                    className="form-input resize-none"
                                    {...profileForm.register('bio', {
                                        maxLength: { value: 500, message: 'Bio must be less than 500 characters' },
                                    })}
                                />
                                {profileForm.formState.errors.bio && <p className="text-sm text-red-500">{profileForm.formState.errors.bio.message}</p>}
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="submit"
                                    disabled={profileForm.formState.isSubmitting || isSaving}
                                    className="yellow-btn"
                                >
                                    {profileForm.formState.isSubmitting || isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditingProfile(false);
                                        profileForm.reset({
                                            bio: profile.bio || '',
                                            name: profile.name || '',
                                            email: profile.email || '',
                                        });
                                    }}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-400">Full Name</label>
                                <p className="text-gray-100 mt-1">{profile.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-400">Bio</label>
                                <p className="text-gray-100 mt-1">{profile.bio || 'No bio added yet'}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Account Information Section */}
                <div className="border-t border-gray-800 pt-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-100">Account Information</h2>
                        {!isEditingEmail && (
                            <Button
                                onClick={() => setIsEditingEmail(true)}
                                variant="outline"
                                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-yellow-500"
                            >
                                Edit Email
                            </Button>
                        )}
                    </div>

                    {isEditingEmail ? (
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5">
                            <InputField
                                name="email"
                                label="Email"
                                placeholder="Enter your email"
                                type="email"
                                register={profileForm.register}
                                error={profileForm.formState.errors.email}
                                validation={{ 
                                    required: 'Email is required', 
                                    pattern: {
                                        value: /^\w+@\w+\.\w+$/,
                                        message: 'Please enter a valid email address'
                                    }
                                }}
                            />

                            <div className="flex gap-3">
                                <Button
                                    type="submit"
                                    disabled={profileForm.formState.isSubmitting || isSaving}
                                    className="yellow-btn"
                                >
                                    {profileForm.formState.isSubmitting || isSaving ? 'Saving...' : 'Save Email'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditingEmail(false);
                                        profileForm.reset({
                                            ...profileForm.getValues(),
                                            email: profile.email || '',
                                        });
                                    }}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-400">Email</label>
                                <p className="text-gray-100 mt-1">{profile.email}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-400">User ID</label>
                                <p className="text-gray-100 mt-1 font-mono text-sm">{profile.userId}</p>
                                <p className="text-xs text-gray-500 mt-1">Your unique identifier</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Password Change Section */}
                <div className="border-t border-gray-800 pt-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-100">Security</h2>
                        {!isChangingPassword && (
                            <Button
                                onClick={() => setIsChangingPassword(true)}
                                variant="outline"
                                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-yellow-500"
                            >
                                Change Password
                            </Button>
                        )}
                    </div>

                    {isChangingPassword ? (
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
                            <InputField
                                name="currentPassword"
                                label="Current Password"
                                placeholder="Enter your current password"
                                type="password"
                                register={passwordForm.register}
                                error={passwordForm.formState.errors.currentPassword}
                                validation={{ required: 'Current password is required' }}
                            />

                            <InputField
                                name="newPassword"
                                label="New Password"
                                placeholder="Enter your new password"
                                type="password"
                                register={passwordForm.register}
                                error={passwordForm.formState.errors.newPassword}
                                validation={{ 
                                    required: 'New password is required',
                                    minLength: { value: 8, message: 'Password must be at least 8 characters' }
                                }}
                            />

                            <InputField
                                name="confirmPassword"
                                label="Confirm New Password"
                                placeholder="Confirm your new password"
                                type="password"
                                register={passwordForm.register}
                                error={passwordForm.formState.errors.confirmPassword}
                                validation={{ required: 'Please confirm your new password' }}
                            />

                            <div className="flex gap-3">
                                <Button
                                    type="submit"
                                    disabled={passwordForm.formState.isSubmitting || isSaving}
                                    className="yellow-btn"
                                >
                                    {passwordForm.formState.isSubmitting || isSaving ? 'Changing...' : 'Change Password'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsChangingPassword(false);
                                        passwordForm.reset();
                                    }}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <p className="text-sm text-gray-400">Keep your account secure by regularly updating your password.</p>
                    )}
                </div>

                {/* Investment Preferences Section */}
                {(profile.country || profile.investmentGoals || profile.riskTolerance || profile.preferredIndustry) && (
                    <div className="border-t border-gray-800 pt-6 mt-6">
                        <h2 className="text-xl font-semibold text-gray-100 mb-4">Investment Preferences</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profile.country && (
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Country</label>
                                    <p className="text-gray-100 mt-1">{getCountryName(profile.country)}</p>
                                </div>
                            )}
                            {profile.investmentGoals && (
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Investment Goals</label>
                                    <p className="text-gray-100 mt-1">{profile.investmentGoals}</p>
                                </div>
                            )}
                            {profile.riskTolerance && (
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Risk Tolerance</label>
                                    <p className="text-gray-100 mt-1">{profile.riskTolerance}</p>
                                </div>
                            )}
                            {profile.preferredIndustry && (
                                <div>
                                    <label className="text-sm font-medium text-gray-400">Preferred Industry</label>
                                    <p className="text-gray-100 mt-1">{profile.preferredIndustry}</p>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-4">These preferences were set during sign-up and cannot be changed here</p>
                    </div>
                )}
            </div>

            {/* Watchlist Section */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-100">Watchlist</h2>
                        <p className="text-gray-400 mt-1">
                            {watchlist.length === 0 
                                ? 'No stocks in your watchlist yet' 
                                : `${watchlist.length} ${watchlist.length === 1 ? 'stock' : 'stocks'} in your watchlist`}
                        </p>
                    </div>
                    {watchlist.length > 0 && (
                        <Link href="/watchlist">
                            <Button
                                variant="outline"
                                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-yellow-500"
                            >
                                View All
                            </Button>
                        </Link>
                    )}
                </div>

                {watchlist.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">Start building your watchlist by adding stocks from the stocks page</p>
                        <Link href="/stocks">
                            <Button className="yellow-btn">
                                Browse Stocks
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {watchlist.slice(0, 5).map((symbol) => (
                            <div
                                key={symbol}
                                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                            >
                                <Link 
                                    href={`/stocks/${symbol.toLowerCase()}`}
                                    className="flex-1 hover:text-yellow-500 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-semibold text-gray-100">{symbol}</span>
                                    </div>
                                </Link>
                                <WatchlistButton
                                    symbol={symbol}
                                    company={symbol}
                                    isInWatchlist={true}
                                    type="icon"
                                    onWatchlistChange={handleWatchlistChange}
                                />
                            </div>
                        ))}
                        {watchlist.length > 5 && (
                            <div className="text-center pt-2">
                                <p className="text-sm text-gray-400">
                                    and {watchlist.length - 5} more {watchlist.length - 5 === 1 ? 'stock' : 'stocks'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Account Settings Section */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-100">Account Settings</h2>
                        <p className="text-gray-400 mt-1">Customize app behavior and stock tracking preferences</p>
                    </div>
                    {!isEditingSettings && (
                        <Button
                            onClick={() => setIsEditingSettings(true)}
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-yellow-500"
                        >
                            Edit Settings
                        </Button>
                    )}
                </div>

                {isEditingSettings ? (
                    <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                        {/* Notifications */}
                        <div className="border-t border-gray-800 pt-6">
                            <h3 className="text-lg font-semibold text-gray-100 mb-4">Notifications</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium text-gray-300">Price Alerts</label>
                                        <p className="text-xs text-gray-500">Get notified when stocks reach your target prices</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        {...settingsForm.register('priceAlerts')}
                                        className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium text-gray-300">Market News</label>
                                        <p className="text-xs text-gray-500">Receive updates about market news and trends</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        {...settingsForm.register('marketNews')}
                                        className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium text-gray-300">Portfolio Updates</label>
                                        <p className="text-xs text-gray-500">Get updates about your portfolio performance</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        {...settingsForm.register('portfolioUpdates')}
                                        className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Display Settings */}
                        <div className="border-t border-gray-800 pt-6">
                            <h3 className="text-lg font-semibold text-gray-100 mb-4">Display Settings</h3>
                            <div className="space-y-4">
                                <SelectField
                                    name="defaultView"
                                    label="Default View"
                                    placeholder="Select default view"
                                    options={defaultViewOptions}
                                    control={settingsForm.control}
                                    error={settingsForm.formState.errors.defaultView}
                                />
                                <SelectField
                                    name="currency"
                                    label="Currency"
                                    placeholder="Select currency"
                                    options={currencyOptions}
                                    control={settingsForm.control}
                                    error={settingsForm.formState.errors.currency}
                                />
                            </div>
                        </div>

                        {/* Stock Tracking Settings */}
                        <div className="border-t border-gray-800 pt-6">
                            <h3 className="text-lg font-semibold text-gray-100 mb-4">Stock Tracking</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium text-gray-300">Auto Refresh</label>
                                        <p className="text-xs text-gray-500">Automatically refresh stock data</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        {...settingsForm.register('autoRefresh')}
                                        className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500"
                                    />
                                </div>
                                {settingsForm.watch('autoRefresh') && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-300 mb-2 block">
                                            Refresh Interval (seconds)
                                        </label>
                                        <input
                                            type="number"
                                            min="10"
                                            max="300"
                                            step="10"
                                            {...settingsForm.register('refreshInterval', {
                                                valueAsNumber: true,
                                                min: { value: 10, message: 'Minimum 10 seconds' },
                                                max: { value: 300, message: 'Maximum 300 seconds' },
                                            })}
                                            className="form-input w-full"
                                        />
                                        {settingsForm.formState.errors.refreshInterval && (
                                            <p className="text-sm text-red-500 mt-1">
                                                {settingsForm.formState.errors.refreshInterval.message}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium text-gray-300">Show Advanced Metrics</label>
                                        <p className="text-xs text-gray-500">Display advanced financial metrics</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        {...settingsForm.register('showAdvancedMetrics')}
                                        className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500"
                                    />
                                </div>
                                <SelectField
                                    name="defaultTimeframe"
                                    label="Default Timeframe"
                                    placeholder="Select default timeframe"
                                    options={timeframeOptions}
                                    control={settingsForm.control}
                                    error={settingsForm.formState.errors.defaultTimeframe}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={settingsForm.formState.isSubmitting || isSaving}
                                className="yellow-btn"
                            >
                                {settingsForm.formState.isSubmitting || isSaving ? 'Saving...' : 'Save Settings'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsEditingSettings(false);
                                    const settings = profile.settings || {
                                        notifications: { priceAlerts: true, marketNews: true, portfolioUpdates: true },
                                        display: { defaultView: 'dashboard', currency: 'USD' },
                                        stockTracking: { autoRefresh: true, refreshInterval: 30, showAdvancedMetrics: false, defaultTimeframe: '1M' },
                                    };
                                    settingsForm.reset({
                                        priceAlerts: settings.notifications?.priceAlerts ?? true,
                                        marketNews: settings.notifications?.marketNews ?? true,
                                        portfolioUpdates: settings.notifications?.portfolioUpdates ?? true,
                                        defaultView: settings.display?.defaultView || 'dashboard',
                                        currency: settings.display?.currency || 'USD',
                                        autoRefresh: settings.stockTracking?.autoRefresh ?? true,
                                        refreshInterval: settings.stockTracking?.refreshInterval || 30,
                                        showAdvancedMetrics: settings.stockTracking?.showAdvancedMetrics ?? false,
                                        defaultTimeframe: settings.stockTracking?.defaultTimeframe || '1M',
                                    });
                                }}
                                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6">
                        {/* Notifications Display */}
                        <div className="border-t border-gray-800 pt-6">
                            <h3 className="text-lg font-semibold text-gray-100 mb-4">Notifications</h3>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-400">
                                    Price Alerts: {profile.settings?.notifications?.priceAlerts ? 'Enabled' : 'Disabled'}
                                </p>
                                <p className="text-sm text-gray-400">
                                    Market News: {profile.settings?.notifications?.marketNews ? 'Enabled' : 'Disabled'}
                                </p>
                                <p className="text-sm text-gray-400">
                                    Portfolio Updates: {profile.settings?.notifications?.portfolioUpdates ? 'Enabled' : 'Disabled'}
                                </p>
                            </div>
                        </div>

                        {/* Display Settings Display */}
                        <div className="border-t border-gray-800 pt-6">
                            <h3 className="text-lg font-semibold text-gray-100 mb-4">Display Settings</h3>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-400">
                                    Default View: {profile.settings?.display?.defaultView || 'dashboard'}
                                </p>
                                <p className="text-sm text-gray-400">
                                    Currency: {profile.settings?.display?.currency || 'USD'}
                                </p>
                            </div>
                        </div>

                        {/* Stock Tracking Display */}
                        <div className="border-t border-gray-800 pt-6">
                            <h3 className="text-lg font-semibold text-gray-100 mb-4">Stock Tracking</h3>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-400">
                                    Auto Refresh: {profile.settings?.stockTracking?.autoRefresh ? 'Enabled' : 'Disabled'}
                                </p>
                                {profile.settings?.stockTracking?.autoRefresh && (
                                    <p className="text-sm text-gray-400">
                                        Refresh Interval: {profile.settings?.stockTracking?.refreshInterval || 30} seconds
                                    </p>
                                )}
                                <p className="text-sm text-gray-400">
                                    Advanced Metrics: {profile.settings?.stockTracking?.showAdvancedMetrics ? 'Enabled' : 'Disabled'}
                                </p>
                                <p className="text-sm text-gray-400">
                                    Default Timeframe: {profile.settings?.stockTracking?.defaultTimeframe || '1M'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
