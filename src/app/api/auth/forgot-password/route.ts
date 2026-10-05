import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/zod-schemas";
import { sendEmail, passwordResetEmailHtml } from "@/lib/mailer";
import { corsHeaders, handleApiError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const { allowed } = rateLimit(`forgot-password:${ip}`, { windowMs: 15 * 60 * 1000, max: 10 });
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
    }

    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond the same way whether or not the account exists,
    // so this endpoint can't be used to enumerate registered emails.
    if (user) {
      const token = randomUUID();
      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
        },
      });
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/reset-password?token=${token}`;
      sendEmail({
        to: user.email,
        subject: "Reset your Allergenly password",
        html: passwordResetEmailHtml(resetUrl),
      }).catch((err) => console.error("Failed to send reset email", err));
    }

    return NextResponse.json({ ok: true }, { status: 200, headers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}
