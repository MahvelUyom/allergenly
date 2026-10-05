import { NextRequest, NextResponse } from "next/server";
import { requireRestaurantSession } from "@/lib/session";
import { markAllNotificationsRead } from "@/lib/notifications";
import { corsHeaders, handleApiError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const { restaurantId } = await requireRestaurantSession();
    await markAllNotificationsRead(restaurantId);
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}
