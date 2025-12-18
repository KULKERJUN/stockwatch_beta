import {inngest} from "@/lib/inngest/client";
import {PERSONALIZED_WELCOME_EMAIL_PROMPT} from "@/lib/inngest/prompts";
import {sendWelcomeEmail, sendPriceAlertEmail} from "@/lib/nodemailer";
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
