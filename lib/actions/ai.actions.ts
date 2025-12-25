'use server';

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { cache } from 'react';

type NewsItem = {
    headline: string;
    summary?: string;
};

type WatchlistSymbolData = {
    symbol: string;
    name: string;
    changePercent: number;
    news: NewsItem[];
};

/**
 * Generates personalized AI analysis for a user's watchlist symbols.
 * Cached for 30 minutes to save API costs.
 * @param userEmail - User's email to identify their watchlist
 * @returns Object containing the AI analysis text and sentiment
 */
export const getWatchlistAIAnalysis = cache(async (userEmail: string): Promise<{
    analysis: string;
    sentiment: 'bullish' | 'bearish' | 'mixed' | 'neutral';
    symbols: string[];
    generatedAt: string;
}> => {
    if (!userEmail) {
        return {
            analysis: 'Please sign in to see personalized AI insights for your watchlist.',
            sentiment: 'neutral',
            symbols: [],
            generatedAt: new Date().toISOString(),
        };
    }

    try {
        // Dynamic imports to avoid circular dependencies
        const { getWatchlistSymbolsByEmail } = await import('./watchlist.actions');
        const { getNews, getStocksDetails, getPopularCryptos } = await import('./finnhub.actions');

        // Get user's watchlist symbols
        const symbols = await getWatchlistSymbolsByEmail(userEmail);

        if (!symbols || symbols.length === 0) {
            return {
                analysis: 'Add stocks or cryptos to your watchlist to receive personalized AI trend analysis.',
                sentiment: 'neutral',
                symbols: [],
                generatedAt: new Date().toISOString(),
            };
        }

        // Separate stocks and cryptos
        const cryptoSymbols = symbols.filter(s => s.includes(':'));
        const stockSymbols = symbols.filter(s => !s.includes(':'));

        // Fetch data for each symbol
        const symbolDataPromises: Promise<WatchlistSymbolData | null>[] = [];

        // Fetch stock data
        for (const symbol of stockSymbols.slice(0, 5)) { // Limit to 5 stocks
            symbolDataPromises.push(
                (async () => {
                    try {
                        const [details, news] = await Promise.all([
                            getStocksDetails(symbol),
                            getNews([symbol]),
                        ]);
                        return {
                            symbol,
                            name: details.company || symbol,
                            changePercent: details.changePercent,
                            news: news.slice(0, 2).map(n => ({
                                headline: n.headline || '',
                                summary: n.summary,
                            })),
                        };
                    } catch {
                        return null;
                    }
                })()
            );
        }

        // Fetch crypto data
        if (cryptoSymbols.length > 0) {
            const cryptos = await getPopularCryptos('binance', 20);
            for (const symbol of cryptoSymbols.slice(0, 5)) { // Limit to 5 cryptos
                const crypto = cryptos.find(c => c.symbol === symbol);
                if (crypto) {
                    symbolDataPromises.push(
                        Promise.resolve({
                            symbol,
                            name: crypto.description,
                            changePercent: crypto.changePercent,
                            news: [], // Crypto news will be fetched separately
                        })
                    );
                }
            }
        }

        const symbolData = (await Promise.all(symbolDataPromises)).filter((d): d is WatchlistSymbolData => d !== null);

        if (symbolData.length === 0) {
            return {
                analysis: 'Unable to fetch data for your watchlist symbols. Please try again later.',
                sentiment: 'neutral',
                symbols,
                generatedAt: new Date().toISOString(),
            };
        }

        // Build the prompt
        const symbolSummary = symbolData.map(d => {
            const changeSign = d.changePercent >= 0 ? '+' : '';
            return `- ${d.name} (${d.symbol}): ${changeSign}${d.changePercent.toFixed(2)}%`;
        }).join('\n');

        const allNews = symbolData.flatMap(d => d.news).filter(n => n.headline);
        const newsSummary = allNews.length > 0
            ? allNews.slice(0, 6).map((n, i) => `${i + 1}. ${n.headline}`).join('\n')
            : 'No recent news available for these symbols.';

        const prompt = `As a financial expert, analyze the current trends for ONLY these specific assets from the user's watchlist:

**User's Watchlist Performance (24h):**
${symbolSummary}

**Recent News for These Assets:**
${newsSummary}

Provide a personalized analysis with exactly 3 bullet points:
• First bullet: Overall trend direction and what's driving the movement
• Second bullet: Key catalyst or news impacting these specific assets
• Third bullet: Short-term outlook and what to watch for

Keep each bullet point concise (1-2 sentences max). Focus ONLY on the symbols listed above.

Format your response as:
**Trend:** [Bullish/Bearish/Mixed]

• [Bullet 1]
• [Bullet 2]
• [Bullet 3]`;

        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            prompt,
        });

        // Extract sentiment
        const sentimentMatch = text.match(/\*\*Trend:\*\*\s*(Bullish|Bearish|Mixed)/i);
        const sentiment = sentimentMatch
            ? sentimentMatch[1].toLowerCase() as 'bullish' | 'bearish' | 'mixed'
            : 'neutral';

        return {
            analysis: text.trim(),
            sentiment,
            symbols,
            generatedAt: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error generating watchlist AI analysis:', error);
        return {
            analysis: 'Unable to generate AI analysis at this time. Please try again later.',
            sentiment: 'neutral',
            symbols: [],
            generatedAt: new Date().toISOString(),
        };
    }
});

