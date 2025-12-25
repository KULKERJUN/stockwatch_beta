'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getChangeColorClass } from '@/lib/utils';
import WatchlistButton from '@/components/WatchlistButton';

interface CryptoTableProps {
    cryptos: CryptoWithPrice[];
    watchlistSymbols?: string[];
}

const CryptoTable = ({ cryptos, watchlistSymbols = [] }: CryptoTableProps) => {
    const [watchlist, setWatchlist] = useState<Set<string>>(new Set(watchlistSymbols));

    const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
        setWatchlist((prev) => {
            const newSet = new Set(prev);
            if (isAdded) {
                newSet.add(symbol);
            } else {
                newSet.delete(symbol);
            }
            return newSet;
        });
    };

    if (cryptos.length === 0) {
        return (
            <div className="p-8 text-center text-gray-400">
                <p>Unable to load cryptocurrency data. Please try again later.</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-gray-400">Symbol</TableHead>
                    <TableHead className="text-gray-400">Pair</TableHead>
                    <TableHead className="text-right text-gray-400">Price</TableHead>
                    <TableHead className="text-right text-gray-400">Change</TableHead>
                    <TableHead className="text-right text-gray-400">High</TableHead>
                    <TableHead className="text-right text-gray-400">Low</TableHead>
                    <TableHead className="text-center text-gray-400">Watchlist</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {cryptos.map((crypto) => {
                    const baseCurrency = crypto.displaySymbol.replace('USDT', '');
                    const isInWatchlist = watchlist.has(crypto.symbol);

                    return (
                        <TableRow key={crypto.symbol} className="border-slate-700 hover:bg-slate-700/50">
                            <TableCell className="font-semibold text-white">
                                {baseCurrency}
                            </TableCell>
                            <TableCell className="text-gray-400">{crypto.description}</TableCell>
                            <TableCell className="text-right font-medium text-white">
                                {crypto.priceFormatted}
                            </TableCell>
                            <TableCell className={`text-right ${getChangeColorClass(crypto.changePercent)}`}>
                                {crypto.changeFormatted}
                            </TableCell>
                            <TableCell className="text-right text-gray-400">
                                ${crypto.high.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-gray-400">
                                ${crypto.low.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                                <WatchlistButton
                                    symbol={crypto.symbol}
                                    company={crypto.description}
                                    isInWatchlist={isInWatchlist}
                                    type="icon"
                                    assetType="crypto"
                                    onWatchlistChange={handleWatchlistChange}
                                />
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default CryptoTable;

