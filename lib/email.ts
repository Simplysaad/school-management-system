// src/lib/email.ts
import nodemailer from "nodemailer";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAnnouncementEmail({
    to,
    subject,
    htmlContent,
}: {
    to: string | string[];
    subject: string;
    htmlContent: string;
}) {
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
        // Use Resend in production
        try {
            const data = await resend.emails.send({
                from: process.env.EMAIL_FROM || "notifications@yourdomain.com",
                to: Array.isArray(to) ? to : [to],
                subject,
                html: htmlContent,
            });
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    } else {
        // Use Nodemailer (e.g., Ethereal or SMTP test trap) in development
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || "smtp.ethereal.email",
                port: Number(process.env.SMTP_PORT) || 587,
                auth: {
                    user: process.env.SMTP_USER || "test_user",
                    pass: process.env.SMTP_PASS || "test_pass",
                },
            });

            const info = await transporter.sendMail({
                from: '"School Portal" <noreply@schoolportal.com>',
                to: Array.isArray(to) ? to.join(", ") : to,
                subject,
                html: htmlContent,
            });

            return { success: true, messageId: info.messageId };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}