/**
 * Generates a market sentiment summary from news headlines/summaries using OpenAI.
 * @param items - Array of news items with headlines and optional summaries
 * @returns Object containing the sentiment summary text
 */
export const summarizeMarketSentiment = async (items: NewsItem[]) => {
    if (!items?.length) {
        return { summary: 'No recent news available to analyze.', sentiment: 'neutral' };
    }

    const prompt = `You are a professional financial analyst. Analyze the following news headlines and summaries to provide a concise market sentiment summary.

Your response should:
1. Identify the overall market sentiment (bullish, bearish, or mixed)
2. Highlight key sectors or themes mentioned
3. Note any significant catalysts or events
4. Provide 4-6 bullet points summarizing the key takeaways

Format your response as follows:
**Overall Sentiment:** [Bullish/Bearish/Mixed]

**Key Takeaways:**
• [Bullet point 1]
• [Bullet point 2]
...

News Items to Analyze:
${items
    .map(
        (item, idx) =>
            `${idx + 1}. Headline: ${item.headline}${item.summary ? `\n   Summary: ${item.summary}` : ''}`
    )
    .join('\n\n')}
`;

    try {
        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            prompt,
        });

        // Extract sentiment from the response
        const sentimentMatch = text.match(/\*\*Overall Sentiment:\*\*\s*(Bullish|Bearish|Mixed)/i);
        const sentiment = sentimentMatch
            ? sentimentMatch[1].toLowerCase() as 'bullish' | 'bearish' | 'mixed'
            : 'neutral';

        return {
            summary: text.trim(),
            sentiment,
        };
    } catch (error) {
        console.error('Error generating market sentiment:', error);
        return {
            summary: 'Unable to generate market sentiment analysis at this time.',
            sentiment: 'neutral' as const,
        };
    }
};

/**
 * Generates a crypto market sentiment summary from crypto news
 * @param items - Array of crypto news items
 * @returns Object containing the sentiment summary text
 */
export const summarizeCryptoSentiment = async (items: NewsItem[]) => {
    if (!items?.length) {
        return { summary: 'No recent crypto news available to analyze.', sentiment: 'neutral' };
    }

    const prompt = `You are a professional cryptocurrency analyst. Analyze the following crypto news headlines and summaries to provide a concise market sentiment summary.

Your response should:
1. Identify the overall crypto market sentiment (bullish, bearish, or mixed)
2. Highlight key cryptocurrencies or blockchain projects mentioned
3. Note any significant regulatory, adoption, or technical developments
4. Provide 4-6 bullet points summarizing the key takeaways

Format your response as follows:
**Overall Crypto Sentiment:** [Bullish/Bearish/Mixed]

**Key Takeaways:**
• [Bullet point 1]
• [Bullet point 2]
...

Crypto News to Analyze:
${items
    .map(
        (item, idx) =>
            `${idx + 1}. Headline: ${item.headline}${item.summary ? `\n   Summary: ${item.summary}` : ''}`
    )
    .join('\n\n')}
`;

    try {
        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            prompt,
        });

        // Extract sentiment from the response
        const sentimentMatch = text.match(/\*\*Overall Crypto Sentiment:\*\*\s*(Bullish|Bearish|Mixed)/i);
        const sentiment = sentimentMatch
            ? sentimentMatch[1].toLowerCase() as 'bullish' | 'bearish' | 'mixed'
            : 'neutral';

        return {
            summary: text.trim(),
            sentiment,
        };
    } catch (error) {
        console.error('Error generating crypto sentiment:', error);
        return {
            summary: 'Unable to generate crypto sentiment analysis at this time.',
            sentiment: 'neutral' as const,
        };
    }
};

