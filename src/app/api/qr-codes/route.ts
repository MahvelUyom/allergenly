import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRestaurantSession } from "@/lib/session";
import { qrCodeCreateSchema } from "@/lib/zod-schemas";
import { generateShortId } from "@/lib/qr";
import { sanitizePlainText } from "@/lib/sanitize";
import { corsHeaders, handleApiError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const { restaurantId } = await requireRestaurantSession();
    const qrCodes = await prisma.qRCode.findMany({
      where: { restaurantId },
      include: { location: true, _count: { select: { scans: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ qrCodes }, { headers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const { restaurantId } = await requireRestaurantSession();
    const body = await req.json();
    const data = qrCodeCreateSchema.parse(body);

    // Verify the referenced menu/location actually belong to this
    // restaurant — never trust the ids beyond that they parse.
    const menu = await prisma.menu.findFirst({ where: { id: data.menuId, restaurantId } });
    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404, headers });
    }
    if (data.locationId) {
      const location = await prisma.location.findFirst({ where: { id: data.locationId, restaurantId } });
      if (!location) {
        return NextResponse.json({ error: "Location not found" }, { status: 404, headers });
      }
    }

    let shortId = generateShortId();
    // Extremely unlikely collision given the alphabet/length, but
    // guard it anyway.
    while (await prisma.qRCode.findUnique({ where: { shortId } })) {
      shortId = generateShortId();
    }

    const qrCode = await prisma.qRCode.create({
      data: {
        shortId,
        restaurantId,
        locationId: data.locationId,
        menuId: data.menuId,
        // Every other free-text field in the app is sanitized before
        // storage (see lib/sanitize.ts) — this one was missed, and it
        // reaches a raw document.write() in QRPreviewCard's print
        // flow, so an unsanitized label was a stored-XSS path.
        label: sanitizePlainText(data.label),
      },
    });

    await prisma.activityEvent.create({
      data: {
        restaurantId,
        type: "QR_GENERATED",
        title: "QR code generated",
        description: `"${qrCode.label}" QR code created`,
      },
    });

    return NextResponse.json({ qrCode }, { status: 201, headers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}
