import { getCryptoNews } from '@/lib/actions/finnhub.actions';
import { summarizeCryptoSentiment } from '@/lib/actions/ai.actions';
import { formatTimeAgo } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Newspaper, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

const CryptoNewsPage = async () => {
    const news = await getCryptoNews();

    // Generate AI sentiment summary from news
    const newsForAI = news.slice(0, 10).map((n) => ({
        headline: n.headline || '',
        summary: n.summary,
    }));

    const sentiment = newsForAI.length > 0
        ? await summarizeCryptoSentiment(newsForAI)
        : { summary: 'No news available for analysis.', sentiment: 'neutral' as const };

    const getSentimentColor = (s: string) => {
        switch (s) {
            case 'bullish':
                return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'bearish':
                return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'mixed':
                return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            default:
                return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    return (
        <div className="flex flex-col gap-8 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/crypto">
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Newspaper className="h-6 w-6 text-blue-400" />
                            Crypto News
                        </h1>
                        <p className="text-gray-400 text-sm">Latest cryptocurrency and blockchain news</p>
                    </div>
                </div>
            </div>

            {/* AI Sentiment Summary */}
            <div className={`rounded-lg p-6 border ${getSentimentColor(sentiment.sentiment)}`}>
                <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">AI Crypto Sentiment Analysis</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize border ${getSentimentColor(sentiment.sentiment)}`}>
                        {sentiment.sentiment}
                    </span>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                    <div className="whitespace-pre-wrap opacity-90">{sentiment.summary}</div>
                </div>
            </div>

            {/* News Grid */}
            {news.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {news.map((article, idx) => (
                        <a
                            key={article.id || idx}
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors"
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
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                                    <span className="font-medium">{article.source}</span>
                                    <span>•</span>
                                    <span>{article.datetime ? formatTimeAgo(article.datetime) : ''}</span>
                                </div>
                                <h3 className="font-semibold text-white line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
                                    {article.headline}
                                </h3>
                                <p className="text-sm text-gray-400 line-clamp-3">{article.summary}</p>
                                <div className="flex items-center gap-1 mt-3 text-blue-400 text-sm">
                                    Read more <ExternalLink className="h-3 w-3" />
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-12 text-center">
                    <Newspaper className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-400 mb-2">No News Available</h3>
                    <p className="text-gray-500">Unable to fetch crypto news at this time. Please try again later.</p>
                </div>
            )}
        </div>
    );
};

export default CryptoNewsPage;

