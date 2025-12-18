import mongoose, { Schema, models, model } from 'mongoose';

export interface IPriceAlert {
    _id?: string;
    userId: string;
    symbol: string;
    targetPrice: number;
    condition: 'ABOVE' | 'BELOW';
    status: 'ACTIVE' | 'TRIGGERED' | 'DISABLED';
    notified: boolean;
    triggeredAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const PriceAlertSchema = new Schema<IPriceAlert>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        symbol: {
            type: String,
            required: true,
            uppercase: true,
            index: true,
        },
        targetPrice: {
            type: Number,
            required: true,
        },
        condition: {
            type: String,
            enum: ['ABOVE', 'BELOW'],
            required: true,
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'TRIGGERED', 'DISABLED'],
            default: 'ACTIVE',
            index: true,
        },
        notified: {
            type: Boolean,
            default: false,
        },
        triggeredAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient searching of active alerts by status
PriceAlertSchema.index({ status: 1, symbol: 1 });

const PriceAlert = models.PriceAlert || model<IPriceAlert>('PriceAlert', PriceAlertSchema);

export default PriceAlert;

