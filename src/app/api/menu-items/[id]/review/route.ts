import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRestaurantSession } from "@/lib/session";
import { corsHeaders, handleApiError } from "@/lib/api-utils";

/**
 * Staff attest that a dish has been checked against all 14 allergens.
 * Refused while any auto-detected flag is still undecided. The condition
 * sits in the update itself so a flag can't slip in between check and write.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const { restaurantId, userId } = await requireRestaurantSession();

    const item = await prisma.menuItem.findFirst({
      where: { id: params.id, menu: { restaurantId } },
    });
    if (!item) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404, headers });
    }

    const { count } = await prisma.menuItem.updateMany({
      where: { id: params.id, allergens: { none: { status: "AUTO_DETECTED" } } },
      data: { reviewedAt: new Date(), reviewedById: userId },
    });
    if (count === 0) {
      return NextResponse.json(
        { error: "Mark every detected allergen as present or not present first." },
        { status: 409, headers }
      );
    }

    const updatedItem = await prisma.menuItem.findUniqueOrThrow({
      where: { id: params.id },
      include: { allergens: true },
    });

    return NextResponse.json({ item: updatedItem }, { headers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}
