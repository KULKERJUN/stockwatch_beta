import {inngest} from "@/lib/inngest/client";
import { NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT } from "@/lib/inngest/prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail, sendPriceAlertEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";
import { connectToDatabase } from "@/database/mongoose";
import PriceAlert from "@/database/models/PriceAlert";
import UserProfile from "@/database/models/UserProfile";
import Notification from "@/database/models/Notification";
import { getMultipleStockPrices } from "@/lib/actions/stock.actions";
import { createNotification, getNotificationPreferencesByUserId } from "@/lib/actions/notification.actions";
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const sendSignUpEmail = inngest.createFunction(
    { id: 'sign-up-email' },
    { event: 'app/user.created'},
    async ({ event, step }) => {
        const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile)

        const introText = await step.run('generate-welcome-intro', async () => {
            try {
                const { text } = await generateText({
                    model: openai('gpt-4o-mini'),
                    prompt: prompt,
                });
                return text;
            } catch (error) {
                console.error('Error generating welcome intro:', error);
                return 'Thanks for joining StockWatch. You now have the tools to track markets and make smarter moves.';
            }
        });

        await step.run('send-welcome-email', async () => {

            const {data : {email, name}} = event;
            return await sendWelcomeEmail({email, name, intro: introText});
        })

        return {
            success: true,
            message: 'Welcome email sent successfully'
        }
    }
)


export const sendDailyNewsSummary = inngest.createFunction(
    { id: 'daily-news-summary' },
    [ { event: 'app/send.daily.news' }, { cron: '*/6 * * * *' } ],
    async ({ step }) => {
        // Step #1: Get all users for news delivery
        const users = await step.run('get-all-users', async () => {
            const allUsers = await getAllUsersForNewsEmail();
            console.log('📊 Daily News Summary - Users Found:', {
                count: allUsers.length,
                users: allUsers.map(u => ({ id: u.id, userId: u.userId, email: u.email }))
            });
            return allUsers;
        });

        if(!users || users.length === 0) {
            console.log('⚠️  No users found for news email');
            return { success: false, message: 'No users found for news email' };
        }

        console.log(`✅ Processing news for ${users.length} user(s)`);

        // Step #2: For each user, get watchlist symbols -> fetch news (fallback to general)
        const results = await step.run('fetch-user-news', async () => {
            const perUser: Array<{ user: UserForNewsEmail; articles: MarketNewsArticle[] }> = [];
            for (const user of users as UserForNewsEmail[]) {
                try {
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    let articles = await getNews(symbols);
                    // Enforce max 6 articles per user
                    articles = (articles || []).slice(0, 6);
                    // If still empty, fallback to general
                    if (!articles || articles.length === 0) {
                        articles = await getNews();
                        articles = (articles || []).slice(0, 6);
                    }
                    console.log(`📰 Fetched ${articles.length} articles for ${user.email}`);
                    perUser.push({ user, articles });
                } catch (e) {
                    console.error('daily-news: error preparing user news', user.email, e);
                    perUser.push({ user, articles: [] });
                }
            }
            return perUser;
        });

        // Step #3: Summarize news via AI using OpenAI
        const userNewsSummaries: { user: UserForNewsEmail; newsContent: string | null }[] = [];

        for (const { user, articles } of results) {
            const newsContent = await step.run(`summarize-news-${user.email}`, async () => {
                try {
                    console.log(`🤖 Summarizing ${articles.length} articles for ${user.email}`);
                    const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', JSON.stringify(articles, null, 2));

                    const { text } = await generateText({
                        model: openai('gpt-4o-mini'),
                        prompt: prompt,
                    });

                    const summary = text || 'No market news.';
                    console.log(`✅ Summary generated for ${user.email} (${summary.length} chars)`);
                    return summary;
                } catch (error) {
                    console.error('❌ Failed to summarize news for:', user.email, error);
                    return null;
                }
            });

            userNewsSummaries.push({ user, newsContent });
        }

        // Step #4: Create notifications and send emails based on preferences
        const deliveryResults = await step.run('deliver-notifications', async () => {
            const results = await Promise.all(
                userNewsSummaries.map(async ({ user, newsContent}) => {
                    if(!newsContent) {
                        console.log(`⚠️  No content for ${user.email}, skipping`);
                        return { email: user.email, success: false, reason: 'No content' };
                    }

                    try {
                        console.log(`📤 Delivering to ${user.email} (userId: ${user.userId})`);

                        // Create notification (handles quiet hours internally)
                        const result = await createNotification({
                            userId: user.userId,
                            type: 'DAILY_NEWS_SUMMARY',
                            title: `Market News Summary - ${getFormattedTodayDate()}`,
                            content: newsContent,
                        });

                        console.log(`📬 Notification result for ${user.email}:`, result);

                        // Send email if preferences allow and not in quiet hours
                        if (result.success && result.data?.shouldSendEmail) {
                            await sendNewsSummaryEmail({
                                email: user.email,
                                date: getFormattedTodayDate(),
                                newsContent
                            });
                            console.log(`✉️  Email sent to ${user.email}`);
                            return { email: user.email, success: true, emailSent: true, notificationCreated: true };
                        }

                        return {
                            email: user.email,
                            success: true,
                            emailSent: false,
                            notificationCreated: result.success,
                            reason: result.data?.isPending ? 'Quiet hours - pending' : 'Email disabled'
                        };
                    } catch (error) {
                        console.error('❌ Error delivering notification to:', user.email, error);
                        return { email: user.email, success: false, error: String(error) };
                    }
                })
            );
            return results;
        });

        console.log('📊 Final Summary:', deliveryResults);

        return {
            success: true,
            message: 'Daily news summary notifications processed successfully',
            results: deliveryResults
        };
    }
)

