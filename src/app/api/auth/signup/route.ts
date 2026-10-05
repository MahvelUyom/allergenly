import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/zod-schemas";
import { uniqueRestaurantSlug } from "@/lib/slug";
import { sanitizePlainText } from "@/lib/sanitize";
import { sendEmail, verificationEmailHtml } from "@/lib/mailer";
import { corsHeaders, handleApiError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const body = await req.json();
    const data = signUpSchema.parse(body); // re-validate server-side — never trust the client

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409, headers }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const restaurantName = sanitizePlainText(data.restaurantName);
    const slug = await uniqueRestaurantSlug(restaurantName);

    // Access is granted immediately on sign-up (no email verification
    // gate) — the user + restaurant + default location + draft menu
    // are created in one transaction so the new account lands on a
    // dashboard with something to look at.
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: "OWNER",
        },
      });

      const restaurant = await tx.restaurant.create({
        data: {
          ownerId: created.id,
          name: restaurantName,
          slug,
        },
      });

      const location = await tx.location.create({
        data: { restaurantId: restaurant.id, name: "Main Location" },
      });

      await tx.menu.create({
        data: { restaurantId: restaurant.id, locationId: location.id, name: "Main Menu" },
      });

      await tx.activityEvent.create({
        data: {
          restaurantId: restaurant.id,
          type: "ACCOUNT_CREATED",
          title: "Welcome to Allergenly!",
          description: `Your account and "${restaurantName}" are ready. Upload your first menu to get started.`,
        },
      });

      return created;
    }, { maxWait: 10_000, timeout: 15_000 }); // defaults (2s/5s) are too tight on a slow connection — see lib/auth.ts's createUser for the same pattern

    // Background verification email — record-keeping only, never
    // blocks or gates dashboard access.
    const verifyToken = randomUUID();
    await prisma.verificationToken
      .create({
        data: {
          identifier: user.email,
          token: verifyToken,
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      })
      .catch(() => undefined);
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/auth/verify?token=${verifyToken}&email=${encodeURIComponent(
      user.email
    )}`;
    sendEmail({
      to: user.email,
      subject: "Verify your Allergenly account",
      html: verificationEmailHtml(verifyUrl),
    }).catch((err) => console.error("Failed to send verification email", err));

    return NextResponse.json({ ok: true }, { status: 201, headers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}
