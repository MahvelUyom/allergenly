import type { Allergen } from "@prisma/client";
import { prisma } from "./prisma";
import { getStorageAdapter } from "./storage";
import { getOcrAdapter } from "./ocr";
import { parseMenuText } from "./menu-parser";
import { detectAllergens } from "./allergens";
import { stripEmbeddedScripts } from "./file-validation";
import { scanMenuWithClaude, type ScannedMenuItem } from "./menu-scan-claude";
import { scanMenuWithGemini } from "./menu-scan-gemini";

/**
 * The full upload → extract → parse → detect pipeline for one
 * MenuUpload row. Shared by the authenticated upload route (which
 * currently calls it inline/awaited, since the stub/keyword pipeline
 * is fast) and the internal /api/internal/process-upload route (the
 * shape a real deployment would call from a queue worker once OCR on
 * large scanned PDFs makes this too slow to run inline).
 */
export async function processMenuUpload(uploadId: string): Promise<void> {
  const upload = await prisma.menuUpload.update({
    where: { id: uploadId },
    data: { status: "PROCESSING", progress: 10 },
  });

  try {
    const storage = getStorageAdapter();
    const fileBuffer = await storage.get(upload.storageKey);
    await prisma.menuUpload.update({ where: { id: uploadId }, data: { progress: 35 } });

    // OCR_DRIVER=claude does extraction AND allergen detection in one
    // vision call (contextual — "aioli" implies EGGS — not just literal
    // keyword matching); the stub/vision drivers still go through the
    // separate parse-then-keyword-scan steps below. Either path lands
    // on the same shape so everything downstream is driver-agnostic.
    let parsedItems: ScannedMenuItem[];
    if (process.env.OCR_DRIVER === "claude") {
      parsedItems = await scanMenuWithClaude(fileBuffer, upload.mimeType);
      await prisma.menuUpload.update({ where: { id: uploadId }, data: { progress: 80 } });
    } else if (process.env.OCR_DRIVER === "gemini") {
      parsedItems = await scanMenuWithGemini(fileBuffer, upload.mimeType);
      await prisma.menuUpload.update({ where: { id: uploadId }, data: { progress: 80 } });
    } else {
      const ocr = getOcrAdapter();
      const { text: rawText } = await ocr.extractText(fileBuffer, upload.mimeType);
      const safeText = stripEmbeddedScripts(rawText);
      await prisma.menuUpload.update({ where: { id: uploadId }, data: { progress: 65 } });

      parsedItems = parseMenuText(safeText).map((p) => ({
        ...p,
        allergens: detectAllergens(`${p.name} ${p.description}`).map((m) => m.allergen),
      }));
      await prisma.menuUpload.update({ where: { id: uploadId }, data: { progress: 80 } });
    }

    // Ensure there's a target menu to attach items to.
    let menuId = upload.menuId;
    if (!menuId) {
      const menu = await prisma.menu.findFirst({
        where: { restaurantId: upload.restaurantId },
        orderBy: { createdAt: "asc" },
      });
      menuId = menu
        ? menu.id
        : (await prisma.menu.create({ data: { restaurantId: upload.restaurantId, name: "Main Menu" } })).id;
    }

    let flaggedCount = 0;
    const flaggedNames: string[] = [];
    for (const [index, parsed] of parsedItems.entries()) {
      const item = await prisma.menuItem.create({
        data: {
          menuId,
          name: parsed.name,
          description: parsed.description,
          priceCents: parsed.priceCents,
          category: parsed.category,
          sortOrder: index,
        },
      });

      const matches: Allergen[] = parsed.allergens;
      if (matches.length > 0) {
        flaggedCount += 1;
        flaggedNames.push(item.name);
        await prisma.allergenFlag.createMany({
          data: matches.map((allergen) => ({
            menuItemId: item.id,
            allergen,
            status: "AUTO_DETECTED" as const,
            source: "ocr",
          })),
          skipDuplicates: true,
        });
      }
    }

    await prisma.menuUpload.update({
      where: { id: uploadId },
      data: { status: "COMPLETED", progress: 100, menuId },
    });

    await prisma.activityEvent.create({
      data: {
        restaurantId: upload.restaurantId,
        type: "MENU_UPLOADED",
        title: "Menu uploaded",
        description: `${upload.fileName} — ${parsedItems.length} items parsed, ${flaggedCount} flagged for review`,
      },
    });

    // Name the actual items so the notification is actionable, not just
    // a count — truncated so one huge upload doesn't produce an
    // unreadable wall of text in the bell dropdown.
    if (flaggedNames.length > 0) {
      const shown = flaggedNames.slice(0, 5);
      const rest = flaggedNames.length - shown.length;
      const list = shown.join(", ") + (rest > 0 ? `, and ${rest} more` : "");
      await prisma.activityEvent.create({
        data: {
          restaurantId: upload.restaurantId,
          type: "ALLERGEN_FLAGGED",
          title: `${flaggedCount} item${flaggedCount === 1 ? "" : "s"} need${flaggedCount === 1 ? "s" : ""} allergen review`,
          description: list,
        },
      });
    }
  } catch (error) {
    console.error(`Failed to process menu upload ${uploadId}`, error);
    await prisma.menuUpload.update({
      where: { id: uploadId },
      data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : "Unknown error" },
    });
    throw error;
  }
}
