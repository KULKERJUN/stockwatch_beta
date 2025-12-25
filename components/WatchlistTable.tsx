'use client';

import { removeFromWatchlist } from '@/lib/actions/watchlist.actions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

export const WatchlistTable = ({ items = [], onRemoveAction }: WatchlistTableProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleRemove = async (symbol: string, company: string) => {
        setIsLoading(true);
        try {
            const result = await removeFromWatchlist(symbol);
            if (result && result.success) {
                toast.success('Removed from watchlist', {
                    description: `${company} has been removed from your watchlist.`,
                });
                onRemoveAction?.();
            } else {
                toast.error('Failed to remove', {
                    description: result?.error || 'Could not remove stock from watchlist.',
                });
            }
        } catch (error) {
            console.error('Error removing from watchlist:', error);
            toast.error('Error', {
                description: 'An unexpected error occurred.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="w-full rounded-lg border border-slate-200 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold text-slate-900">
                            Symbol
                        </TableHead>
                        <TableHead className="font-semibold text-slate-900">
                            Company
                        </TableHead>
                        <TableHead className="text-right font-semibold text-slate-900">
                            Price
                        </TableHead>
                        <TableHead className="text-right font-semibold text-slate-900">
                            Change
                        </TableHead>
                        <TableHead className="text-right font-semibold text-slate-900">
                            Market Cap
                        </TableHead>
                        <TableHead className="text-right font-semibold text-slate-900">
                            P/E Ratio
                        </TableHead>
                        <TableHead className="text-center font-semibold text-slate-900">
                            Action
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item: WatchlistTableItem) => {
                        const isPositive = (item.changePercent || 0) >= 0;
                        const changeColor = isPositive
                            ? 'text-green-600'
                            : 'text-red-600';

                        return (
                            <TableRow
                                key={item.symbol}
                                className="hover:bg-slate-50 transition-colors"
                            >
                                <TableCell className="font-semibold">
                                    <Link
                                        href={`/stocks/${item.symbol}`}
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        {item.symbol}
                                    </Link>
                                </TableCell>
                                <TableCell>{item.company}</TableCell>
                                <TableCell className="text-right">
                                    {item.priceFormatted || '$—'}
                                </TableCell>
                                <TableCell className={`text-right ${changeColor}`}>
                                    {item.changeFormatted || '—'}
                                </TableCell>
                                <TableCell className="text-right">
                                    {item.marketCap || '—'}
                                </TableCell>
                                <TableCell className="text-right">
                                    {item.peRatio || '—'}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            handleRemove(item.symbol, item.company)
                                        }
                                        disabled={isLoading}
                                        className="hover:bg-red-50 hover:text-red-600"
                                        aria-label={`Remove ${item.company} from watchlist`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

export default WatchlistTable;

