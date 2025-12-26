import mongoose, { Schema, models, Document } from 'mongoose';

export interface INotificationPreferences extends Document {
    userId: string;
    emailEnabled: boolean;
    inAppEnabled: boolean;
    quietHoursEnabled: boolean;
    quietStart: string;
    quietEnd: string;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationPreferencesSchema = new Schema<INotificationPreferences>(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        emailEnabled: {
            type: Boolean,
            default: true,
        },
        inAppEnabled: {
            type: Boolean,
            default: true,
        },
        quietHoursEnabled: {
            type: Boolean,
            default: false,
        },
        quietStart: {
            type: String,
            default: '22:00',
        },
        quietEnd: {
            type: String,
            default: '07:00',
        },
    },
    {
        timestamps: true,
    }
);

const NotificationPreferences =
    models?.NotificationPreferences ||
    mongoose.model<INotificationPreferences>('NotificationPreferences', NotificationPreferencesSchema);

export default NotificationPreferences;

