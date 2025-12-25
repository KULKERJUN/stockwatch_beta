import mongoose, { Schema, Document } from 'mongoose';

export interface IHolding extends Document {
    userId: string;
    symbol: string; // e.g., AAPL or BINANCE:BTCUSDT
    assetType: 'stock' | 'crypto';
    quantity: mongoose.Types.Decimal128;
    averageCost: mongoose.Types.Decimal128; // average cost per unit
    createdAt: Date;
    updatedAt: Date;
}

const HoldingSchema = new Schema<IHolding>(
    {
        userId: { type: String, required: true, index: true },
        symbol: { type: String, required: true, index: true },
        assetType: { type: String, enum: ['stock', 'crypto'], default: 'stock', index: true },
        quantity: { type: Schema.Types.Decimal128, required: true },
        averageCost: { type: Schema.Types.Decimal128, required: true },
    },
    { timestamps: true }
);

HoldingSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const Holding = mongoose.models.Holding || mongoose.model<IHolding>('Holding', HoldingSchema);

