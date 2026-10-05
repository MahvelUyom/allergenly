import { AllergenStatus } from "@prisma/client";

// ---------------------------------------------------------------------
// Compliance score — formula locked in by the product spec:
//
//   score = (60 × ConfirmedRatio) + (30 × CoverageRatio) + (10 × RecencyFactor)
//
// The spec gives the formula but leaves a couple of terms open to
// interpretation; the choices below are flagged as sensible defaults
// rather than blocking on it, per the build brief.
//
//   ConfirmedRatio = items with >=1 manual allergen review ÷ total items
//     "Manual review" = an AllergenFlag with source "manual" (covers
//     both a staff CONFIRMED and a staff CLEARED action — both mean a
//     human looked at that allergen for that item, which is the thing
//     this ratio is meant to reward). An item with zero allergens ever
//     detected and zero manual reviews does NOT count here — it hasn't
//     actually been reviewed, even though it has nothing to flag.
//
//   CoverageRatio = items with zero unresolved AUTO_DETECTED flags ÷ total
//     An item with no flags at all (nothing was ever detected on it)
//     counts as covered — there's nothing unresolved to chase.
//
//   RecencyFactor = 1.0 if the most recent manual review anywhere on the
//     restaurant's menus was within 30 days, decaying linearly to 0 at
//     90+ days. No manual review ever => 0.
// ---------------------------------------------------------------------

export interface ComplianceFlagInput {
  status: AllergenStatus;
  source: string;
  confirmedAt: Date | null;
  updatedAt: Date;
}

export interface ComplianceItemInput {
  id: string;
  flags: ComplianceFlagInput[];
}

export interface ComplianceResult {
  score: number; // 0-100, rounded to nearest integer
  confirmedRatio: number;
  coverageRatio: number;
  recencyFactor: number;
  totalItems: number;
  confirmedItems: number;
  coveredItems: number;
  lastReviewedAt: Date | null;
}

export function computeComplianceScore(
  items: ComplianceItemInput[],
  now: Date = new Date()
): ComplianceResult {
  const totalItems = items.length;

  if (totalItems === 0) {
    return {
      score: 0,
      confirmedRatio: 0,
      coverageRatio: 0,
      recencyFactor: 0,
      totalItems: 0,
      confirmedItems: 0,
      coveredItems: 0,
      lastReviewedAt: null,
    };
  }

  let confirmedItems = 0;
  let coveredItems = 0;
  let lastReviewedAt: Date | null = null;

  for (const item of items) {
    const hasManualReview = item.flags.some((f) => f.source === "manual");
    if (hasManualReview) confirmedItems += 1;

    const hasUnresolved = item.flags.some((f) => f.status === "AUTO_DETECTED");
    if (!hasUnresolved) coveredItems += 1;

    for (const flag of item.flags) {
      if (flag.source === "manual") {
        const at = flag.confirmedAt ?? flag.updatedAt;
        if (!lastReviewedAt || at > lastReviewedAt) lastReviewedAt = at;
      }
    }
  }

  const confirmedRatio = confirmedItems / totalItems;
  const coverageRatio = coveredItems / totalItems;

  let recencyFactor = 0;
  if (lastReviewedAt) {
    const daysSince = (now.getTime() - lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 30) {
      recencyFactor = 1;
    } else if (daysSince >= 90) {
      recencyFactor = 0;
    } else {
      // Linear decay from 1.0 at day 30 to 0.0 at day 90.
      recencyFactor = 1 - (daysSince - 30) / 60;
    }
  }

  const score = 60 * confirmedRatio + 30 * coverageRatio + 10 * recencyFactor;

  return {
    score: Math.round(score),
    confirmedRatio,
    coverageRatio,
    recencyFactor,
    totalItems,
    confirmedItems,
    coveredItems,
    lastReviewedAt,
  };
}
