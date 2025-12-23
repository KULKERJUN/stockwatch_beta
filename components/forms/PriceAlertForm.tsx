'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createPriceAlert } from '@/lib/actions/alert.actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, BellPlus } from 'lucide-react';

interface PriceAlertFormProps {
    defaultSymbol?: string;
    onSuccess?: () => void;
}

const PriceAlertForm = ({ defaultSymbol = '', onSuccess }: PriceAlertFormProps) => {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            symbol: defaultSymbol,
            targetPrice: '',
            condition: 'ABOVE' as 'ABOVE' | 'BELOW',
        },
    });

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const result = await createPriceAlert({
                symbol: data.symbol,
                targetPrice: parseFloat(data.targetPrice),
                condition: data.condition,
            });

            if (result.success) {
                toast.success('Alert created successfully');
                reset();
                if (onSuccess) onSuccess();
            } else {
                toast.error(result.error || 'Failed to create alert');
            }
        } catch (error) {
            console.error('Error creating alert:', error);
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="symbol">Stock Symbol</Label>
                    <Input
                        id="symbol"
                        placeholder="e.g. AAPL, TSLA"
                        className="bg-gray-800 border-gray-700 focus:ring-yellow-500"
                        {...register('symbol', { required: 'Symbol is required' })}
                    />
                    {errors.symbol && (
                        <p className="text-sm text-red-500">{errors.symbol.message}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="targetPrice">Target Price ($)</Label>
                    <Input
                        id="targetPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="bg-gray-800 border-gray-700 focus:ring-yellow-500"
                        {...register('targetPrice', { 
                            required: 'Target price is required',
                            min: { value: 0.01, message: 'Price must be greater than 0' }
                        })}
                    />
                    {errors.targetPrice && (
                        <p className="text-sm text-red-500">{errors.targetPrice.message}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="condition">Alert Condition</Label>
                    <Select
                        defaultValue="ABOVE"
                        onValueChange={(value) => setValue('condition', value as 'ABOVE' | 'BELOW')}
                    >
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                            <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="ABOVE">Price goes above</SelectItem>
                            <SelectItem value="BELOW">Price goes below</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            >
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <BellPlus className="mr-2 h-4 w-4" />
                )}
                Create Alert
            </Button>
        </form>
    );
};

export default PriceAlertForm;

