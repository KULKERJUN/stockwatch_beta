import { getPortfolioSnapshot, getRecentTransactions } from "@/lib/actions/trade.actions";
import { getPopularCryptos, getStocksDetails } from "@/lib/actions/finnhub.actions";
import TradeDashboardClient from "@/components/TradeDashboardClient";

// Simple server component page for trade dashboard
export default async function TradePage() {
  const [portfolio, transactions, cryptos] = await Promise.all([
    getPortfolioSnapshot(),
    getRecentTransactions(10),
    getPopularCryptos('binance', 8),
  ]);

  const topSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN'];
  const stockQuotes = await Promise.all(
    topSymbols.map(async (sym) => {
      try {
        const data = await getStocksDetails(sym);
        return { symbol: sym, price: data?.currentPrice ?? 0, change: data?.changePercent ?? 0 };
      } catch {
        return { symbol: sym, price: 0, change: 0 };
      }
    })
  );

  return (
    <TradeDashboardClient
      portfolio={portfolio}
      stockQuotes={stockQuotes}
      cryptos={cryptos}
      transactions={transactions}
    />
  );
}
