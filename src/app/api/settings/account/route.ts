import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRestaurantSession } from "@/lib/session";
import { accountSettingsSchema } from "@/lib/zod-schemas";
import { sanitizePlainText } from "@/lib/sanitize";
import { corsHeaders, handleApiError } from "@/lib/api-utils";

export async function PATCH(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const { userId } = await requireRestaurantSession();
    const body = await req.json();
    const data = accountSettingsSchema.parse(body);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (data.newPassword) {
      if (!user.passwordHash) {
        return NextResponse.json(
          { error: "This account signs in with Google — no password to change" },
          { status: 400, headers }
        );
      }
      const valid = await bcrypt.compare(data.currentPassword!, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400, headers });
      }
    }

    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) {
        return NextResponse.json({ error: "That email is already in use" }, { status: 409, headers });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: sanitizePlainText(data.name) }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.newPassword && {
          passwordHash: await bcrypt.hash(data.newPassword, 12),
          passwordChangedAt: new Date(), // see lib/auth.ts — invalidates other JWT sessions
        }),
      },
    });

    return NextResponse.json({
      user: { id: updated.id, name: updated.name, email: updated.email, hasPassword: !!updated.passwordHash },
    }, { headers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}
