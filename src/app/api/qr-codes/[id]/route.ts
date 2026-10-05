import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRestaurantSession } from "@/lib/session";
import { corsHeaders, handleApiError } from "@/lib/api-utils";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const { restaurantId } = await requireRestaurantSession();
    const existing = await prisma.qRCode.findFirst({ where: { id: params.id, restaurantId } });
    if (!existing) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404, headers });
    }
    await prisma.qRCode.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}
