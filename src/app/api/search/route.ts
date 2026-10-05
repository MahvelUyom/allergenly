import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRestaurantSession } from "@/lib/session";
import { corsHeaders, handleApiError } from "@/lib/api-utils";

// Scoped to the caller's own restaurant via the session, like every
// other authenticated route — the query string never carries an id
// that could reach into another account's data.
export async function GET(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const { restaurantId } = await requireRestaurantSession();
    const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 100);

    if (q.length < 2) {
      return NextResponse.json({ menuItems: [], qrCodes: [] }, { headers });
    }

    const [menuItems, qrCodes] = await Promise.all([
      prisma.menuItem.findMany({
        where: { menu: { restaurantId }, name: { contains: q, mode: "insensitive" } },
        select: { id: true, name: true, category: true },
        take: 6,
        orderBy: { name: "asc" },
      }),
      prisma.qRCode.findMany({
        where: { restaurantId, label: { contains: q, mode: "insensitive" } },
        select: { id: true, label: true },
        take: 6,
        orderBy: { label: "asc" },
      }),
    ]);

    return NextResponse.json({ menuItems, qrCodes }, { headers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}
