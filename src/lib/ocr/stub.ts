import type { OcrAdapter, OcrResult } from "./types";

// Deterministic stand-in for Google Cloud Vision, used when
// OCR_DRIVER=stub (the default) so the full upload → extract → detect
// → review pipeline is exercisable with no API key. It does not "read"
// the uploaded file — it returns a small fixed sample menu so the rest
// of the pipeline (parsing into items, allergen detection, the review
// UI) has something real to work with end to end.
export class StubOcrAdapter implements OcrAdapter {
  async extractText(_fileBuffer: Buffer, _mimeType: string): Promise<OcrResult> {
    const text = [
      "STARTERS",
      "Garden Herb Salad $12",
      "Mixed greens, herb vinaigrette, shaved radish",
      "Miso Soup $7",
      "Tofu, scallion, soy broth",
      "",
      "MAINS",
      "Grilled Salmon Bowl $18",
      "Salmon, jasmine rice, shrimp chili crisp, pickled vegetables",
      "Truffle Mac & Cheese $14",
      "Cavatappi, three-cheese sauce, breadcrumb, truffle oil",
      "Thai Green Curry $16",
      "Prawns, peanuts, coconut curry, jasmine rice",
      "Classic Beef Burger $15",
      "Beef patty, cheddar, brioche bun, fried egg, aioli",
      "",
      "DESSERTS",
      "Flourless Chocolate Cake $9",
      "Dark chocolate, whipped cream, butter custard",
      "Seasonal Fruit Sorbet $7",
      "Rotating seasonal fruit, mint",
    ].join("\n");

    return { text, confidence: 0.98 };
  }
}
