// Minimal email sender. EMAIL_DRIVER=console (default) just logs, so
// the password-reset and background verification-email flows are fully
// exercisable in dev without SMTP credentials. Switch to "smtp" and
// fill in SMTP_* to send real mail — swap the implementation below for
// nodemailer or your provider's SDK at that point.
interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  if (process.env.EMAIL_DRIVER === "smtp") {
    // Intentionally not implemented in this build — wire up nodemailer
    // (or your provider's API) here using SMTP_HOST/PORT/USER/PASSWORD
    // from the environment. Falling through to console logging keeps
    // the app functional rather than throwing if this is reached
    // before that's done.
    console.warn("[mailer] EMAIL_DRIVER=smtp but no SMTP implementation is wired up yet.");
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
