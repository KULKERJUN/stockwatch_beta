# 📧 Email Delivery Troubleshooting Guide

## ✅ Current Status
- **Notifications**: ✅ Working perfectly (appearing in notification center)
- **Emails**: ❌ Not being received (despite logs showing "Email sent")

## Problem Analysis

Based on your logs:
```
✉️  Email sent to ahnafiqbal15@gmail.com
```

The system **thinks** it's sending emails, but you're not receiving them. This is a common issue with several possible causes.

## 🔍 Enhanced Logging Deployed

I've added comprehensive logging to the email sending function. On the next news cycle (in ~6 minutes), check your server logs for:

### What to Look For:

**If email credentials are missing:**
```
📧 SMTP Config: {
  service: 'gmail',
  user: '✗ Missing',    // ← Problem!
  pass: '✗ Missing'     // ← Problem!
}
```

**If email send succeeds:**
```
✅ Email sent successfully: {
  messageId: '<some-id@gmail.com>',
  to: 'ahnafiqbal15@gmail.com',
  response: '250 Message accepted',
  accepted: ['ahnafiqbal15@gmail.com'],
  rejected: []
}
```

**If email send fails:**
```
❌ Failed to send email: {
  to: 'ahnafiqbal15@gmail.com',
  error: 'Invalid login: 535-5.7.8 Username and Password not accepted',
  code: 'EAUTH',
  ...
}
```

## Common Causes & Solutions

### 1. Missing or Invalid Environment Variables

**Check your `.env.local` file:**
```bash
NODEMAILER_EMAIL=your-gmail@gmail.com
NODEMAILER_PASSWORD=your-app-password-here
```

**Important Notes:**
- ❌ **Don't use your regular Gmail password**
- ✅ **Use a Gmail App Password** (16-character code)

**How to Create Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication (required)
3. Go to https://myaccount.google.com/apppasswords
4. Create new app password for "Mail"
5. Copy the 16-character password (no spaces)
6. Use this in your `.env.local` as `NODEMAILER_PASSWORD`

### 2. Gmail Security Blocking

**Symptoms:**
- Logs show "Invalid login" or "Username and Password not accepted"
- Error code: `EAUTH`

**Solutions:**
- Use App Password (see above)
- Check if 2FA is enabled
- Try "Less secure app access" (not recommended, use App Password instead)
- Check Gmail settings for blocked sign-in attempts

### 3. Emails Going to Spam

**Check:**
1. Gmail Spam folder
2. Gmail Promotions tab
3. Gmail Social tab
4. Search your inbox for "StockWatch"

**If found in spam:**
- Mark as "Not Spam"
- Add sender to contacts
- Create filter to always deliver to inbox

### 4. Rate Limiting

**Gmail limits:**
- 500 emails per day (for free accounts)
- 100 recipients per email
- Rate limiting if sending too fast

**Check logs for:**
```
❌ Failed to send email: {
  error: '421 Service not available - try again later',
  responseCode: 421
}
```

**Solution:**
- Wait and try again
- Reduce send frequency if hitting limits

### 5. SMTP Connection Issues

**Symptoms:**
- Timeout errors
- Connection refused
- DNS resolution failures

**Check logs for:**
```
❌ Failed to send email: {
  error: 'connect ETIMEDOUT',
  code: 'ETIMEDOUT'
}
```

**Solutions:**
- Check internet connection
- Check firewall settings
- Try different network
- Verify Gmail SMTP is accessible

## 🔧 Immediate Actions

### Action 1: Check Environment Variables
Open your `.env.local` file and verify:
```bash
# Should look like this:
NODEMAILER_EMAIL=your-email@gmail.com
NODEMAILER_PASSWORD=abcd efgh ijkl mnop  # 16-char app password
```

### Action 2: Verify Gmail App Password
1. Go to https://myaccount.google.com/apppasswords
2. Check if you have an app password created
3. If not, create one
4. If yes, try generating a new one
5. Update `.env.local` with new password
6. Restart your server

### Action 3: Test Email Manually
Create a simple test endpoint to verify email works:

```typescript
// Add to app/api/test-email/route.ts
import { sendNewsSummaryEmail } from '@/lib/nodemailer';

export async function GET() {
  try {
    await sendNewsSummaryEmail({
      email: 'ahnafiqbal15@gmail.com',
      date: 'Test Date',
      newsContent: '<p>This is a test email</p>'
    });
    return Response.json({ success: true, message: 'Email sent' });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

Then visit: `http://localhost:3000/api/test-email`

### Action 4: Wait for Next News Cycle
- Wait ~6 minutes for next job
- Check server logs for the new detailed output
- Look for specific error messages
- Share the logs if email still fails

## 📊 What Your Logs Should Show Next Time

**If credentials are set correctly:**
```
📧 Attempting to send email to: ahnafiqbal15@gmail.com
📧 SMTP Config: {
  service: 'gmail',
  user: '✓ Set',
  pass: '✓ Set'
}
✅ Email sent successfully: {
  messageId: '<...>',
  to: 'ahnafiqbal15@gmail.com',
  response: '250 2.0.0 OK ...',
  accepted: ['ahnafiqbal15@gmail.com'],
  rejected: []
}
```

**If credentials are missing:**
```
📧 SMTP Config: {
  service: 'gmail',
  user: '✗ Missing',
  pass: '✗ Missing'
}
❌ Failed to send email: {
  error: 'Missing credentials'
}
```

## 🎯 Most Likely Issue

Based on typical setups, the most common issue is:

**Using regular Gmail password instead of App Password**

### Quick Fix:
1. Go to https://myaccount.google.com/apppasswords
2. Create new app password
3. Update `.env.local`:
   ```
   NODEMAILER_PASSWORD=xxxx xxxx xxxx xxxx
   ```
4. Restart server
5. Wait for next news cycle

## 📝 Checklist

Before next news cycle:
- [ ] Verify `.env.local` exists and has email credentials
- [ ] Verify using Gmail App Password (not regular password)
- [ ] Verify 2FA is enabled on Gmail account
- [ ] Check spam/promotions folders
- [ ] Restart server after any `.env.local` changes
- [ ] Keep an eye on server logs during next run

## 🆘 Still Not Working?

If after checking all the above, emails still don't arrive:

1. **Copy your next server logs** showing:
   - `📧 SMTP Config` output
   - `✅ Email sent successfully` OR `❌ Failed to send email` output

2. **Check if you see any of these error codes:**
   - `EAUTH` - Authentication failed
   - `ETIMEDOUT` - Connection timeout
   - `ECONNREFUSED` - Connection refused
   - `535` - Authentication error
   - `421` - Rate limited

3. **Share the specific error** and I'll help troubleshoot further

## ✅ Good News!

Your notification system is working perfectly! You're already getting notifications in your notification center, which is the primary feature. Email is just a secondary delivery method.

If email setup is too complicated right now, you can always:
- Use the notification center (working perfectly!)
- Set up email later when needed
- Consider alternative email providers (SendGrid, Mailgun, etc.)

---

**Status**: Notifications ✅ | Emails ⏳ (troubleshooting)
**Next Step**: Check logs after next news cycle with enhanced logging

