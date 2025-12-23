'use client';

import { useState } from 'react';
import PriceAlertForm from '@/components/forms/PriceAlertForm';
import AlertsList from '@/components/AlertsList';
import { 
    Bell, 
    Plus, 
    History,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

const AlertsPage = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSuccess = () => {
        setIsDialogOpen(false);
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-bold text-gray-100 mb-2 flex items-center gap-3">
                        <Bell className="h-8 w-8 text-yellow-500" />
                        Price Alerts
                    </h1>
                    <p className="text-gray-400">
                        Stay informed with real-time notifications when stocks reach your target prices.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 h-12 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-yellow-500/10">
                            <Plus className="mr-2 h-5 w-5" />
                            Create New Alert
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-800 text-gray-100 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">New Price Alert</DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Set a target price for any stock. We'll notify you when it's reached.
                            </DialogDescription>
                        </DialogHeader>
                        <PriceAlertForm onSuccess={handleSuccess} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-8">
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <History className="h-5 w-5 text-yellow-500" />
                        <h2 className="text-xl font-semibold text-gray-200">Active & Recent Alerts</h2>
                    </div>
                    <AlertsList key={refreshKey} />
                </section>
            </div>
        </div>
    );
};

export default AlertsPage;

