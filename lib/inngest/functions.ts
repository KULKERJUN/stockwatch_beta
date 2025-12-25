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
import { getMultipleStockPrices } from "@/lib/actions/stock.actions";

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

        const response = await step.ai.infer('generate-welcome-intro', {
            model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
            body: {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt }
                        ]
                    }]
            }
        })

        await step.run('send-welcome-email', async () => {
            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text : null) ||'Thanks for joining StockWatch. You now have the tools to track markets and make smarter moves.'

            //email send logic function

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
    [ { event: 'app/send.daily.news' }, { cron: '0 */10 * * *' } ],
    async ({ step }) => {
        // Step #1: Get all users for news delivery
        const users = await step.run('get-all-users', getAllUsersForNewsEmail)

        if(!users || users.length === 0) return { success: false, message: 'No users found for news email' };

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
                    perUser.push({ user, articles });
                } catch (e) {
                    console.error('daily-news: error preparing user news', user.email, e);
                    perUser.push({ user, articles: [] });
                }
            }
            return perUser;
        });

        // Step #3: (placeholder) Summarize news via AI
        const userNewsSummaries: { user: UserForNewsEmail; newsContent: string | null }[] = [];

        for (const { user, articles } of results) {
            try {
                const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', JSON.stringify(articles, null, 2));

                const response = await step.ai.infer(`summarize-news-${user.email}`, {
                    model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
                    body: {
                        contents: [{ role: 'user', parts: [{ text:prompt }]}]
                    }
                });

                const part = response.candidates?.[0]?.content?.parts?.[0];
                const newsContent = (part && 'text' in part ? part.text : null) || 'No market news.'

                userNewsSummaries.push({ user, newsContent });
            } catch (e) {
                console.error('Failed to summarize news for : ', user.email);
                userNewsSummaries.push({ user, newsContent: null });
            }
        }

        // Step #4: (placeholder) Send the emails
        await step.run('send-news-emails', async () => {
            await Promise.all(
                userNewsSummaries.map(async ({ user, newsContent}) => {
                    if(!newsContent) return false;

                    return await sendNewsSummaryEmail({ email: user.email, date: getFormattedTodayDate(), newsContent })
                })
            )
        })

        return { success: true, message: 'Daily news summary emails sent successfully' }
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

