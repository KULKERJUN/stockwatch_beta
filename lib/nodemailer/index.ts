import nodemailer from 'nodemailer';
import {
    WELCOME_EMAIL_TEMPLATE,
    STOCK_ALERT_UPPER_EMAIL_TEMPLATE,
    STOCK_ALERT_LOWER_EMAIL_TEMPLATE
} from "@/lib/nodemailer/templates";

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    }
})

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', intro);

    const mailOptions = {
        from: `"StockWatch" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: `Welcome to StockWatch - your stock market toolkit is ready!`,
        text: 'Thanks for joining StockWatch!',
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
};

export const sendPriceAlertEmail = async ({
    email,
    symbol,
    company,
    currentPrice,
    targetPrice,
    condition,
}: {
    email: string;
    symbol: string;
    company: string;
    currentPrice: number;
    targetPrice: number;
    condition: 'ABOVE' | 'BELOW';
}) => {
    const isUpper = condition === 'ABOVE';
    const template = isUpper ? STOCK_ALERT_UPPER_EMAIL_TEMPLATE : STOCK_ALERT_LOWER_EMAIL_TEMPLATE;
    const timestamp = new Date().toLocaleString('en-US', { 
        dateStyle: 'medium', 
        timeStyle: 'short' 
    });

    const htmlTemplate = template
        .replaceAll('{{symbol}}', symbol)
        .replaceAll('{{company}}', company)
        .replaceAll('{{currentPrice}}', `$${currentPrice.toFixed(2)}`)
        .replaceAll('{{targetPrice}}', `$${targetPrice.toFixed(2)}`)
        .replaceAll('{{timestamp}}', timestamp);

    const mailOptions = {
        from: `"StockWatch Alert" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: `Price Alert: ${symbol} hit your ${isUpper ? 'upper' : 'lower'} target of $${targetPrice.toFixed(2)}`,
        text: `${symbol} is now $${currentPrice.toFixed(2)}, which is ${isUpper ? 'above' : 'below'} your target of $${targetPrice.toFixed(2)}.`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};
