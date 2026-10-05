import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRestaurantSession } from "@/lib/session";
import { corsHeaders, handleApiError } from "@/lib/api-utils";

// Deleting a menu cascades to its MenuItem/AllergenFlag rows and any
// QRCode pointed at it (see schema.prisma) — the confirmation copy in
// the UI spells that out before this ever gets called.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const { restaurantId } = await requireRestaurantSession();
    const menu = await prisma.menu.findFirst({ where: { id: params.id, restaurantId } });
    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404, headers });
    }
    await prisma.menu.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}
