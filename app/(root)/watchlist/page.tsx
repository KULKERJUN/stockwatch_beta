'use client';

import { useEffect, useState } from 'react';
import { getWatchlist } from '@/lib/actions/profile.actions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import WatchlistButton from '@/components/WatchlistButton';
import { Button } from '@/components/ui/button';

const WatchlistPage = () => {
    const [watchlist, setWatchlist] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadWatchlist = async () => {
            try {
                const result = await getWatchlist();
                if (result.success && result.data) {
                    setWatchlist(result.data);
                } else {
                    toast.error('Failed to load watchlist', {
                        description: result.error || 'Could not load your watchlist.',
                    });
                }
            } catch (error) {
                console.error('Error loading watchlist:', error);
                toast.error('Failed to load watchlist');
            } finally {
                setLoading(false);
            }
        };

        loadWatchlist();
    }, []);

    const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
        if (!isAdded) {
            setWatchlist(prev => prev.filter(s => s !== symbol));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-100 mb-2">My Watchlist</h1>
                        <p className="text-gray-400">
                            {watchlist.length === 0 
                                ? 'No stocks in your watchlist yet' 
                                : `${watchlist.length} ${watchlist.length === 1 ? 'stock' : 'stocks'} in your watchlist`}
                        </p>
                    </div>
                    <Link href="/profile">
                        <Button
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-yellow-500"
                        >
                            Back to Profile
                        </Button>
                    </Link>
                </div>

                {watchlist.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 mb-4 text-lg">Your watchlist is empty</p>
                        <p className="text-gray-500 mb-6">Start building your watchlist by adding stocks from the stocks page</p>
                        <Link href="/stocks">
                            <Button className="yellow-btn">
                                Browse Stocks
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {watchlist.map((symbol) => (
                            <div
                                key={symbol}
                                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                            >
                                <Link 
                                    href={`/stocks/${symbol.toLowerCase()}`}
                                    className="flex-1 hover:text-yellow-500 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-semibold text-gray-100">{symbol}</span>
                                    </div>
                                </Link>
                                <WatchlistButton
                                    symbol={symbol}
                                    company={symbol}
                                    isInWatchlist={true}
                                    type="icon"
                                    onWatchlistChange={handleWatchlistChange}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WatchlistPage;

