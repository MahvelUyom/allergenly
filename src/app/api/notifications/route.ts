import { NextRequest, NextResponse } from "next/server";
import { requireRestaurantSession } from "@/lib/session";
import { getNotifications } from "@/lib/notifications";
import { corsHeaders, handleApiError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const { restaurantId } = await requireRestaurantSession();
    const { items, unreadCount } = await getNotifications(restaurantId);
    return NextResponse.json({ notifications: items, unreadCount }, { headers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}
