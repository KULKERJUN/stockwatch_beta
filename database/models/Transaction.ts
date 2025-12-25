import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
    userId: string;
    symbol: string;
    assetType: 'stock' | 'crypto';
    side: 'BUY' | 'SELL';
    quantity: mongoose.Types.Decimal128;
    price: mongoose.Types.Decimal128; // execution price per unit
    total: mongoose.Types.Decimal128; // quantity * price
    createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        userId: { type: String, required: true, index: true },
        symbol: { type: String, required: true },
        assetType: { type: String, enum: ['stock', 'crypto'], default: 'stock', index: true },
        side: { type: String, enum: ['BUY', 'SELL'], required: true },
        quantity: { type: Schema.Types.Decimal128, required: true },
        price: { type: Schema.Types.Decimal128, required: true },
        total: { type: Schema.Types.Decimal128, required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

TransactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

