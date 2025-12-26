'use client';

import { useState, useEffect } from 'react';
import { 
    getUserPriceAlerts, 
    deletePriceAlert, 
    togglePriceAlertStatus,
    checkPriceAlertsManually
} from '@/lib/actions/alert.actions';
import { toast } from 'sonner';
import { 
    Loader2, 
    Trash2, 
    Bell, 
    BellOff, 
    TrendingUp, 
    TrendingDown,
    AlertCircle,
    CheckCircle2,
    RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle,
    CardDescription
} from '@/components/ui/card';

interface Alert {
    _id: string;
    symbol: string;
    targetPrice: number;
    condition: 'ABOVE' | 'BELOW';
    status: 'ACTIVE' | 'TRIGGERED' | 'DISABLED';
    triggeredAt?: string;
    createdAt: string;
}

const AlertsList = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);

    const loadAlerts = async () => {
        setLoading(true);
        try {
            const result = await getUserPriceAlerts();
            if (result.success) {
                setAlerts(result.data);
            } else {
                toast.error(result.error || 'Failed to load alerts');
            }
        } catch (error) {
            console.error('Error loading alerts:', error);
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAlerts();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this alert?')) return;

        try {
            const result = await deletePriceAlert(id);
            if (result.success) {
                toast.success('Alert deleted');
                setAlerts(prev => prev.filter(a => a._id !== id));
            } else {
                toast.error(result.error || 'Failed to delete alert');
            }
        } catch (error) {
            console.error('Error deleting alert:', error);
            toast.error('Failed to delete alert');
        }
    };

    const handleToggle = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
        try {
            const result = await togglePriceAlertStatus(id, newStatus);
            if (result.success) {
                toast.success(`Alert ${newStatus === 'ACTIVE' ? 'enabled' : 'disabled'}`);
                setAlerts(prev => prev.map(a => 
                    a._id === id ? { ...a, status: newStatus } : a
                ));
            } else {
                toast.error(result.error || 'Failed to update alert');
            }
        } catch (error) {
            console.error('Error toggling alert:', error);
            toast.error('Failed to update alert');
        }
    };

    const handleCheckNow = async () => {
        setChecking(true);
        try {
            const result = await checkPriceAlertsManually();
            if (result.success) {
                if (result.triggeredCount && result.triggeredCount > 0) {
                    toast.success(`${result.triggeredCount} alert(s) triggered! Check your notifications.`);
                } else {
                    toast.info('No alerts triggered. Prices checked successfully.');
                }
                // Reload alerts to show updated status
                await loadAlerts();
            } else {
                toast.error(result.error || 'Failed to check alerts');
            }
        } catch (error) {
            console.error('Error checking alerts:', error);
            toast.error('Failed to check alerts');
        } finally {
            setChecking(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
        );
    }

    if (alerts.length === 0) {
        return (
            <Card className="bg-gray-900 border-gray-800">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-gray-700 mb-4" />
                    <p className="text-gray-400 text-lg">No price alerts set</p>
                    <p className="text-gray-500 max-w-sm">
                        Create an alert to get notified when your favorite stocks reach a target price.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const hasActiveAlerts = alerts.some(a => a.status === 'ACTIVE');

    return (
        <div className="space-y-4">
            {hasActiveAlerts && (
                <div className="flex justify-end">
                    <Button
                        onClick={handleCheckNow}
                        disabled={checking}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                    >
                        {checking ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Check Now
                            </>
                        )}
                    </Button>
                </div>
            )}
            <div className="grid gap-4">
                {alerts.map((alert) => (
                <Card key={alert._id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors overflow-hidden">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between p-4 sm:p-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${
                                    alert.status === 'TRIGGERED' 
                                        ? 'bg-green-500/10 text-green-500' 
                                        : alert.status === 'DISABLED'
                                            ? 'bg-gray-800 text-gray-500'
                                            : 'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                    {alert.status === 'TRIGGERED' ? (
                                        <CheckCircle2 className="h-6 w-6" />
                                    ) : (
                                        <Bell className="h-6 w-6" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold text-gray-100">{alert.symbol}</h3>
                                        <Badge variant={
                                            alert.status === 'ACTIVE' ? 'default' : 
                                            alert.status === 'TRIGGERED' ? 'success' : 'secondary'
                                        } className={
                                            alert.status === 'ACTIVE' ? 'bg-yellow-500 text-black' : 
                                            alert.status === 'TRIGGERED' ? 'bg-green-600 text-white' : ''
                                        }>
                                            {alert.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 mt-1">
                                        {alert.condition === 'ABOVE' ? (
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4 text-red-500" />
                                        )}
                                        <span>
                                            {alert.condition === 'ABOVE' ? 'Above' : 'Below'} 
                                            <span className="text-gray-100 font-semibold ml-1">${alert.targetPrice.toFixed(2)}</span>
                                        </span>
                                    </div>
                                    {alert.status === 'TRIGGERED' && alert.triggeredAt && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Triggered on {new Date(alert.triggeredAt).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {alert.status !== 'TRIGGERED' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleToggle(alert._id, alert.status)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        {alert.status === 'DISABLED' ? (
                                            <Bell className="h-5 w-5" />
                                        ) : (
                                            <BellOff className="h-5 w-5" />
                                        )}
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(alert._id)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                ))}
            </div>
        </div>
    );
};

export default AlertsList;

