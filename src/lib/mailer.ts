import nodemailer from "nodemailer";

// Minimal email sender. EMAIL_DRIVER=console (default) just logs, so
// the password-reset and background verification-email flows are fully
// exercisable in dev without SMTP credentials. Switch to "smtp" and
// fill in SMTP_* to send real mail (configured for Outlook/Office365:
// SMTP_HOST=smtp-mail.outlook.com, SMTP_PORT=587, SMTP_USER=full
// outlook address, SMTP_PASSWORD=an app password, not the account
// password — Microsoft requires one once 2-step verification is on).
interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      // Port 465 is implicit TLS; 587 (Outlook's port) negotiates TLS via STARTTLS.
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  if (process.env.EMAIL_DRIVER === "smtp") {
    await getTransporter().sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
    return;
  }

  console.log(`[mailer] → ${to}\nSubject: ${subject}\n${html}\n`);
}

export function passwordResetEmailHtml(resetUrl: string): string {
  return `
    <p>Someone requested a password reset for your Allergenly account.</p>
    <p><a href="${resetUrl}">Reset your password</a> (this link expires in 1 hour).</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  `;
}

export function verificationEmailHtml(verifyUrl: string): string {
  return `
    <p>Welcome to Allergenly! Your account is already active — this is just for our records.</p>
    <p><a href="${verifyUrl}">Verify your email address</a>.</p>
  `;
}
