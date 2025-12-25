"use client";

import { useState, Suspense, useEffect } from "react";
import TradeModal from "@/components/TradeModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { useDebounce } from "@/hooks/useDebounce";

interface HoldingView {
  symbol: string;
  assetType: 'stock' | 'crypto';
  quantity: string;
  averageCost: string;
  price: string;
  value: string;
}

interface TransactionView {
  symbol: string;
  assetType: 'stock' | 'crypto';
  side: 'BUY' | 'SELL';
  quantity: string;
  price: string;
  total: string;
  createdAt: Date;
}

interface TradeDashboardClientProps {
  portfolio: {
    cash: string;
    holdingsValue: string;
    portfolioValue: string;
    positions: HoldingView[];
  };
  stockQuotes: { symbol: string; price: number; change: number }[];
  cryptos: { symbol: string; displaySymbol: string; currentPrice: number; priceFormatted: string; changePercent: number; changeFormatted: string }[];
  transactions: TransactionView[];
}

export default function TradeDashboardClient({ portfolio, stockQuotes, cryptos, transactions }: TradeDashboardClientProps) {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Trading Simulator</h1>
          <p className="text-sm text-muted-foreground">Simulate trades with virtual cash across stocks and crypto.</p>
        </div>
        <Link href="/watchlist" className="text-sm text-yellow-400 hover:underline">View Watchlist</Link>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-black border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm font-medium">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-white">${portfolio.portfolioValue}</div>
            <p className="text-xs text-muted-foreground mt-1">Cash: ${portfolio.cash} · Holdings: ${portfolio.holdingsValue}</p>
          </CardContent>
        </Card>
        <Card className="bg-black border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm font-medium">Cash Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-400">${portfolio.cash}</div>
            <p className="text-xs text-muted-foreground mt-1">Available to trade</p>
          </CardContent>
        </Card>
        <Card className="bg-black border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm font-medium">Top Movers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {stockQuotes.slice(0, 3).map((q) => (
              <div key={q.symbol} className="flex items-center justify-between">
                <span className="text-white text-xs">{q.symbol}</span>
                <span className={`text-xs ${q.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {q.change >= 0 ? '+' : ''}{q.change.toFixed(2)}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-black border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm font-medium">Top Crypto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {cryptos.slice(0, 3).map((c) => (
              <div key={c.symbol} className="flex items-center justify-between">
                <span className="text-white text-xs">{c.displaySymbol}</span>
                <span className={`text-xs ${c.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {c.changeFormatted}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Asset Search & Buy Card */}
      <AssetSearchBuyCard stockQuotes={stockQuotes} cryptos={cryptos} cash={portfolio.cash} />

      {/* Main Row: Holdings (Left 65%) + Recent Transactions (Right 35%) */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Holdings Card - Left Side */}
        <Card className="bg-black border-slate-800 lg:w-[65%] flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Holdings</CardTitle>
              <span className="text-xs text-muted-foreground">{portfolio.positions.length} assets</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="h-[400px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-black z-10">
                  <tr className="text-left text-muted-foreground border-b border-slate-800">
                    <th className="py-3 px-4">Symbol</th>
                    <th className="py-3 px-2">Type</th>
                    <th className="py-3 px-2 text-right">Qty</th>
                    <th className="py-3 px-2 text-right">Avg Cost</th>
                    <th className="py-3 px-2 text-right">Price</th>
                    <th className="py-3 px-2 text-right">Value</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.positions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <TrendingUp className="h-8 w-8 text-slate-600" />
                          <p>No holdings yet</p>
                          <p className="text-xs">Search and buy assets above to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    portfolio.positions.map((p, idx) => (
                      <HoldingRow key={idx} holding={p} cash={portfolio.cash} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions Card - Right Side */}
        <Card className="bg-black border-slate-800 lg:w-[35%] flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Recent Transactions</CardTitle>
              <span className="text-xs text-muted-foreground">{transactions.length} trades</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="h-[400px] overflow-y-auto custom-scrollbar">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <TrendingDown className="h-8 w-8 text-slate-600 mb-2" />
                  <p>No trades yet</p>
                  <p className="text-xs mt-1">Your trade history will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {transactions.map((t, idx) => (
                    <div key={idx} className="flex justify-between p-4 hover:bg-slate-900/50 transition-colors">
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {t.symbol}
                          <span className={`text-xs px-1.5 py-0.5 rounded ${t.side === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {t.side}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">{t.assetType}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-sm">{parseFloat(t.quantity).toFixed(4)} @ ${t.price}</div>
                        <div className="text-xs text-muted-foreground">Total: ${t.total}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* Asset Search & Buy Card Component */
function AssetSearchBuyCard({ stockQuotes, cryptos, cash }: {
  stockQuotes: { symbol: string; price: number; change: number }[];
  cryptos: { symbol: string; displaySymbol: string; currentPrice: number; priceFormatted: string; changePercent: number; changeFormatted: string }[];
  cash: string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<StockWithWatchlistStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<{ symbol: string; name: string; price: number; assetType: 'stock' | 'crypto' } | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [showBuyModal, setShowBuyModal] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const results = await searchStocks(searchTerm.trim());
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm]);

  const handleSelectAsset = (asset: { symbol: string; name: string; price: number; assetType: 'stock' | 'crypto' }) => {
    setSelectedAsset(asset);
    setSearchTerm('');
    setSearchResults([]);
    setQuantity('1');
  };

  const handleBuy = () => {
    if (selectedAsset) {
      setShowBuyModal(true);
    }
  };

  const totalCost = selectedAsset ? (selectedAsset.price * parseFloat(quantity || '0')).toFixed(2) : '0.00';
  const maxBuy = selectedAsset ? Math.floor(parseFloat(cash) / selectedAsset.price) : 0;

  // Combine stocks and cryptos for quick select
  const quickStocks = stockQuotes.slice(0, 4);
  const quickCryptos = cryptos.slice(0, 4);

  return (
    <Card className="bg-black border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Search className="h-5 w-5" />
          Asset Search & Buy
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Search Section */}
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by symbol (AAPL) or name..."
                className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-slate-500 border-t-white rounded-full"></div>
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="bg-slate-900 border border-slate-700 rounded-lg max-h-48 overflow-y-auto custom-scrollbar">
                {searchResults.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSelectAsset({ symbol: stock.symbol, name: stock.name, price: 0, assetType: 'stock' })}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-800 transition-colors text-left"
                  >
                    <div>
                      <div className="font-semibold text-white">{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground">{stock.name}</div>
                    </div>
                    <span className="text-xs text-slate-500">{stock.exchange}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Select */}
            {!searchTerm && !selectedAsset && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Quick select:</p>
                <div className="flex flex-wrap gap-2">
                  {quickStocks.map((s) => (
                    <button
                      key={s.symbol}
                      onClick={() => handleSelectAsset({ symbol: s.symbol, name: s.symbol, price: s.price, assetType: 'stock' })}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-white hover:bg-slate-800 transition-colors"
                    >
                      {s.symbol}
                    </button>
                  ))}
                  {quickCryptos.map((c) => (
                    <button
                      key={c.symbol}
                      onClick={() => handleSelectAsset({ symbol: c.symbol, name: c.displaySymbol, price: c.currentPrice, assetType: 'crypto' })}
                      className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-xs text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                    >
                      {c.displaySymbol}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Buy Interface */}
          <div className="space-y-4">
            {selectedAsset ? (
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-lg">{selectedAsset.symbol}</div>
                    <div className="text-xs text-muted-foreground">{selectedAsset.name}</div>
                  </div>
                  <button
                    onClick={() => setSelectedAsset(null)}
                    className="text-xs text-slate-500 hover:text-white"
                  >
                    Change
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Price</label>
                    <div className="text-white font-semibold">${selectedAsset.price.toFixed(2)}</div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Quantity <span className="text-slate-500">(Max: {maxBuy})</span>
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step="0.0001"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white h-8"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                  <div>
                    <div className="text-xs text-muted-foreground">Total Cost</div>
                    <div className="text-xl font-bold text-white">${totalCost}</div>
                  </div>
                  <Button onClick={handleBuy} className="bg-green-600 hover:bg-green-700 text-white">
                    Buy {selectedAsset.symbol}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-dashed border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                <Search className="h-8 w-8 text-slate-600 mb-2" />
                <p className="text-muted-foreground">Search or select an asset</p>
                <p className="text-xs text-slate-600 mt-1">to see buy options</p>
              </div>
            )}
          </div>
        </div>

        {/* Trade Modal */}
        {selectedAsset && (
          <Suspense>
            <TradeModal
              open={showBuyModal}
              onOpenChange={setShowBuyModal}
              mode="buy"
              symbol={selectedAsset.symbol}
              assetType={selectedAsset.assetType}
              price={selectedAsset.price}
              cash={cash}
            />
          </Suspense>
        )}
      </CardContent>
    </Card>
  );
}

function HoldingRow({ holding, cash }: { holding: HoldingView; cash: string }) {
  const [openBuy, setOpenBuy] = useState(false);
  const [openSell, setOpenSell] = useState(false);
  const priceNum = Number(holding.price || 0);
  const avgCost = Number(holding.averageCost || 0);
  const pnl = priceNum - avgCost;
  const pnlPercent = avgCost > 0 ? ((pnl / avgCost) * 100).toFixed(2) : '0';

  return (
    <tr className="border-b border-slate-800 last:border-b-0 hover:bg-slate-900/50 transition-colors">
      <td className="py-3 px-4">
        <div className="font-semibold text-white">{holding.symbol}</div>
      </td>
      <td className="py-3 px-2">
        <span className={`text-xs px-1.5 py-0.5 rounded ${holding.assetType === 'crypto' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
          {holding.assetType}
        </span>
      </td>
      <td className="py-3 px-2 text-right text-white">{parseFloat(holding.quantity).toFixed(4)}</td>
      <td className="py-3 px-2 text-right text-muted-foreground">${avgCost.toFixed(2)}</td>
      <td className="py-3 px-2 text-right">
        <span className="text-white">${priceNum.toFixed(2)}</span>
        <span className={`block text-xs ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {pnl >= 0 ? '+' : ''}{pnlPercent}%
        </span>
      </td>
      <td className="py-3 px-2 text-right text-white font-medium">${holding.value}</td>
      <td className="py-3 px-4 text-right">
        <div className="flex gap-1 justify-end">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpenBuy(true)}>Buy</Button>
          <Button size="sm" variant="secondary" className="h-7 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400" onClick={() => setOpenSell(true)}>Sell</Button>
        </div>
        <Suspense>
          <TradeModal open={openBuy} onOpenChange={setOpenBuy} mode="buy" symbol={holding.symbol} assetType={holding.assetType} price={priceNum} cash={cash} />
          <TradeModal open={openSell} onOpenChange={setOpenSell} mode="sell" symbol={holding.symbol} assetType={holding.assetType} price={priceNum} maxSellQty={holding.quantity} />
        </Suspense>
      </td>
    </tr>
  );
}

