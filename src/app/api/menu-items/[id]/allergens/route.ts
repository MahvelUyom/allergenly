import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRestaurantSession } from "@/lib/session";
import { allergenOverrideSchema } from "@/lib/zod-schemas";
import { corsHeaders, handleApiError } from "@/lib/api-utils";

/**
 * Manual allergen override — staff toggles one allergen for one item
 * to CONFIRMED or CLEARED. This is the only way an AllergenFlag's
 * status changes away from AUTO_DETECTED; the client can never set
 * AUTO_DETECTED itself (see allergenOverrideSchema).
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

    const body = await req.json();
    const { allergen, status } = allergenOverrideSchema.parse({ ...body, menuItemId: params.id });

    const flag = await prisma.allergenFlag.upsert({
      where: { menuItemId_allergen: { menuItemId: params.id, allergen } },
      create: {
        menuItemId: params.id,
        allergen,
        status,
        source: "manual",
        confirmedById: userId,
        confirmedAt: new Date(),
      },
      update: {
        status,
        source: "manual",
        confirmedById: userId,
        confirmedAt: new Date(),
      },
    });

    if (status === "CONFIRMED") {
      await prisma.activityEvent.create({
        data: {
          restaurantId,
          type: "ALLERGEN_CONFIRMED",
          title: "Allergen confirmed",
          description: `${allergen.charAt(0)}${allergen.slice(1).toLowerCase()} verified in "${item.name}"`,
        },
      });
    }

    const updatedItem = await prisma.menuItem.findUniqueOrThrow({
      where: { id: params.id },
      include: { allergens: true },
    });

    return NextResponse.json({ flag, item: updatedItem }, { headers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}
