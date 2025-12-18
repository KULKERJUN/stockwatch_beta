import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/database/mongoose';
import { Stock } from '@/lib/models/Stock';

// GET - Fetch all stocks OR single stock by query parameter
export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');
        const sector = searchParams.get('sector');

        if (symbol) {
            const stock = await Stock.findOne({
                symbol: symbol.toUpperCase()
            });

            if (!stock) {
                return NextResponse.json({
                    success: false,
                    error: `Stock with symbol '${symbol.toUpperCase()}' not found`
                }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                data: stock
            }, { status: 200 });
        }

        if (sector) {
            const stocks = await Stock.find({ sector }).sort({ symbol: 1 });

            return NextResponse.json({
                success: true,
                count: stocks.length,
                data: stocks
            }, { status: 200 });
        }

        const stocks = await Stock.find({}).sort({ symbol: 1 });

        return NextResponse.json({
            success: true,
            count: stocks.length,
            data: stocks
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching stocks:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch stocks'
        }, { status: 500 });
    }
}

// POST - Add new stock
export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const { symbol, companyName, currentPrice, marketCap, sector } = body;

        if (!symbol || !companyName) {
            return NextResponse.json({
                success: false,
                error: 'Symbol and company name are required'
            }, { status: 400 });
        }

        const existingStock = await Stock.findOne({ symbol: symbol.toUpperCase() });
        if (existingStock) {
            return NextResponse.json({
                success: false,
                error: 'Stock with this symbol already exists'
            }, { status: 400 });
        }

        const newStock = await Stock.create({
            symbol: symbol.toUpperCase(),
            companyName,
            currentPrice: currentPrice || 0,
            marketCap: marketCap || 0,
            sector: sector || 'Technology'
        });

        return NextResponse.json({
            success: true,
            message: 'Stock added successfully',
            data: newStock
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating stock:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to add stock'
        }, { status: 500 });
    }
}

// PATCH - Update stock by query parameter
export async function PATCH(request: NextRequest) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');
        const body = await request.json();

        if (!symbol) {
            return NextResponse.json({
                success: false,
                error: 'Symbol query parameter is required'
            }, { status: 400 });
        }

        body.updatedAt = new Date();

        const updatedStock = await Stock.findOneAndUpdate(
            { symbol: symbol.toUpperCase() },
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!updatedStock) {
            return NextResponse.json({
                success: false,
                error: `Stock with symbol '${symbol.toUpperCase()}' not found`
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Stock updated successfully',
            data: updatedStock
        }, { status: 200 });
    } catch (error) {
        console.error('Error updating stock:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update stock'
        }, { status: 500 });
    }
}

// PUT - Replace stock by query parameter
export async function PUT(request: NextRequest) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');
        const body = await request.json();
        const { symbol: newSymbol, companyName, currentPrice, marketCap, sector } = body;

        if (!symbol) {
            return NextResponse.json({
                success: false,
                error: 'Symbol query parameter is required'
            }, { status: 400 });
        }

        if (!newSymbol || !companyName) {
            return NextResponse.json({
                success: false,
                error: 'Symbol and company name are required in body'
            }, { status: 400 });
        }

        const updatedStock = await Stock.findOneAndUpdate(
            { symbol: symbol.toUpperCase() },
            {
                symbol: newSymbol.toUpperCase(),
                companyName,
                currentPrice: currentPrice || 0,
                marketCap: marketCap || 0,
                sector: sector || 'Technology',
                updatedAt: new Date()
            },
            { new: true, overwrite: true, runValidators: true }
        );

        if (!updatedStock) {
            return NextResponse.json({
                success: false,
                error: `Stock with symbol '${symbol.toUpperCase()}' not found`
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Stock replaced successfully',
            data: updatedStock
        }, { status: 200 });
    } catch (error) {
        console.error('Error replacing stock:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to replace stock'
        }, { status: 500 });
    }
}

// DELETE - Remove stock by symbol in request body
export async function DELETE(request: NextRequest) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const { symbol } = body;

        if (!symbol) {
            return NextResponse.json({
                success: false,
                error: 'Symbol is required in request body'
            }, { status: 400 });
        }

        const upperSymbol = symbol.toUpperCase();
        const deletedStock = await Stock.findOneAndDelete({
            symbol: upperSymbol
        });

        if (!deletedStock) {
            return NextResponse.json({
                success: false,
                error: `Stock with symbol '${upperSymbol}' not found`
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Stock deleted successfully',
            data: {
                symbol: deletedStock.symbol,
                companyName: deletedStock.companyName
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Error deleting stock:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to delete stock'
        }, { status: 500 });
    }
}