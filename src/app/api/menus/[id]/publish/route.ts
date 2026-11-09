import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRestaurantSession } from "@/lib/session";
import { corsHeaders, handleApiError } from "@/lib/api-utils";

const publishSchema = z.object({ published: z.boolean() });

/**
 * Publishes or unpublishes a menu. A menu can only go live once every
 * dish on it has been reviewed by staff.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const { restaurantId } = await requireRestaurantSession();

    const existing = await prisma.menu.findFirst({ where: { id: params.id, restaurantId } });
    if (!existing) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404, headers });
    }

    const { published } = publishSchema.parse(await req.json());

    if (published) {
      const [total, unreviewed] = await Promise.all([
        prisma.menuItem.count({ where: { menuId: existing.id } }),
        prisma.menuItem.count({ where: { menuId: existing.id, reviewedAt: null } }),
      ]);
      if (total === 0) {
        return NextResponse.json({ error: "Add at least one dish before publishing." }, { status: 409, headers });
      }
      if (unreviewed > 0) {
        return NextResponse.json(
          { error: `Review ${unreviewed} more ${unreviewed === 1 ? "dish" : "dishes"} before publishing.` },
          { status: 409, headers }
        );
      }
    }

    const menu = await prisma.menu.update({
      where: { id: existing.id },
      data: { status: published ? "PUBLISHED" : "DRAFT", publishedAt: published ? new Date() : null },
    });

    await prisma.activityEvent.create({
      data: {
        restaurantId,
        type: "MENU_UPDATED",
        title: published ? "Menu published" : "Menu unpublished",
        description: `"${existing.name}" is ${published ? "now visible to diners" : "no longer visible to diners"}`,
      },
    });

    return NextResponse.json({ menu }, { headers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}
