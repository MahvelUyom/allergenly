import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/zod-schemas";
import { corsHeaders, handleApiError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "This reset link is invalid or has expired" }, { status: 400, headers });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      // passwordChangedAt is what actually invalidates other sessions —
      // this app uses JWT sessions (no DB-backed Session rows to
      // delete; see lib/auth.ts), so a stamp the session() callback can
      // compare against is the only way to reject a token minted before
      // this reset.
      prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash, passwordChangedAt: new Date() } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    ]);

    return NextResponse.json({ ok: true }, { status: 200, headers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}
