import { sendEmail } from "../clients/resend.js";

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function buttonHtml(label: string, url: string) {
    return `<a href="${escapeHtml(url)}" style="display:inline-block;border-radius:8px;background:#0f172a;color:#fff;padding:12px 18px;text-decoration:none;font-weight:700">${escapeHtml(label)}</a>`;
}

function layout(title: string, body: string, actionUrl: string) {
    return `
    <div style="font-family:Inter,Arial,sans-serif;color:#18181b;line-height:1.6">
      <h1 style="font-size:22px;margin:0 0 16px">DoraForm</h1>
      <h2 style="font-size:18px;margin:0 0 12px">${escapeHtml(title)}</h2>
      ${body}
      <p style="font-size:13px;color:#52525b;margin-top:24px">Backup link: <a href="${escapeHtml(actionUrl)}">${escapeHtml(actionUrl)}</a></p>
    </div>
  `;
}

export async function sendVerificationEmail(to: string, fullName: string, url: string) {
    const subject = "Verify your DoraForm email";
    const text = [
        `Hi ${fullName},`,
        "Verify your DoraForm email address using this link:",
        url,
        "If you did not create this account, you can ignore this email.",
    ].join("\n\n");

    return sendEmail({
        to,
        subject,
        text,
        html: layout(
            "Verify your email address",
            `<p>Hi ${escapeHtml(fullName)},</p><p>Confirm this email address to finish setting up your DoraForm account.</p><p>${buttonHtml("Verify email", url)}</p>`,
            url,
        ),
    });
}

export async function sendPasswordResetEmail(to: string, fullName: string, url: string) {
    const subject = "Reset your DoraForm password";
    const text = [
        `Hi ${fullName},`,
        "Reset your DoraForm password using this link:",
        url,
        "If you did not request this, you can ignore this email.",
    ].join("\n\n");

    return sendEmail({
        to,
        subject,
        text,
        html: layout(
            "Reset your password",
            `<p>Hi ${escapeHtml(fullName)},</p><p>Use this secure link to choose a new DoraForm password.</p><p>${buttonHtml("Reset password", url)}</p>`,
            url,
        ),
    });
}

export async function sendPaymentReceiptEmail(payload: {
    to: string;
    fullName: string;
    planName: string;
    amountInPaise: number;
    currency: string;
    paymentId: string;
    paidAt: Date;
}) {
    const amount = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: payload.currency,
    }).format(payload.amountInPaise / 100);
    const subject = "Your DoraForm payment receipt";
    const bill = [
        `Plan: ${payload.planName}`,
        `Amount: ${amount}`,
        `Payment ID: ${payload.paymentId}`,
        `Paid at: ${payload.paidAt.toISOString()}`,
    ].join("\n");

    return sendEmail({
        to: payload.to,
        subject,
        text: [`Hi ${payload.fullName},`, "Thanks for your DoraForm payment.", bill].join("\n\n"),
        html: layout(
            "Payment receipt",
            `<p>Hi ${escapeHtml(payload.fullName)},</p><p>Thanks for your DoraForm payment. Your subscription is active.</p><table style="border-collapse:collapse;margin-top:16px"><tr><td style="padding:6px 12px;border:1px solid #e4e4e7">Plan</td><td style="padding:6px 12px;border:1px solid #e4e4e7">${escapeHtml(payload.planName)}</td></tr><tr><td style="padding:6px 12px;border:1px solid #e4e4e7">Amount</td><td style="padding:6px 12px;border:1px solid #e4e4e7">${escapeHtml(amount)}</td></tr><tr><td style="padding:6px 12px;border:1px solid #e4e4e7">Payment ID</td><td style="padding:6px 12px;border:1px solid #e4e4e7">${escapeHtml(payload.paymentId)}</td></tr></table>`,
            "https://DoraForm.pallabdev.in/dashboard/billing",
        ),
    });
}
