/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Decimal from "decimal.js";
import mongoose from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { Holding } from "@/database/models/Holding";
import { Transaction } from "@/database/models/Transaction";
import { User } from "@/lib/models/User";
import { auth } from "../better-auth/auth";
import { getStocksDetails, getPopularCryptos } from "./finnhub.actions";

// Helper to ensure DB connection
async function ensureDb() {
    await connectToDatabase();
}

async function getSessionUser() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect('/sign-in');
    return session.user;
}

async function fetchLivePrice(symbol: string, assetType: 'stock' | 'crypto') {
    if (assetType === 'stock') {
        const data = await getStocksDetails(symbol);
        if (!data?.currentPrice) throw new Error('Price unavailable');
        return new Decimal(data.currentPrice);
    }
    // crypto path: try popular cryptos first
    const cryptos = await getPopularCryptos('binance');
    const found = cryptos.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
    if (found?.currentPrice) return new Decimal(found.currentPrice);
    throw new Error('Price unavailable');
}

function toDecimal128(d: Decimal) {
    return new mongoose.Types.Decimal128(d.toFixed(12));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decimalFrom(value: unknown) {
    if (value === undefined || value === null) return new Decimal(0);
    return new Decimal(String(value));
}

export interface TradeResult {
    success: boolean;
    message?: string;
    balance?: string;
}

export const buyAsset = async ({ symbol, quantity, assetType = 'stock' as 'stock' | 'crypto' }: { symbol: string; quantity: string; assetType?: 'stock' | 'crypto'; }): Promise<TradeResult> => {
    await ensureDb();
    const user = await getSessionUser();

    const normalizedSymbol = symbol.toUpperCase();
    const qty = new Decimal(quantity);
    if (qty.lte(0)) return { success: false, message: 'Quantity must be greater than zero' };

    const price = await fetchLivePrice(normalizedSymbol, assetType);
    const totalCost = price.mul(qty);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Find user by email for reliable lookup with Better Auth
        const userDoc = await User.findOne({ email: user.email }).session(session);
        if (!userDoc) throw new Error('User not found');

        // Default to 100000 if virtualBalance is not set
        const rawBalance = userDoc.virtualBalance;
        const balance = rawBalance ? decimalFrom(rawBalance) : new Decimal(100000);
        if (balance.lt(totalCost)) {
            await session.abortTransaction();
            return { success: false, message: 'Insufficient virtual balance' };
        }

        const newBalance = balance.minus(totalCost);
        userDoc.virtualBalance = toDecimal128(newBalance) as any;
        await userDoc.save({ session });

        const holding = await Holding.findOne({ userId: user.id, symbol: normalizedSymbol }).session(session);
        if (holding) {
            const currentQty = decimalFrom(holding.quantity);
            const currentAvg = decimalFrom(holding.averageCost);
            const newQty = currentQty.plus(qty);
            const newAvg = currentAvg.mul(currentQty).plus(price.mul(qty)).div(newQty);
            holding.quantity = toDecimal128(newQty) as any;
            holding.averageCost = toDecimal128(newAvg) as any;
            await holding.save({ session });
        } else {
            await Holding.create([{
                userId: user.id,
                symbol: normalizedSymbol,
                assetType,
                quantity: toDecimal128(qty) as any,
                averageCost: toDecimal128(price) as any,
            }], { session });
        }

        await Transaction.create([{
            userId: user.id,
            symbol: normalizedSymbol,
            assetType,
            side: 'BUY',
            quantity: toDecimal128(qty) as any,
            price: toDecimal128(price) as any,
            total: toDecimal128(totalCost) as any,
        }], { session });

        await session.commitTransaction();
        session.endSession();

        revalidatePath('/watchlist');
        revalidatePath('/trade');

        return { success: true, message: 'Purchase completed', balance: newBalance.toFixed(2) };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('buyAsset error:', error);
        return { success: false, message: 'Failed to complete purchase' };
    }
};

