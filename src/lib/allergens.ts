import { Allergen } from "@prisma/client";

// ---------------------------------------------------------------------
// The 14 EU-recognized allergens (EU FIC 1169/2011, Annex II), plus the
// keyword lexicon used to flag them from free-text menu-item names and
// descriptions. This is a deliberately simple, transparent keyword
// scanner — not a claim of clinical accuracy. Per the build spec, every
// match is stored as AUTO_DETECTED ("possible") and must be manually
// confirmed or cleared by restaurant staff before it means anything;
// this module never marks anything CONFIRMED on its own.
//
// Flagged as a place a future pass could improve: swap the keyword list
// for an ingredient-database lookup or an LLM-assisted pass, without
// changing the AllergenFlag data model or the review-required contract.
// ---------------------------------------------------------------------

export const EU14_ALLERGENS: Allergen[] = [
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
];

// The 6 "core" allergens shown in the Menu Upload manual-override panel
// per design spec §2.5 (3-column x 2-row grid). The other 8 EU-14
// allergens are still tracked in the data model and surfaced as chips,
// just not in that specific fixed grid.
export const CORE_ALLERGENS: Allergen[] = [
  "GLUTEN",
  "MILK",
  "NUTS",
  "CRUSTACEANS",
  "SOYBEANS",
  "EGGS",
];

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  GLUTEN: "Gluten",
  CRUSTACEANS: "Shellfish",
  EGGS: "Eggs",
  FISH: "Fish",
  PEANUTS: "Peanuts",
  SOYBEANS: "Soy",
  MILK: "Dairy",
  NUTS: "Nuts",
  CELERY: "Celery",
  MUSTARD: "Mustard",
  SESAME: "Sesame",
  SULPHITES: "Sulphites",
  LUPIN: "Lupin",
  MOLLUSCS: "Molluscs",
};

// Keyword → allergen lexicon. Word-boundary, case-insensitive matching.
const KEYWORDS: Record<Allergen, string[]> = {
  GLUTEN: [
    "wheat", "flour", "bread", "breadcrumb", "crouton", "pasta", "noodle",
    "gluten", "barley", "rye", "malt", "bun", "batter", "soy sauce",
    "tortilla", "pastry", "dough", "cracker", "beer",
  ],
  CRUSTACEANS: [
    "shrimp", "prawn", "crab", "lobster", "crawfish", "crayfish",
    "langoustine", "shellfish",
  ],
  EGGS: ["egg", "eggs", "mayonnaise", "mayo", "aioli", "meringue", "custard"],
  FISH: [
    "fish", "salmon", "tuna", "anchovy", "anchovies", "cod", "halibut",
    "trout", "bass", "fish sauce", "worcestershire",
  ],
  PEANUTS: ["peanut", "peanuts", "groundnut", "satay"],
  SOYBEANS: ["soy", "soya", "soybean", "tofu", "edamame", "tempeh", "miso"],
  MILK: [
    "milk", "cream", "butter", "cheese", "dairy", "yogurt", "yoghurt",
    "parmesan", "mozzarella", "mac & cheese", "mac and cheese", "gelato",
    "alfredo", "ranch",
  ],
  NUTS: [
    "almond", "hazelnut", "walnut", "cashew", "pecan", "pistachio",
    "macadamia", "brazil nut", "pine nut", "nut", "nuts", "praline",
  ],
  CELERY: ["celery", "celeriac"],
  MUSTARD: ["mustard"],
  SESAME: ["sesame", "tahini"],
  SULPHITES: ["sulphite", "sulfite", "wine", "dried fruit", "dried apricot"],
  LUPIN: ["lupin", "lupini"],
  MOLLUSCS: [
    "mussel", "clam", "oyster", "squid", "calamari", "octopus", "scallop",
    "snail", "escargot",
  ],
};

export interface AllergenMatch {
  allergen: Allergen;
  matchedKeywords: string[];
}

/**
 * Scan a single menu item's free text (name + description) and return
 * every EU-14 allergen it appears to reference. Callers persist these
 * as AllergenStatus.AUTO_DETECTED — never CONFIRMED.
 */
export function detectAllergens(text: string): AllergenMatch[] {
  const haystack = ` ${text.toLowerCase()} `;
  const matches: AllergenMatch[] = [];

  for (const allergen of EU14_ALLERGENS) {
    const hits = KEYWORDS[allergen].filter((kw) =>
      haystack.includes(` ${kw.toLowerCase()} `) ||
      haystack.includes(`${kw.toLowerCase()} `) ||
      haystack.includes(` ${kw.toLowerCase()}`)
    );
    if (hits.length > 0) {
      matches.push({ allergen, matchedKeywords: Array.from(new Set(hits)) });
    }
  }

  return matches;
}

export function allergenLabel(allergen: Allergen): string {
  return ALLERGEN_LABELS[allergen] ?? allergen;
}
