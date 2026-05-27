import { env } from "../env.js";

type SendEmailPayload = {
    to: string;
    subject: string;
    html: string;
    text: string;
};

export async function sendEmail(payload: SendEmailPayload) {
    if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
        console.warn("Resend email skipped because RESEND_API_KEY or RESEND_FROM is missing.");
        return { skipped: true };
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: env.RESEND_FROM,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
        }),
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(`Unable to send email: ${message}`);
    }

    return { skipped: false };
}