export const sellAsset = async ({ symbol, quantity, assetType = 'stock' as 'stock' | 'crypto' }: { symbol: string; quantity: string; assetType?: 'stock' | 'crypto'; }): Promise<TradeResult> => {
    await ensureDb();
    const user = await getSessionUser();

    const normalizedSymbol = symbol.toUpperCase();
    const qty = new Decimal(quantity);
    if (qty.lte(0)) return { success: false, message: 'Quantity must be greater than zero' };

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const holding = await Holding.findOne({ userId: user.id, symbol: normalizedSymbol }).session(session);
        if (!holding) {
            await session.abortTransaction();
            return { success: false, message: 'No position to sell' };
        }

        const currentQty = decimalFrom(holding.quantity);
        if (currentQty.lt(qty)) {
            await session.abortTransaction();
            return { success: false, message: 'Sell quantity exceeds holdings' };
        }

        const price = await fetchLivePrice(normalizedSymbol, assetType);
        const totalProceeds = price.mul(qty);

        // Find user by email for reliable lookup with Better Auth
        const userDoc = await User.findOne({ email: user.email }).session(session);
        if (!userDoc) throw new Error('User not found');

        // Default to 100000 if virtualBalance is not set
        const rawBalance = userDoc.virtualBalance;
        const balance = rawBalance ? decimalFrom(rawBalance) : new Decimal(100000);
        const newBalance = balance.plus(totalProceeds);
        userDoc.virtualBalance = toDecimal128(newBalance) as any;
        await userDoc.save({ session });

        const remainingQty = currentQty.minus(qty);
        if (remainingQty.lte(0)) {
            await Holding.deleteOne({ _id: holding._id }).session(session);
        } else {
            holding.quantity = toDecimal128(remainingQty) as any;
            await holding.save({ session });
        }

        await Transaction.create([{
            userId: user.id,
            symbol: normalizedSymbol,
            assetType,
            side: 'SELL',
            quantity: toDecimal128(qty) as any,
            price: toDecimal128(price) as any,
            total: toDecimal128(totalProceeds) as any,
        }], { session });

        await session.commitTransaction();
        session.endSession();

        revalidatePath('/watchlist');
        revalidatePath('/trade');

        return { success: true, message: 'Sale completed', balance: newBalance.toFixed(2) };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('sellAsset error:', error);
        return { success: false, message: 'Failed to complete sale' };
    }
};

export const getPortfolioSnapshot = async () => {
    await ensureDb();
    const user = await getSessionUser();

    const holdings = await Holding.find({ userId: user.id }).lean();
    // Find user by email for more reliable lookup with Better Auth
    const userDoc = await User.findOne({ email: user.email }).lean();

    // Default to 100000 if user has no virtualBalance set yet
    const rawBalance = userDoc?.virtualBalance;
    const cash = rawBalance ? decimalFrom(rawBalance) : new Decimal(100000);

    const enriched = await Promise.all(
        holdings.map(async (h) => {
            const price = await fetchLivePrice(h.symbol, h.assetType as 'stock' | 'crypto').catch(() => new Decimal(0));
            const qty = decimalFrom(h.quantity);
            const positionValue = price.mul(qty);
            return {
                symbol: h.symbol,
                assetType: h.assetType,
                quantity: qty.toFixed(8),
                averageCost: decimalFrom(h.averageCost).toFixed(8),
                price: price.toFixed(2),
                value: positionValue.toFixed(2),
            };
        })
    );

    const holdingsValue = enriched.reduce((acc, item) => acc.plus(item.value || 0), new Decimal(0));
    const portfolioValue = cash.plus(holdingsValue);

    return {
        cash: cash.toFixed(2),
        holdingsValue: holdingsValue.toFixed(2),
        portfolioValue: portfolioValue.toFixed(2),
        positions: enriched,
    };
};

export const getRecentTransactions = async (limit = 20) => {
    await ensureDb();
    const user = await getSessionUser();
    const txs = await Transaction.find({ userId: user.id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    return txs.map((t) => ({
        symbol: t.symbol,
        assetType: t.assetType,
        side: t.side,
        quantity: decimalFrom(t.quantity).toFixed(8),
        price: decimalFrom(t.price).toFixed(2),
        total: decimalFrom(t.total).toFixed(2),
        createdAt: t.createdAt,
    }));
};
