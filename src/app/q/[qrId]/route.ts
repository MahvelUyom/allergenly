import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { qrIdParamSchema } from "@/lib/zod-schemas";
import { rateLimit } from "@/lib/rate-limit";
import { deviceTypeFromUserAgent, dedupeFingerprint } from "@/lib/device";
import { publicMenuUrl } from "@/lib/qr";

export const runtime = "nodejs";

// The one intentionally-public, no-login route in the app — treat it
// as a hostile-input boundary per the security spec: minimal surface
// (look up, log, redirect — nothing else), rate-limited, and the qrId
// is format-validated BEFORE it ever touches a query.
export async function GET(req: NextRequest, { params }: { params: { qrId: string } }) {
  const fallbackUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(`qr-scan:${ip}`, { windowMs: 60_000, max: 60 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsedId = qrIdParamSchema.safeParse(params.qrId);
  if (!parsedId.success) {
    return NextResponse.redirect(fallbackUrl, { status: 302 });
  }
  const qrId = parsedId.data;

  const qrCode = await prisma.qRCode.findUnique({
    where: { shortId: qrId },
    include: { menu: { include: { restaurant: true } }, location: true },
  });

  if (!qrCode) {
    return NextResponse.redirect(fallbackUrl, { status: 302 });
  }

  const userAgent = req.headers.get("user-agent");
  const referrer = req.headers.get("referer");
  const fingerprint = await dedupeFingerprint(qrCode.id, ip, userAgent);

  // Dedup: skip logging a second scan from the same device/session
  // within a 30-minute window.
  const recentDuplicate = await prisma.scanEvent.findFirst({
    where: {
      qrCodeId: qrCode.id,
      dedupeKey: fingerprint,
      timestamp: { gte: new Date(Date.now() - 30 * 60 * 1000) },
    },
    select: { id: true },
  });

  if (!recentDuplicate) {
    // Fire the write on the way through — no extra round trip before
    // redirecting.
    await prisma.scanEvent.create({
      data: {
        qrCodeId: qrCode.id,
        userAgent: userAgent?.slice(0, 500),
        referrer: referrer?.slice(0, 500),
        deviceType: deviceTypeFromUserAgent(userAgent),
        dedupeKey: fingerprint,
      },
    });

    // Best-effort notification — a hiccup here must never break the
    // redirect for a real diner scanning a table code.
    const locationLabel = qrCode.location?.name ?? "All locations";
    await prisma.activityEvent
      .create({
        data: {
          restaurantId: qrCode.restaurantId,
          type: "QR_SCANNED",
          title: "QR code scanned",
          description: `"${qrCode.label}" (${locationLabel}) was scanned`,
        },
      })
      .catch((err) => console.error("Failed to record scan notification", err));
  }

  const destination = publicMenuUrl(qrCode.menu.restaurant.slug);
  return NextResponse.redirect(destination, { status: 302 });
}
