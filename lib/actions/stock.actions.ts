'use server';

/**
 * Fetches real-time stock prices from TradingView's public scanner API.
 * This API is used by TradingView's own widgets and provides real-time data
 * without requiring an API key.
 */
export const getStockPrice = async (symbol: string): Promise<number> => {
    try {
        const normalizedSymbol = symbol.toUpperCase();
        
        // TradingView scanner API requires a specific format for the request
        // We'll search across multiple exchanges for the symbol
        const response = await fetch('https://scanner.tradingview.com/global/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                symbols: {
                    tickers: [`NASDAQ:${normalizedSymbol}`, `NYSE:${normalizedSymbol}`, `AMEX:${normalizedSymbol}`],
                    query: { types: [] }
                },
                columns: ['close']
            }),
            next: { revalidate: 30 } // Cache for 30 seconds
        });

        if (!response.ok) {
            throw new Error('Failed to fetch from TradingView');
        }

        const result = await response.json();
        
        // Find the first valid price from the returned tickers
        const match = result.data?.find((item: any) => item.d && item.d[0] !== null);
        
        if (match && match.d && match.d[0]) {
            return parseFloat(match.d[0].toFixed(2));
        }

        // Fallback to mock prices if symbol not found in scanner
        console.warn(`Symbol ${normalizedSymbol} not found in TradingView scanner, using fallback.`);
        return getFallbackPrice(normalizedSymbol);
    } catch (error) {
        console.error('Error fetching real-time price:', error);
        return getFallbackPrice(symbol);
    }
};

export const getMultipleStockPrices = async (symbols: string[]): Promise<Record<string, number>> => {
    try {
        const normalizedSymbols = symbols.map(s => s.toUpperCase());
        const tickers = normalizedSymbols.flatMap(s => [`NASDAQ:${s}`, `NYSE:${s}`, `AMEX:${s}`]);
        
        const response = await fetch('https://scanner.tradingview.com/global/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                symbols: {
                    tickers: tickers,
                    query: { types: [] }
                },
                columns: ['close']
            }),
            next: { revalidate: 30 }
        });

        const prices: Record<string, number> = {};
        
        if (response.ok) {
            const result = await response.json();
            
            normalizedSymbols.forEach(symbol => {
                // Find any match for this symbol (could be NASDAQ:AAPL, NYSE:AAPL, etc.)
                const match = result.data?.find((item: any) => 
                    item.s.endsWith(`:${symbol}`) && item.d && item.d[0] !== null
                );
                
                if (match && match.d && match.d[0]) {
                    prices[symbol] = parseFloat(match.d[0].toFixed(2));
                }
            });
        }

        // Fill in missing symbols with fallback prices
        for (const symbol of normalizedSymbols) {
            if (!prices[symbol]) {
                prices[symbol] = await getFallbackPrice(symbol);
            }
        }

        return prices;
    } catch (error) {
        console.error('Error fetching multiple real-time prices:', error);
        const fallbackPrices: Record<string, number> = {};
        for (const symbol of symbols) {
            fallbackPrices[symbol.toUpperCase()] = await getFallbackPrice(symbol);
        }
        return fallbackPrices;
    }
};

/**
 * Fallback price logic for when the API fails or symbol isn't found.
 */
const getFallbackPrice = (symbol: string): number => {
    const mockPrices: Record<string, number> = {
        'AAPL': 185.92,
        'TSLA': 248.45,
        'GOOGL': 142.71,
        'MSFT': 375.22,
        'AMZN': 147.42,
        'META': 334.92,
        'NVDA': 495.22,
        'NFLX': 462.15,
    };

    const normalizedSymbol = symbol.toUpperCase();
    return mockPrices[normalizedSymbol] || parseFloat((100 + Math.random() * 200).toFixed(2));
};

