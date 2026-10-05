import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import type { MenuCategory, Allergen } from "@prisma/client";
import { sanitizePlainText } from "./sanitize";

// ---------------------------------------------------------------------
// OCR_DRIVER=gemini — same role as menu-scan-claude.ts: one vision call
// that extracts structured menu items AND does the allergen assessment
// contextually, replacing the separate parse+keyword-scan steps the
// stub/vision drivers still use. See that file's header comment for the
// full rationale (over-flag vs under-flag, staff-review contract).
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

// Runtime validation of the model's JSON output — Gemini's structured
// output uses its own OpenAPI-style schema (below) to constrain
// generation, but the response still arrives as a JSON string that
// needs parsing and shouldn't be trusted without a check.
const ScannedMenuSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      priceCents: z.number().int().nonnegative().nullable(),
      category: z.enum(CATEGORY_VALUES),
      allergens: z.array(z.enum(ALLERGEN_VALUES)),
    })
  ),
});

export interface ScannedMenuItem {
  name: string;
  description: string;
  priceCents: number | null;
  category: MenuCategory;
  allergens: Allergen[];
}

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (client) return client;
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("OCR_DRIVER=gemini but GEMINI_API_KEY is not configured");
  }
  client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

const SYSTEM_PROMPT = `You read restaurant menus (photos, scans, or PDFs) and extract every menu item as structured data, including a careful allergen assessment for the EU-14 recognized allergens: ${ALLERGEN_VALUES.join(", ")}.

For each item:
- name: the dish name exactly as printed.
- description: the ingredient/description text printed under the dish, or "" if none is printed.
- priceCents: the price in cents (e.g. $12.50 -> 1250), or null if no price is printed.
- category: STARTERS, MAINS, DESSERTS, DRINKS, or OTHER — infer from menu section headings, or OTHER if unclear.
- allergens: every EU-14 allergen you can reasonably infer is present, based on the stated ingredients, the dish name, and how that dish is normally prepared (e.g. "aioli" implies EGGS, "soy sauce" implies GLUTEN and SOYBEANS, "pad thai" implies PEANUTS unless stated otherwise).

Err toward flagging a plausible allergen rather than omitting it — every flag you produce is reviewed and either confirmed or cleared by restaurant staff before a diner ever sees it, so a false positive costs a moment of staff review, while a false negative could put someone with an allergy at real risk. Never invent a dish that isn't on the menu, and never flag an allergen the menu explicitly rules out (e.g. don't flag MILK on an item labeled "dairy-free").`;

export async function scanMenuWithGemini(fileBuffer: Buffer, mimeType: string): Promise<ScannedMenuItem[]> {
  const ai = getClient();
  // gemini-flash-lite-latest, not gemini-flash-latest — the latter (and
  // the newest dated model, gemini-3.8-flash) returned a persistent 503
  // "high demand" in testing; the lite tier had actual capacity. Worth
  // re-checking occasionally as Google's availability shifts.
  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

  const contents =
    mimeType === "text/plain"
      ? [`${SYSTEM_PROMPT}\n\nExtract every item from this menu:\n\n${fileBuffer.toString("utf-8")}`]
      : [
          { text: SYSTEM_PROMPT },
          { inlineData: { data: fileBuffer.toString("base64"), mimeType } },
          { text: "Extract every item from this menu." },
        ];

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                priceCents: { type: Type.INTEGER, nullable: true },
                category: { type: Type.STRING, enum: [...CATEGORY_VALUES] },
                allergens: { type: Type.ARRAY, items: { type: Type.STRING, enum: [...ALLERGEN_VALUES] } },
              },
              required: ["name", "description", "priceCents", "category", "allergens"],
            },
          },
        },
        required: ["items"],
      },
    },
  });

  if (!response.text) {
    throw new Error("Gemini did not return any output");
  }

  const parsed = ScannedMenuSchema.parse(JSON.parse(response.text));

  return parsed.items.map((item) => ({
    name: sanitizePlainText(item.name),
    description: sanitizePlainText(item.description),
    priceCents: item.priceCents,
    category: item.category as MenuCategory,
    allergens: item.allergens as Allergen[],
  }));
}
