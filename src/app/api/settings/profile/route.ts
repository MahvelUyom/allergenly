import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRestaurantSession } from "@/lib/session";
import { restaurantProfileSchema } from "@/lib/zod-schemas";
import { sanitizePlainText } from "@/lib/sanitize";
import { corsHeaders, handleApiError } from "@/lib/api-utils";

export async function PATCH(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const { restaurantId } = await requireRestaurantSession();
    const body = await req.json();
    const data = restaurantProfileSchema.parse(body);

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        name: sanitizePlainText(data.name),
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone ? sanitizePlainText(data.contactPhone) : null,
      },
    });

    return NextResponse.json({ restaurant: updated }, { headers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}
