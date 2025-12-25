'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import PriceAlertForm from '@/components/forms/PriceAlertForm';

interface CreateAlertButtonProps {
    symbol: string;
}

const CreateAlertButton = ({ symbol }: CreateAlertButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-yellow-500 gap-2">
                    <Bell className="h-4 w-4" />
                    Set Price Alert
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-gray-100 max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Alert for {symbol}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        We'll notify you when {symbol} reaches your target price.
                    </DialogDescription>
                </DialogHeader>
                <PriceAlertForm 
                    defaultSymbol={symbol} 
                    onSuccess={() => setIsOpen(false)} 
                />
            </DialogContent>
        </Dialog>
    );
};

export default CreateAlertButton;

