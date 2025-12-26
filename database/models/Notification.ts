import mongoose, { Schema, models, Document } from 'mongoose';

export interface INotification extends Document {
    userId: string;
    type: 'DAILY_NEWS_SUMMARY' | 'PRICE_ALERT' | 'SYSTEM';
    title: string;
    content: string;
    status: 'PENDING' | 'DELIVERED';
    deliverAfter: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['DAILY_NEWS_SUMMARY', 'PRICE_ALERT', 'SYSTEM'],
        },
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['PENDING', 'DELIVERED'],
            default: 'DELIVERED',
        },
        deliverAfter: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient querying
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, deliverAfter: 1 });

const Notification =
    models?.Notification ||
    mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;

