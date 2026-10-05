import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
// The SDK's structured-output helper needs Zod's v4 API surface
// specifically — the rest of this app uses the v3 surface (the
// top-level "zod" import, in lib/zod-schemas.ts) via the same
// zod package, which ships both side by side. Scoped to this file only.
import { z } from "zod/v4";
import type { MenuCategory, Allergen } from "@prisma/client";
import { sanitizePlainText } from "./sanitize";

// ---------------------------------------------------------------------
// OCR_DRIVER=claude — a single vision call that replaces BOTH steps the
// stub/vision drivers still need downstream (lib/menu-parser.ts's
// line-based regex parser and lib/allergens.ts's keyword scanner).
// Claude reads the actual menu image/PDF and returns structured items
// with a contextual allergen read (e.g. "aioli" implies EGGS, "pad
// thai" implies PEANUTS) instead of literal keyword matching — see the
// prompt below for why it's told to over-flag rather than under-flag.
// Every allergen it returns is still stored as AUTO_DETECTED, same as
// the other drivers — staff review is the app's safety contract, not
// a property of any one detection method.
// ---------------------------------------------------------------------

const ALLERGEN_VALUES = [
  "GLUTEN",
  "CRUSTACEANS",
  "EGGS",
  "FISH",
  "PEANUTS",
  "SOYBEANS",
  "MILK",
  "NUTS",
  "CELERY",
  "MUSTARD",
  "SESAME",
  "SULPHITES",
  "LUPIN",
  "MOLLUSCS",
] as const;

const CATEGORY_VALUES = ["STARTERS", "MAINS", "DESSERTS", "DRINKS", "OTHER"] as const;

const ScannedItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  priceCents: z.number().int().nonnegative().nullable(),
  category: z.enum(CATEGORY_VALUES),
  allergens: z.array(z.enum(ALLERGEN_VALUES)),
});

const ScannedMenuSchema = z.object({
  items: z.array(ScannedItemSchema),
});

export interface ScannedMenuItem {
  name: string;
  description: string;
  priceCents: number | null;
  category: MenuCategory;
  allergens: Allergen[];
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (client) return client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("OCR_DRIVER=claude but ANTHROPIC_API_KEY is not configured");
  }
  client = new Anthropic();
  return client;
}

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const SYSTEM_PROMPT = `You read restaurant menus (photos, scans, or PDFs) and extract every menu item as structured data, including a careful allergen assessment for the EU-14 recognized allergens: ${ALLERGEN_VALUES.join(", ")}.

For each item:
- name: the dish name exactly as printed.
- description: the ingredient/description text printed under the dish, or "" if none is printed.
- priceCents: the price in cents (e.g. $12.50 -> 1250), or null if no price is printed.
- category: STARTERS, MAINS, DESSERTS, DRINKS, or OTHER — infer from menu section headings, or OTHER if unclear.
- allergens: every EU-14 allergen you can reasonably infer is present, based on the stated ingredients, the dish name, and how that dish is normally prepared (e.g. "aioli" implies EGGS, "soy sauce" implies GLUTEN and SOYBEANS, "pad thai" implies PEANUTS unless stated otherwise).

Err toward flagging a plausible allergen rather than omitting it — every flag you produce is reviewed and either confirmed or cleared by restaurant staff before a diner ever sees it, so a false positive costs a moment of staff review, while a false negative could put someone with an allergy at real risk. Never invent a dish that isn't on the menu, and never flag an allergen the menu explicitly rules out (e.g. don't flag MILK on an item labeled "dairy-free").`;

export async function scanMenuWithClaude(fileBuffer: Buffer, mimeType: string): Promise<ScannedMenuItem[]> {
  const anthropic = getClient();
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-5";

  let content: Anthropic.MessageParam["content"];
  if (mimeType === "application/pdf") {
    content = [
      {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: fileBuffer.toString("base64") },
      },
      { type: "text", text: "Extract every item from this menu." },
    ];
  } else if (IMAGE_MIME_TYPES.has(mimeType)) {
    content = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: mimeType as "image/jpeg" | "image/png" | "image/webp",
          data: fileBuffer.toString("base64"),
        },
      },
      { type: "text", text: "Extract every item from this menu." },
    ];
  } else {
    // text/plain (or any already-textual upload) — no vision call needed.
    content = `Extract every item from this menu:\n\n${fileBuffer.toString("utf-8")}`;
  }

  const response = await anthropic.messages.parse({
    model,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
    output_config: { format: zodOutputFormat(ScannedMenuSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("Claude did not return parseable menu data");
  }

  return response.parsed_output.items.map((item) => ({
    name: sanitizePlainText(item.name),
    description: sanitizePlainText(item.description),
    priceCents: item.priceCents,
    category: item.category as MenuCategory,
    allergens: item.allergens as Allergen[],
  }));
}
