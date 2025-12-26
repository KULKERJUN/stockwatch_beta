'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { updateNotificationPreferences } from '@/lib/actions/notification.actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface NotificationPreferences {
    emailEnabled: boolean;
    inAppEnabled: boolean;
    quietHoursEnabled: boolean;
    quietStart: string;
    quietEnd: string;
}

interface NotificationPreferencesFormProps {
    initialPreferences: NotificationPreferences | null;
}

const NotificationPreferencesForm = ({
    initialPreferences,
}: NotificationPreferencesFormProps) => {
    const [preferences, setPreferences] = useState<NotificationPreferences>(
        initialPreferences || {
            emailEnabled: true,
            inAppEnabled: true,
            quietHoursEnabled: false,
            quietStart: '22:00',
            quietEnd: '07:00',
        }
    );
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = (field: keyof NotificationPreferences) => {
        setPreferences((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handleTimeChange = (field: 'quietStart' | 'quietEnd', value: string) => {
        setPreferences((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await updateNotificationPreferences(preferences);

            if (result.success) {
                toast.success('Preferences updated successfully');
            } else {
                toast.error(result.error || 'Failed to update preferences');
            }
        } catch (error) {
            toast.error('An error occurred while updating preferences');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                    Notification Preferences
                </h2>
                <p className="text-gray-400 text-sm">
                    Control how and when you receive notifications
                </p>
            </div>

            {/* Email Notifications Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                <div className="flex-1">
                    <Label htmlFor="emailEnabled" className="text-white font-medium text-base">
                        Email Notifications
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">
                        Receive notifications via email
                    </p>
                </div>
                <button
                    type="button"
                    id="emailEnabled"
                    role="switch"
                    aria-checked={preferences.emailEnabled}
                    onClick={() => handleToggle('emailEnabled')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                        preferences.emailEnabled ? 'bg-yellow-500' : 'bg-gray-600'
                    }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>

            {/* In-App Notifications Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                <div className="flex-1">
                    <Label htmlFor="inAppEnabled" className="text-white font-medium text-base">
                        In-App Notifications
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">
                        Show notifications in Notification Center
                    </p>
                </div>
                <button
                    type="button"
                    id="inAppEnabled"
                    role="switch"
                    aria-checked={preferences.inAppEnabled}
                    onClick={() => handleToggle('inAppEnabled')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                        preferences.inAppEnabled ? 'bg-yellow-500' : 'bg-gray-600'
                    }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.inAppEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>

            {/* Quiet Hours Section */}
            <div className="p-4 bg-slate-700/30 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <Label
                            htmlFor="quietHoursEnabled"
                            className="text-white font-medium text-base"
                        >
                            Quiet Hours
                        </Label>
                        <p className="text-sm text-gray-400 mt-1">
                            Pause notifications during specific hours
                        </p>
                    </div>
                    <button
                        type="button"
                        id="quietHoursEnabled"
                        role="switch"
                        aria-checked={preferences.quietHoursEnabled}
                        onClick={() => handleToggle('quietHoursEnabled')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                            preferences.quietHoursEnabled ? 'bg-yellow-500' : 'bg-gray-600'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                preferences.quietHoursEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>

                {preferences.quietHoursEnabled && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-600">
                        <div>
                            <Label htmlFor="quietStart" className="text-gray-300 text-sm mb-2 block">
                                Start Time
                            </Label>
                            <Input
                                id="quietStart"
                                type="time"
                                value={preferences.quietStart}
                                onChange={(e) => handleTimeChange('quietStart', e.target.value)}
                                className="bg-slate-800 border-slate-600 text-white"
                            />
                        </div>
                        <div>
                            <Label htmlFor="quietEnd" className="text-gray-300 text-sm mb-2 block">
                                End Time
                            </Label>
                            <Input
                                id="quietEnd"
                                type="time"
                                value={preferences.quietEnd}
                                onChange={(e) => handleTimeChange('quietEnd', e.target.value)}
                                className="bg-slate-800 border-slate-600 text-white"
                            />
                        </div>
                    </div>
                )}

                {preferences.quietHoursEnabled && (
                    <p className="text-xs text-gray-500 italic">
                        Notifications will be queued and delivered after quiet hours end
                    </p>
                )}
            </div>

            {/* Save Button */}
            <div className="pt-4">
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Preferences'
                    )}
                </Button>
            </div>
        </form>
    );
};

export default NotificationPreferencesForm;

