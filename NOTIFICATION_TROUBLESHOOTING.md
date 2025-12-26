# Notification Center Troubleshooting Guide

## Issue: Notifications Not Appearing in Inbox

### Problem Description
User receives emails from the daily news summary but the Notification Center inbox shows "No notifications yet".

### Root Cause
The issue was caused by:
1. **Incorrect logic in `createNotification` function**: When no preferences existed (new users), the default behavior was NOT creating notifications
2. **Missing default preference creation**: New users didn't have preferences automatically created
3. **Inngest function not updated**: The daily news summary was still using old email-only logic

### Fixes Applied

#### 1. Fixed `createNotification` Function
**File**: `lib/actions/notification.actions.ts`

**Changes**:
- ✅ Now automatically creates default preferences for new users
- ✅ Fixed logic: `inAppEnabled` now defaults to `true` if not explicitly set to `false`
- ✅ Always creates notification if in quiet hours (PENDING status) OR if in-app is enabled
- ✅ Added detailed console logging for debugging

**Key Logic**:
```typescript
// Create defaults if no preferences exist
if (!preferences) {
    preferences = await NotificationPreferences.create({
        userId: data.userId,
        emailEnabled: true,
        inAppEnabled: true,
        quietHoursEnabled: false,
        quietStart: '22:00',
        quietEnd: '07:00',
    });
}

// Default to true if not explicitly disabled
const inAppEnabled = preferences?.inAppEnabled !== false;
const shouldCreateNotification = status === 'PENDING' || inAppEnabled;
```

#### 2. Updated Daily News Summary Function
**File**: `lib/inngest/functions.ts`

**Changes**:
- ✅ Now calls `createNotification()` for each user
- ✅ Respects user preferences (email/in-app)
- ✅ Handles quiet hours properly
- ✅ Only sends email if `shouldSendEmail` is true

**Before**:
```typescript
// Old: Only sent emails
await sendNewsSummaryEmail({ email: user.email, date, newsContent })
```

**After**:
```typescript
// New: Creates notification + sends email based on preferences
const result = await createNotification({
    userId: user.userId,
    type: 'DAILY_NEWS_SUMMARY',
    title: `Market News Summary - ${getFormattedTodayDate()}`,
    content: newsContent,
});

if (result.success && result.data?.shouldSendEmail) {
    await sendNewsSummaryEmail({ email, date, newsContent });
}
```

#### 3. Added Debug Logging
Both functions now include detailed console logs:
- ✅ Notification creation: Shows success/failure with details
- ✅ Notification fetching: Shows user ID and count retrieved
- ✅ Helps identify issues in production

### How to Verify the Fix

#### Step 1: Check Console Logs
When the daily news job runs, you should see:
```
✅ Notification created: {
  notificationId: '...',
  userId: '...',
  type: 'DAILY_NEWS_SUMMARY',
  status: 'DELIVERED',
  inAppEnabled: true,
  emailEnabled: true
}
```

#### Step 2: Check Notification Center
1. Navigate to `/notifications`
2. Go to Inbox tab
3. You should now see your notifications with:
   - Title: "Market News Summary - [Date]"
   - Content: AI-summarized news (HTML formatted)
   - Icon: Newspaper icon
   - Timestamp: "X minutes/hours ago"

#### Step 3: Check Database
You can verify notifications were created in MongoDB:
```javascript
// Query the notifications collection
db.notifications.find({ userId: "<your-user-id>" })

// Should return documents like:
{
  _id: ObjectId("..."),
  userId: "...",
  type: "DAILY_NEWS_SUMMARY",
  title: "Market News Summary - ...",
  content: "<html content>",
  status: "DELIVERED",
  deliverAfter: null,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### Common Issues & Solutions

#### Issue: Still seeing empty inbox after fix
**Solution**:
1. Clear your browser cache
2. Wait for the next news cycle (6 minutes)
3. Check console logs for errors
4. Verify you're logged in with the correct user

#### Issue: Notifications created but marked as PENDING
**Solution**:
- You have quiet hours enabled and current time is within that range
- Wait for the `deliverPendingNotifications` job to run (every 10 minutes)
- Or disable quiet hours in Preferences tab

#### Issue: Getting emails but inAppEnabled is false
**Solution**:
1. Go to `/notifications`
2. Click Preferences tab
3. Toggle "In-App Notifications" ON
4. Click "Save Preferences"

### Testing Checklist

After deploying the fix:
- [ ] Wait for daily news job to run (every 6 minutes)
- [ ] Check server console for notification creation logs
- [ ] Navigate to `/notifications`
- [ ] Verify notifications appear in Inbox
- [ ] Verify notification content matches email content
- [ ] Test preferences toggle (disable/enable in-app)
- [ ] Test quiet hours functionality
- [ ] Verify new notifications continue to appear

### Database Queries for Debugging

```javascript
// Count total notifications
db.notifications.countDocuments()

// Count per user
db.notifications.countDocuments({ userId: "USER_ID_HERE" })

// Find pending notifications
db.notifications.find({ status: "PENDING" })

// Find delivered notifications
db.notifications.find({ status: "DELIVERED" }).sort({ createdAt: -1 })

// Check notification preferences
db.notificationpreferences.find()

// Find preferences for specific user
db.notificationpreferences.findOne({ userId: "USER_ID_HERE" })
```

### Next Steps

1. **Monitor logs** after next news cycle runs
2. **Verify notifications** appear in inbox for all users
3. **Test edge cases**:
   - New user signup → should get default preferences
   - Quiet hours enabled → notifications should queue
   - In-app disabled → no notifications in inbox
   - Email disabled → no emails sent

### Support Information

If issues persist:
1. Check Inngest dashboard for job execution status
2. Verify MongoDB connection is working
3. Check that user IDs match between:
   - Better Auth `user.id`
   - Notification `userId`
   - NotificationPreferences `userId`
4. Review server logs for error messages

---

**Last Updated**: December 26, 2025
**Status**: ✅ Fixed and Deployed

