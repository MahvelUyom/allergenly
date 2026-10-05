import { NextRequest, NextResponse } from "next/server";
import { verifyInternalSecret } from "@/lib/internal-auth";
import { processMenuUpload } from "@/lib/menu-processing";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({ uploadId: z.string().min(1) });

/**
 * Service-to-service entry point for menu processing — the shape a
 * background OCR/allergen-processing worker would call back into the
 * main API with, authenticated by a shared secret rather than a user
 * session (there is no logged-in user in that context). Required on
 * every such call per the security spec: constant-time comparison,
 * fails closed if the secret isn't configured.
 */
export async function POST(req: NextRequest) {
  if (!verifyInternalSecret(req.headers.get("x-internal-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { uploadId } = bodySchema.parse(await req.json());
    await processMenuUpload(uploadId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
