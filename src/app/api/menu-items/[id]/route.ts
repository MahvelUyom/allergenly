import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRestaurantSession } from "@/lib/session";
import { menuItemSchema } from "@/lib/zod-schemas";
import { sanitizePlainText } from "@/lib/sanitize";
import { corsHeaders, handleApiError } from "@/lib/api-utils";

async function assertOwnership(itemId: string, restaurantId: string) {
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, menu: { restaurantId } },
  });
  if (!item) throw new NotFoundError();
  return item;
}

class NotFoundError extends Error {
  status = 404;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const { restaurantId } = await requireRestaurantSession();
    const existing = await assertOwnership(params.id, restaurantId);

    const body = await req.json();
    const data = menuItemSchema.partial().parse(body);
    const name = data.name !== undefined ? sanitizePlainText(data.name) : undefined;
    const description = data.description !== undefined ? sanitizePlainText(data.description) : undefined;

    // New wording can mean new ingredients, so the dish needs another review.
    const contentChanged =
      (name !== undefined && name !== existing.name) ||
      (description !== undefined && description !== existing.description);

    const updated = await prisma.menuItem.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(data.priceCents !== undefined && { priceCents: data.priceCents }),
        ...(data.category !== undefined && { category: data.category }),
        ...(contentChanged && { reviewedAt: null, reviewedById: null }),
      },
      include: { allergens: true },
    });

    await prisma.activityEvent.create({
      data: {
        restaurantId,
        type: "MENU_UPDATED",
        title: "Menu updated",
        description: `"${updated.name}" was edited`,
      },
    });

    return NextResponse.json({ item: updated }, { headers });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404, headers });
    }
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const { restaurantId } = await requireRestaurantSession();
    await assertOwnership(params.id, restaurantId);
    await prisma.menuItem.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404, headers });
    }
    return handleApiError(error);
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}
