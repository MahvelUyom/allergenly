import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireRestaurantSession } from "@/lib/session";
import { getStorageAdapter } from "@/lib/storage";
import { validateUploadedFile } from "@/lib/file-validation";
import { prisma } from "@/lib/prisma";
import { processMenuUpload } from "@/lib/menu-processing";
import { corsHeaders, handleApiError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs"; // needed for Buffer / storage / OCR SDKs

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const { restaurantId } = await requireRestaurantSession();

    const { allowed } = rateLimit(`menu-upload:${restaurantId}`, { windowMs: 60_000, max: 10 });
    if (!allowed) {
      return NextResponse.json({ error: "Too many uploads — please wait a moment" }, { status: 429, headers });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400, headers });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Never trust file.type (client-reported) — validate against the
    // actual bytes.
    const validation = validateUploadedFile(buffer, buffer.byteLength);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400, headers });
    }

    const storage = getStorageAdapter();
    const key = `uploads/${restaurantId}/${randomUUID()}-${sanitizeFileName(file.name)}`;
    await storage.put(key, buffer, validation.sniffedMimeType!);

    const upload = await prisma.menuUpload.create({
      data: {
        restaurantId,
        fileName: sanitizeFileName(file.name),
        storageKey: key,
        mimeType: validation.sniffedMimeType!,
        sizeBytes: buffer.byteLength,
        status: "PENDING",
      },
    });

    // The keyword-based stub pipeline is fast enough to run inline
    // here. A production deployment fronting real OCR on large PDFs
    // should instead enqueue a job and have a worker call
    // POST /api/internal/process-upload (shared-secret authenticated —
    // see lib/internal-auth.ts) so this request returns immediately.
    await processMenuUpload(upload.id);

    const completed = await prisma.menuUpload.findUniqueOrThrow({ where: { id: upload.id } });
    const items = completed.menuId
      ? await prisma.menuItem.findMany({
          where: { menuId: completed.menuId },
          include: { allergens: true },
          orderBy: { sortOrder: "asc" },
        })
      : [];

    return NextResponse.json({ upload: completed, items }, { status: 201, headers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}
