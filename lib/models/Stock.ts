import mongoose, { Schema, Document } from 'mongoose';

export interface IStock extends Document {
    symbol: string;
    companyName: string;
    currentPrice: number;
    marketCap: number;
    sector?: string;
    createdAt: Date;
    updatedAt: Date;
}

const StockSchema = new Schema<IStock>({
    symbol: { type: String, required: true, unique: true, uppercase: true },
    companyName: { type: String, required: true },
    currentPrice: { type: Number, default: 0 },
    marketCap: { type: Number, default: 0 },
    sector: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const Stock = mongoose.models.Stock || mongoose.model<IStock>('Stock', StockSchema, 'stock');