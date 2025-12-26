'use client';

import { useState, useEffect } from 'react';
import { formatTimeAgo } from '@/lib/utils';
import { Bell, Newspaper, TrendingUp, Info } from 'lucide-react';

interface Notification {
    id: string;
    type: 'DAILY_NEWS_SUMMARY' | 'PRICE_ALERT' | 'SYSTEM';
    title: string;
    content: string;
    createdAt: string | Date; // Accept both string and Date to handle serialization
}

interface NotificationsListProps {
    notifications: Notification[];
}

const NotificationsList = ({ notifications }: NotificationsListProps) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'DAILY_NEWS_SUMMARY':
                return <Newspaper className="h-5 w-5 text-blue-400" />;
            case 'PRICE_ALERT':
                return <TrendingUp className="h-5 w-5 text-yellow-500" />;
            case 'SYSTEM':
                return <Info className="h-5 w-5 text-gray-400" />;
            default:
                return <Bell className="h-5 w-5 text-gray-400" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'DAILY_NEWS_SUMMARY':
                return 'News Summary';
            case 'PRICE_ALERT':
                return 'Price Alert';
            case 'SYSTEM':
                return 'System';
            default:
                return 'Notification';
        }
    };

    if (notifications.length === 0) {
        return (
            <div className="p-12 text-center">
                <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No notifications yet</h3>
                <p className="text-gray-500">
                    You&apos;ll see your notifications here when they arrive
                </p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-slate-700">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className="p-6 hover:bg-slate-700/30 transition-colors"
                >
                    <div className="flex gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                            <div className="p-2 bg-slate-700/50 rounded-lg">
                                {getIcon(notification.type)}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 mb-2">
                                <div>
                                    <h3 className="text-base font-semibold text-white mb-1">
                                        {notification.title}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs px-2 py-1 bg-slate-700 text-gray-300 rounded">
                                            {getTypeLabel(notification.type)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {formatTimeAgo(
                                                Math.floor(new Date(notification.createdAt).getTime() / 1000)
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            {isMounted ? (
                                <div
                                    className="text-sm text-gray-300 prose prose-invert prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: notification.content }}
                                />
                            ) : (
                                <div className="text-sm text-gray-300">
                                    Loading content...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotificationsList;

