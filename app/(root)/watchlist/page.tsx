import { Star, Sparkles, RefreshCw } from 'lucide-react';
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

    // Empty state
    if (watchlist.length === 0) {
        return (
            <section className="flex watchlist-empty-container">
                <div className="watchlist-empty">
                    <Star className="watchlist-star" />
                    <h2 className="empty-title">Your watchlist is empty</h2>
                    <p className="empty-description">
                        Start building your watchlist by searching for stocks and clicking the star icon to add them.
                    </p>
                </div>
                <SearchCommand initialStocks={initialStocks} />
            </section>
        );
    }

    return (
        <section className="watchlist">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="watchlist-title">Watchlist</h2>
                    <SearchCommand initialStocks={initialStocks} />
                </div>

                {/* AI Insight Card - High Priority */}
                {aiAnalysis && (
                    <div className={`rounded-xl p-6 border-2 ${getSentimentColor(aiAnalysis.sentiment)} shadow-lg`}>
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
                <WatchlistTable items={watchlist} />
            </div>
        </section>
    );
};

export default Watchlist;