export const checkPriceAlerts = inngest.createFunction(
    { id: 'check-price-alerts' },
    { cron: '*/5 * * * *' }, // Run every 5 minutes
    async ({ step }) => {
        const alertsToProcess = await step.run('fetch-active-alerts', async () => {
            await connectToDatabase();
            return await PriceAlert.find({ status: 'ACTIVE' }).lean();
        });

        if (alertsToProcess.length === 0) {
            return { message: 'No active alerts to check' };
        }

        const symbols = [...new Set(alertsToProcess.map((a: any) => a.symbol))];
        const prices = await step.run('fetch-current-prices', async () => {
            return await getMultipleStockPrices(symbols);
        });

        const results = [];

        for (const alert of alertsToProcess) {
            const currentPrice = prices[alert.symbol];
            if (!currentPrice) continue;

            const isTriggered = 
                (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) ||
                (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice);

            if (isTriggered) {
                console.log(`Alert triggered for ${alert.symbol}: Current Price ${currentPrice}, Target ${alert.targetPrice} (${alert.condition})`);
                await step.run(`trigger-alert-${alert._id}`, async () => {
                    await connectToDatabase();
                    
                    // Mark as triggered first to avoid double processing
                    await PriceAlert.findByIdAndUpdate(alert._id, {
                        status: 'TRIGGERED',
                        triggeredAt: new Date(),
                    });

                    // Get user email
                    const profile = await UserProfile.findOne({ userId: alert.userId }).lean();
                    if (profile?.email) {
                        await sendPriceAlertEmail({
                            email: profile.email,
                            symbol: alert.symbol,
                            company: alert.symbol,
                            currentPrice,
                            targetPrice: alert.targetPrice,
                            condition: alert.condition,
                        });
                    }
                    
                    return { alertId: alert._id, symbol: alert.symbol, triggered: true };
                });
                results.push({ alertId: alert._id, symbol: alert.symbol, triggered: true });
            }
        }

        return { 
            message: `Processed ${alertsToProcess.length} alerts`, 
            triggeredCount: results.length 
        };
    }
);

export const deliverPendingNotifications = inngest.createFunction(
    { id: 'deliver-pending-notifications' },
    { cron: '*/10 * * * *' }, // Run every 10 minutes
    async ({ step }) => {
        const pendingNotifications = await step.run('fetch-pending-notifications', async () => {
            await connectToDatabase();
            const now = new Date();
            return await Notification.find({
                status: 'PENDING',
                deliverAfter: { $lte: now },
            }).lean();
        });

        if (pendingNotifications.length === 0) {
            return { message: 'No pending notifications to deliver' };
        }

        const results = await step.run('deliver-notifications', async () => {
            const deliveryResults = [];

            for (const notification of pendingNotifications) {
                try {
                    // Get user preferences
                    const prefsResult = await getNotificationPreferencesByUserId(notification.userId);

                    if (!prefsResult.success || !prefsResult.data) {
                        continue;
                    }

                    const prefs = prefsResult.data;

                    // Mark as delivered if in-app is enabled
                    if (prefs.inAppEnabled) {
                        await Notification.findByIdAndUpdate(notification._id, {
                            status: 'DELIVERED',
                            deliverAfter: null,
                        });
                    } else {
                        // If in-app disabled, just remove from pending queue
                        await Notification.findByIdAndDelete(notification._id);
                    }

                    // Send email if enabled
                    if (prefs.emailEnabled) {
                        const profile = await UserProfile.findOne({ userId: notification.userId }).lean();

                        if (profile?.email) {
                            if (notification.type === 'DAILY_NEWS_SUMMARY') {
                                const date = notification.createdAt.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                });

                                await sendNewsSummaryEmail({
                                    email: profile.email,
                                    date,
                                    newsContent: notification.content,
                                });
                            }
                        }
                    }

                    deliveryResults.push({
                        notificationId: notification._id,
                        userId: notification.userId,
                        delivered: true,
                    });
                } catch (error) {
                    console.error('Error delivering notification:', notification._id, error);
                    deliveryResults.push({
                        notificationId: notification._id,
                        userId: notification.userId,
                        delivered: false,
                        error: String(error),
                    });
                }
            }

            return deliveryResults;
        });

        return {
            message: `Delivered ${results.filter((r: any) => r.delivered).length} of ${pendingNotifications.length} pending notifications`,
            results,
        };
    }
);
