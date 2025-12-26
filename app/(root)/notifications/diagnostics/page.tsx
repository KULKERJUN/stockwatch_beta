import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/database/mongoose';
import Notification from '@/database/models/Notification';
import NotificationPreferences from '@/database/models/NotificationPreferences';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

const DiagnosticsPage = async () => {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        redirect('/sign-in');
    }

    await connectToDatabase();

    // Get all notifications for this user
    const allNotifications = await Notification.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    const deliveredCount = await Notification.countDocuments({
        userId: session.user.id,
        status: 'DELIVERED',
    });

    const pendingCount = await Notification.countDocuments({
        userId: session.user.id,
        status: 'PENDING',
    });

    // Get user preferences
    const preferences = await NotificationPreferences.findOne({ userId: session.user.id }).lean();

    return (
        <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <h1 className="text-3xl font-bold text-white mb-8">📊 Notification Diagnostics</h1>

                {/* User Info */}
                <Card className="bg-slate-800/50 border-slate-700 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">User Information</h2>
                    <div className="space-y-2 text-gray-300">
                        <p>
                            <span className="font-semibold">User ID:</span> {session.user.id}
                        </p>
                        <p>
                            <span className="font-semibold">Email:</span> {session.user.email}
                        </p>
                        <p>
                            <span className="font-semibold">Name:</span> {session.user.name}
                        </p>
                    </div>
                </Card>

                {/* Notification Counts */}
                <Card className="bg-slate-800/50 border-slate-700 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Notification Counts</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-700/50 p-4 rounded">
                            <p className="text-gray-400 text-sm">Total</p>
                            <p className="text-2xl font-bold text-white">{allNotifications.length}</p>
                        </div>
                        <div className="bg-green-900/20 p-4 rounded">
                            <p className="text-gray-400 text-sm">Delivered</p>
                            <p className="text-2xl font-bold text-green-400">{deliveredCount}</p>
                        </div>
                        <div className="bg-yellow-900/20 p-4 rounded">
                            <p className="text-gray-400 text-sm">Pending</p>
                            <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
                        </div>
                    </div>
                </Card>

                {/* Preferences */}
                <Card className="bg-slate-800/50 border-slate-700 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Notification Preferences</h2>
                    {preferences ? (
                        <div className="space-y-2 text-gray-300">
                            <p>
                                <span className="font-semibold">Email Enabled:</span>{' '}
                                <span
                                    className={
                                        preferences.emailEnabled ? 'text-green-400' : 'text-red-400'
                                    }
                                >
                                    {preferences.emailEnabled ? '✓ Yes' : '✗ No'}
                                </span>
                            </p>
                            <p>
                                <span className="font-semibold">In-App Enabled:</span>{' '}
                                <span
                                    className={
                                        preferences.inAppEnabled ? 'text-green-400' : 'text-red-400'
                                    }
                                >
                                    {preferences.inAppEnabled ? '✓ Yes' : '✗ No'}
                                </span>
                            </p>
                            <p>
                                <span className="font-semibold">Quiet Hours:</span>{' '}
                                <span
                                    className={
                                        preferences.quietHoursEnabled
                                            ? 'text-yellow-400'
                                            : 'text-gray-400'
                                    }
                                >
                                    {preferences.quietHoursEnabled
                                        ? `✓ Enabled (${preferences.quietStart} - ${preferences.quietEnd})`
                                        : '✗ Disabled'}
                                </span>
                            </p>
                        </div>
                    ) : (
                        <p className="text-yellow-400">
                            ⚠️ No preferences found - defaults will be used
                        </p>
                    )}
                </Card>

                {/* Recent Notifications */}
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        Recent Notifications (Last 10)
                    </h2>
                    {allNotifications.length > 0 ? (
                        <div className="space-y-4">
                            {allNotifications.map((notif) => (
                                <div
                                    key={notif._id.toString()}
                                    className="bg-slate-700/30 p-4 rounded border border-slate-600"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-white">{notif.title}</h3>
                                        <span
                                            className={`text-xs px-2 py-1 rounded ${
                                                notif.status === 'DELIVERED'
                                                    ? 'bg-green-900/50 text-green-300'
                                                    : 'bg-yellow-900/50 text-yellow-300'
                                            }`}
                                        >
                                            {notif.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mb-2">
                                        Type: {notif.type} | Created:{' '}
                                        {new Date(notif.createdAt).toLocaleString()}
                                    </p>
                                    <div className="text-xs text-gray-500 max-h-20 overflow-y-auto">
                                        {notif.content.substring(0, 200)}...
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400">
                            ❌ No notifications found in database for your user ID
                        </p>
                    )}
                </Card>

                {/* Instructions */}
                <Card className="bg-blue-900/20 border-blue-700 p-6 mt-6">
                    <h2 className="text-xl font-semibold text-blue-300 mb-4">What to Check</h2>
                    <ul className="space-y-2 text-gray-300 text-sm list-disc list-inside">
                        <li>If Total count is 0, notifications are not being created</li>
                        <li>If Delivered count is 0 but Total {'>'} 0, check status</li>
                        <li>
                            If In-App Enabled is No, enable it in Preferences tab at /notifications
                        </li>
                        <li>If Quiet Hours is enabled and active, notifications will be PENDING</li>
                        <li>Check Inngest logs for errors during job execution</li>
                        <li>Wait 6 minutes for next daily news cycle to run</li>
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default DiagnosticsPage;

