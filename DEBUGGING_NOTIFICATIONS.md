# 🔍 Debugging Steps - Notifications Not Showing

## Current Situation
- ✅ Inngest job `daily-news-summary` is running (completed successfully)
- ❌ You're not receiving emails
- ❌ You're not seeing notifications in inbox

## Immediate Action Steps

### Step 1: Check Diagnostics Page
**Navigate to: `/notifications/diagnostics`**

This will show you:
- Your user ID and email
- How many notifications exist in database
- Your current preferences
- Recent notifications with their status

**What to look for:**
- If "Total" count is **0** → Notifications aren't being created at all
- If "Delivered" count is **0** but "Total" > 0 → Notifications exist but not marked as delivered
- Check if "In-App Enabled" is ✓ (should be green checkmark)
- Check if "Quiet Hours" is active (might be blocking delivery)

### Step 2: Check Server Logs
Look at your application logs (terminal/console where your Next.js server is running) for:

```
📊 Daily News Summary - Users Found: { count: X, users: [...] }
```
- If count is 0, no users are being found

```
📰 Fetched X articles for user@email.com
```
- If X is 0, no news articles are being fetched

```
🤖 Summarizing X articles for user@email.com
```
- Check if AI summarization is working

```
✅ Notification created: { notificationId: '...', userId: '...', ... }
```
- This confirms notification was created in database

```
✉️  Email sent to user@email.com
```
- This confirms email was sent

### Step 3: Check Inngest Dashboard
In the Inngest UI (screenshot you showed):
1. Click on the completed `daily-news-summary` run
2. Look at the **Output** tab
3. Check for:
   - `results` array with delivery status
   - Any error messages
   - Success/failure for each user

### Step 4: Common Issues & Quick Fixes

#### Issue A: No Users Found
**Symptoms:** Logs show `count: 0`

**Fix:** 
- Check if your user exists in MongoDB `user` collection
- Verify user has both `email` and `name` fields
- Run this MongoDB query:
  ```javascript
  db.user.find({ email: { $exists: true, $ne: null } })
  ```

#### Issue B: No News Articles
**Symptoms:** Logs show `Fetched 0 articles`

**Fix:**
- Check Finnhub API key is configured
- Verify API quota isn't exceeded
- Test Finnhub API manually

#### Issue C: AI Summarization Failing
**Symptoms:** Logs show `❌ Failed to summarize`

**Fix:**
- Check OpenAI API key is configured (`OPENAI_API_KEY` in .env)
- Verify API quota isn't exceeded
- Check for rate limiting errors

#### Issue D: User ID Mismatch
**Symptoms:** Notifications created but not showing in inbox

**Fix:**
1. Go to `/notifications/diagnostics`
2. Note your User ID
3. Check MongoDB:
   ```javascript
   db.notifications.find({ userId: "YOUR_USER_ID_HERE" })
   ```
4. If no results, the userId field doesn't match

#### Issue E: Preferences Not Found
**Symptoms:** Diagnostics shows "No preferences found"

**Fix:**
- Go to `/notifications` → Preferences tab
- Toggle any setting and click "Save Preferences"
- This will create default preferences
- Refresh diagnostics page

#### Issue F: Quiet Hours Active
**Symptoms:** Notifications exist but status is "PENDING"

**Fix:**
- Go to `/notifications` → Preferences tab
- Disable "Quiet Hours" 
- Click "Save Preferences"
- Wait 10 minutes for `deliverPendingNotifications` job to run

### Step 5: Force Next Run
To test immediately without waiting 6 minutes:

**Option A: Manual Trigger (if Inngest supports it)**
- Go to Inngest dashboard
- Find `daily-news-summary` function
- Click "Trigger" or "Test" button

**Option B: Restart Server**
- Stop your Next.js server
- Start it again
- This might trigger jobs on startup

**Option C: Wait for Cron**
- Next run will be in max 6 minutes
- Check timestamp in Inngest dashboard

## Expected Behavior After Fix

When everything works correctly, you should see in logs:

```
📊 Daily News Summary - Users Found: { count: 1, users: [{...}] }
📰 Fetched 6 articles for your@email.com
🤖 Summarizing 6 articles for your@email.com
✅ Summary generated for your@email.com (2500 chars)
📤 Delivering to your@email.com (userId: abc123)
✅ Notification created: { notificationId: '...', status: 'DELIVERED', ... }
📬 Notification result for your@email.com: { success: true, ... }
✉️  Email sent to your@email.com
📊 Final Summary: [{ email: 'your@email.com', success: true, emailSent: true, notificationCreated: true }]
```

## Quick Verification Checklist

After waiting for next job run:

- [ ] Check server logs for "Notification created" message
- [ ] Visit `/notifications/diagnostics` - see Total count increase
- [ ] Visit `/notifications` - see notification in Inbox tab
- [ ] Check email inbox for email (including spam folder)
- [ ] Verify notification content matches email content

## MongoDB Queries for Manual Checking

```javascript
// Check if your user exists
db.user.findOne({ email: "your-email@example.com" })

// Check notifications for your user (use ID from above)
db.notifications.find({ userId: "your-user-id-here" }).sort({ createdAt: -1 })

// Check preferences for your user
db.notificationpreferences.findOne({ userId: "your-user-id-here" })

// Count all notifications
db.notifications.countDocuments()

// Check latest notification
db.notifications.find().sort({ createdAt: -1 }).limit(1)
```

## Still Not Working?

If after all these steps notifications still aren't appearing:

1. **Share the following with support:**
   - Screenshot of `/notifications/diagnostics` page
   - Server logs from last news job run
   - Inngest output/logs from completed run
   - Your user ID from diagnostics page

2. **Temporary workaround:**
   - You're still getting emails (if email is configured)
   - Notifications will work once issue is identified

3. **Nuclear option (last resort):**
   ```bash
   # Clear all notifications and preferences
   db.notifications.deleteMany({})
   db.notificationpreferences.deleteMany({})
   # Then restart server and wait for next run
   ```

---

**Created:** December 26, 2025
**Next Update:** After checking diagnostics page results

