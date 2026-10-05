import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Background record-keeping verification link — visiting it just marks
// emailVerified. It never gates dashboard access (that's already
// granted at sign-up), so failures here are non-critical.
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const token = req.nextUrl.searchParams.get("token");
  const email = req.nextUrl.searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(`${appUrl}/dashboard`);
  }

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });

  if (record && record.expires > new Date()) {
    await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
    await prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } });
  }

  return NextResponse.redirect(`${appUrl}/dashboard?verified=1`);
}
