'use server';

/**
 * In a production environment, you would use a real stock API like Finnhub, Alpha Vantage, or Yahoo Finance.
 * For this beta version, we'll provide a mock implementation that returns realistic-looking prices.
 */
export const getStockPrice = async (symbol: string): Promise<number> => {
    // Mock prices for common stocks to make it feel real
    const mockPrices: Record<string, number> = {
        'AAPL': 180 + Math.random() * 20,
        'TSLA': 240 + Math.random() * 30,
        'GOOGL': 140 + Math.random() * 10,
        'MSFT': 370 + Math.random() * 40,
        'AMZN': 145 + Math.random() * 15,
        'META': 330 + Math.random() * 25,
        'NVDA': 480 + Math.random() * 50,
        'NFLX': 450 + Math.random() * 30,
    };

    const normalizedSymbol = symbol.toUpperCase();
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    if (mockPrices[normalizedSymbol]) {
        return parseFloat(mockPrices[normalizedSymbol].toFixed(2));
    }

    // Default price for other stocks
    return parseFloat((100 + Math.random() * 200).toFixed(2));
};

export const getMultipleStockPrices = async (symbols: string[]): Promise<Record<string, number>> => {
    const prices: Record<string, number> = {};
    
    await Promise.all(symbols.map(async (symbol) => {
        prices[symbol.toUpperCase()] = await getStockPrice(symbol);
    }));

    return prices;
};

