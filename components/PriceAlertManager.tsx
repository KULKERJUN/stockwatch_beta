'use client';

import { useEffect, useCallback } from 'react';
import { getUnnotifiedAlerts } from '@/lib/actions/alert.actions';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PriceAlertManager = () => {
    const router = useRouter();

    const checkAlerts = useCallback(async () => {
        try {
            const result = await getUnnotifiedAlerts();
            if (result.success && result.data && result.data.length > 0) {
                result.data.forEach((alert: any) => {
                    toast.success(`Price Alert Triggered!`, {
                        description: `${alert.symbol} has reached your target of $${alert.targetPrice.toFixed(2)} (${alert.condition === 'ABOVE' ? 'Above' : 'Below'}).`,
                        icon: <Bell className="h-4 w-4 text-yellow-500" />,
                        action: {
                            label: 'View',
                            onClick: () => router.push('/alerts'),
                        },
                        duration: 10000,
                    });
                });
            }
        } catch (error) {
            console.error('Error checking unnotified alerts:', error);
        }
    }, [router]);

    useEffect(() => {
        // Initial check
        checkAlerts();

        // Polling every 30 seconds
        const interval = setInterval(checkAlerts, 30000);

        return () => clearInterval(interval);
    }, [checkAlerts]);

    return null; // This component doesn't render anything visible
};

export default PriceAlertManager;

