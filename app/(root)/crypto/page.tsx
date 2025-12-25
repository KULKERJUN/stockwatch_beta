import { getPopularCryptos, getCryptoNews } from '@/lib/actions/finnhub.actions';
import { summarizeCryptoSentiment } from '@/lib/actions/ai.actions';
import { getWatchlistSymbolsByEmail } from '@/lib/actions/watchlist.actions';
import { auth } from '@/lib/better-auth/auth';
import { formatTimeAgo } from '@/lib/utils';
import TradingViewWidget from '@/components/TradingViewWidget';
import CryptoTable from '@/components/CryptoTable';
import {
    CRYPTO_MARKET_OVERVIEW_WIDGET_CONFIG,
    CRYPTO_HEATMAP_WIDGET_CONFIG,
    CRYPTO_NEWS_WIDGET_CONFIG,
    CRYPTO_MARKET_DATA_WIDGET_CONFIG,
} from '@/lib/constants';
import Link from 'next/link';
import { ArrowUpRight, TrendingUp, Newspaper, Bitcoin } from 'lucide-react';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

const CryptoPage = async () => {
    const scriptUrl = 'https://s3.tradingview.com/external-embedding/embed-widget-';

    const [cryptos, news, session] = await Promise.all([
        getPopularCryptos('binance', 20),
        getCryptoNews(),
        auth.api.getSession({ headers: await headers() }),
    ]);

    // Get watchlist symbols if user is logged in
    const watchlistSymbols = session?.user?.email
        ? await getWatchlistSymbolsByEmail(session.user.email)
        : [];

    // Generate AI sentiment summary from news
    const newsForAI = news.slice(0, 8).map((n) => ({
        headline: n.headline || '',
        summary: n.summary,
    }));

    const sentiment = newsForAI.length > 0
        ? await summarizeCryptoSentiment(newsForAI)
        : { summary: 'No news available for analysis.', sentiment: 'neutral' as const };

    const getSentimentColor = (s: string) => {
        switch (s) {
            case 'bullish':
                return 'text-green-500 bg-green-500/10 border-green-500/30';
            case 'bearish':
                return 'text-red-500 bg-red-500/10 border-red-500/30';
            case 'mixed':
                return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
            default:
                return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
        }
    };

    return (
        <div className="flex min-h-screen home-wrapper">
            {/* Header Section */}
            <div className="w-full px-6 pt-6 pb-2">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Bitcoin className="h-8 w-8 text-yellow-500" />
                        <div>
                            <h1 className="text-2xl font-bold text-white">Crypto Dashboard</h1>
                            <p className="text-gray-400 text-sm">Real-time cryptocurrency market data</p>
                        </div>
                    </div>
                </div>

                {/* AI Sentiment Card */}
                <div className={`rounded-lg p-5 border mb-6 ${getSentimentColor(sentiment.sentiment)}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <TrendingUp className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">AI Market Sentiment</h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getSentimentColor(sentiment.sentiment)}`}>
                            {sentiment.sentiment}
                        </span>
                    </div>
                    <div className="text-sm opacity-90 whitespace-pre-wrap leading-relaxed">
                        {sentiment.summary}
                    </div>
                </div>
            </div>

            {/* Row 1: Market Overview + Heatmap */}
            <section className="grid w-full gap-8 home-section">
                <div className="md:col-span-1 xl:col-span-1">
                    <TradingViewWidget
                        title="Crypto Overview"
                        scriptUrl={`${scriptUrl}market-overview.js`}
                        config={CRYPTO_MARKET_OVERVIEW_WIDGET_CONFIG}
                        className="custom-chart"
                        height={600}
                    />
                </div>
                <div className="md:col-span-1 xl:col-span-2">
                    <TradingViewWidget
                        title="Crypto Heatmap"
                        scriptUrl={`${scriptUrl}crypto-coins-heatmap.js`}
                        config={CRYPTO_HEATMAP_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
            </section>

            {/* Row 2: News Timeline + Market Quotes */}
            <section className="grid w-full gap-8 home-section">
                <div className="h-full md:col-span-1 xl:col-span-1">
                    <TradingViewWidget
                        title="Crypto News"
                        scriptUrl={`${scriptUrl}timeline.js`}
                        config={CRYPTO_NEWS_WIDGET_CONFIG}
                        className="custom-chart"
                        height={600}
                    />
                </div>
                <div className="h-full md:col-span-1 xl:col-span-2">
                    <TradingViewWidget
                        title="Market Prices"
                        scriptUrl={`${scriptUrl}market-quotes.js`}
                        config={CRYPTO_MARKET_DATA_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
            </section>

            {/* Row 3: Detailed Crypto Table */}
            <section className="w-full px-6 py-8">
                <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">Top 20 Cryptocurrencies</h2>
                        <span className="text-gray-400 text-sm">Click ⭐ to add to watchlist</span>
                    </div>
                    <CryptoTable cryptos={cryptos} watchlistSymbols={watchlistSymbols} />
                </div>
            </section>

            {/* Row 4: Finnhub News Cards */}
            {news.length > 0 && (
                <section className="w-full px-6 pb-8">
                    <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Newspaper className="h-5 w-5 text-blue-400" />
                                <h2 className="text-lg font-semibold text-white">Latest Headlines</h2>
                            </div>
                            <Link href="/crypto/news" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                                View All <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                            {news.slice(0, 4).map((article, idx) => (
                                <a
                                    key={article.id || idx}
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-all hover:scale-[1.02]"
                                >
                                    {article.image && (
                                        <div className="aspect-video overflow-hidden">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={article.image}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    )}
                                    <div className="p-3">
                                        <h3 className="font-medium text-white text-sm line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
                                            {article.headline}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <span>{article.source}</span>
                                            <span>•</span>
                                            <span>{article.datetime ? formatTimeAgo(article.datetime) : ''}</span>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default CryptoPage;

