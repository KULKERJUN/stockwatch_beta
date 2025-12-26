import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getNotifications, getNotificationPreferences } from '@/lib/actions/notification.actions';
import NotificationsList from '@/components/NotificationsList';
import NotificationPreferencesForm from '@/components/NotificationPreferencesForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export const dynamic = 'force-dynamic';

const NotificationsPage = async () => {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        redirect('/sign-in');
    }

    // Fetch notifications and preferences
    const notificationsResult = await getNotifications(50);
    const preferencesResult = await getNotificationPreferences();

    // Serialize data to avoid hydration mismatches
    const notifications = notificationsResult.success
        ? notificationsResult.data?.map(n => ({
            ...n,
            createdAt: new Date(n.createdAt).toISOString(),
        })) || []
        : [];
    const preferences = preferencesResult.success && preferencesResult.data ? preferencesResult.data : null;

    return (
        <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-yellow-500/10 rounded-lg">
                            <Bell className="h-6 w-6 text-yellow-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Notification Center</h1>
                    </div>
                    <p className="text-gray-400 ml-[60px]">
                        Manage your notifications and preferences
                    </p>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="inbox" className="w-full">
                    <TabsList className="bg-slate-800 border border-slate-700 mb-6">
                        <TabsTrigger
                            value="inbox"
                            className="data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900"
                        >
                            Inbox
                        </TabsTrigger>
                        <TabsTrigger
                            value="preferences"
                            className="data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900"
                        >
                            Preferences
                        </TabsTrigger>
                    </TabsList>

                    {/* Inbox Tab */}
                    <TabsContent value="inbox">
                        <Card className="bg-slate-800/50 border-slate-700">
                            <NotificationsList notifications={notifications || []} />
                        </Card>
                    </TabsContent>

                    {/* Preferences Tab */}
                    <TabsContent value="preferences">
                        <Card className="bg-slate-800/50 border-slate-700">
                            <NotificationPreferencesForm initialPreferences={preferences} />
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default NotificationsPage;

