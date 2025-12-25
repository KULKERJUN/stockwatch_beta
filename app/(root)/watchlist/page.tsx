import { Sparkles, RefreshCw } from 'lucide-react';
import { searchStocks } from '@/lib/actions/finnhub.actions';
import SearchCommand from '@/components/SearchCommand';
import { getWatchlistWithData } from '@/lib/actions/watchlist.actions';
import { getWatchlistAIAnalysis } from '@/lib/actions/ai.actions';
import { auth } from '@/lib/better-auth/auth';
import WatchlistTable from '@/components/WatchlistTable';
import { headers } from 'next/headers';

const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
        case 'bullish':
            return 'text-green-400 bg-green-500/10 border-green-500/30';
        case 'bearish':
            return 'text-red-400 bg-red-500/10 border-red-500/30';
        case 'mixed':
            return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        default:
            return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    }
};

const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
        case 'bullish':
            return '📈';
        case 'bearish':
            return '📉';
        case 'mixed':
            return '↔️';
        default:
            return '📊';
    }
};

const Watchlist = async () => {
    const [watchlist, initialStocks, session] = await Promise.all([
        getWatchlistWithData(),
        searchStocks(),
        auth.api.getSession({ headers: await headers() }),
    ]);

    // Get AI analysis if user has watchlist items
    const aiAnalysis = session?.user?.email && watchlist.length > 0
        ? await getWatchlistAIAnalysis(session.user.email)
        : null;

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-100 mb-2">My Watchlist</h1>
                        <p className="text-gray-400">
                            {watchlist.length === 0 
                                ? 'No stocks in your watchlist yet' 
                                : `${watchlist.length} ${watchlist.length === 1 ? 'asset' : 'assets'} in your watchlist`}
                        </p>
                    </div>
                    <SearchCommand initialStocks={initialStocks} />
                </div>

                {/* AI Insight Card - High Priority */}
                {aiAnalysis && (
                    <div className={`rounded-xl p-6 border-2 ${getSentimentColor(aiAnalysis.sentiment)} shadow-lg mb-6`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                                    <Sparkles className="h-6 w-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        AI Trend Analysis
                                        <span className="text-2xl">{getSentimentIcon(aiAnalysis.sentiment)}</span>
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        Personalized insights for your {aiAnalysis.symbols.length} watched asset{aiAnalysis.symbols.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <RefreshCw className="h-3 w-3" />
                                <span>Updates every 30 min</span>
                            </div>
                        </div>

                        <div className="prose prose-invert prose-sm max-w-none">
                            <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                                {aiAnalysis.analysis}
                            </div>
                        </div>

                        {/* Tracked Symbols */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-400">Tracking:</span>
                                {aiAnalysis.symbols.slice(0, 8).map((symbol) => (
                                    <span
                                        key={symbol}
                                        className="px-2 py-1 text-xs font-medium bg-slate-700/50 text-gray-300 rounded"
                                    >
                                        {symbol.includes(':') ? symbol.split(':')[1] : symbol}
                                    </span>
                                ))}
                                {aiAnalysis.symbols.length > 8 && (
                                    <span className="text-xs text-gray-500">
                                        +{aiAnalysis.symbols.length - 8} more
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Watchlist Table */}
                {watchlist.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 mb-4 text-lg">Your watchlist is empty</p>
                        <p className="text-gray-500 mb-6">Start building your watchlist by adding stocks from the stocks page</p>
                    </div>
                ) : (
                    <WatchlistTable items={watchlist} />
                )}
            </div>
        </div>
    );
};

export default Watchlist;

