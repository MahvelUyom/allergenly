import { prisma } from "./prisma";
import { computeComplianceScore } from "./compliance";
import type { BarDatum } from "@/components/ui/BarChart";

export interface ComplianceScoreWithTrend {
  score: number;
  confirmedRatio: number;
  coverageRatio: number;
  recencyFactor: number;
  totalItems: number;
  confirmedItems: number;
  coveredItems: number;
  lastReviewedAt: Date | null;
  /** Points vs. ~30 days ago, or null with no baseline yet (e.g. a brand-new account). */
  trendPts: number | null;
}

export async function getComplianceScoreForRestaurant(restaurantId: string): Promise<ComplianceScoreWithTrend> {
  const items = await prisma.menuItem.findMany({
    where: { menu: { restaurantId } },
    select: {
      id: true,
      allergens: { select: { status: true, source: true, confirmedAt: true, updatedAt: true } },
    },
  });

  const result = computeComplianceScore(items.map((i) => ({ id: i.id, flags: i.allergens })));
  const trendPts = await recordSnapshotAndGetTrend(restaurantId, result.score);

  return { ...result, trendPts };
}

/**
 * Opportunistically records today's compliance score (at most once per
 * ~20 hours, so repeated dashboard loads don't spam rows) and returns
 * the point change against the closest snapshot from ~30 days ago —
 * this is what makes the dashboard's "+N pts this month" note (design
 * spec §2.4) a real comparison instead of a hardcoded mockup value.
 * Returns null when there's no 30-day-old baseline yet.
 */
async function recordSnapshotAndGetTrend(restaurantId: string, currentScore: number): Promise<number | null> {
  const now = new Date();
  const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);

  const recentSnapshot = await prisma.complianceScoreSnapshot.findFirst({
    where: { restaurantId, capturedAt: { gte: twentyHoursAgo } },
    select: { id: true },
  });
  if (!recentSnapshot) {
    await prisma.complianceScoreSnapshot.create({ data: { restaurantId, score: currentScore } });
  }

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Prefer a snapshot from ~30 days ago; short of that, fall back to
  // the earliest one on record — but only if it's genuinely old (more
  // than a day), so a brand-new account (today's snapshot compared to
  // itself) shows no trend rather than a misleading "+0".
  const baseline =
    (await prisma.complianceScoreSnapshot.findFirst({
      where: { restaurantId, capturedAt: { lte: thirtyDaysAgo } },
      orderBy: { capturedAt: "desc" },
    })) ??
    (await prisma.complianceScoreSnapshot.findFirst({
      where: { restaurantId, capturedAt: { lte: oneDayAgo } },
      orderBy: { capturedAt: "asc" },
    }));

  if (!baseline) return null;
  return currentScore - baseline.score;
}

/**
 * 12-week compliance-score trend for the Analytics page. Snapshots land
 * at most once per ~20h (see recordSnapshotAndGetTrend above), so most
 * weeks have 0-1 rows — we take the last snapshot captured in each week
 * and carry the previous week's value forward across any gap, rather
 * than showing a misleading drop to 0.
 */
export async function getComplianceTrend(restaurantId: string, weeks = 12): Promise<BarDatum[]> {
  const now = new Date();
  const buckets: { start: Date; end: Date }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    buckets.push({ start, end });
  }

  const snapshots = await prisma.complianceScoreSnapshot.findMany({
    where: { restaurantId, capturedAt: { gte: buckets[0].start } },
    orderBy: { capturedAt: "asc" },
    select: { score: true, capturedAt: true },
  });

  // Earliest known score before this window, so the first bucket isn't
  // an artificial 0 for an account with history predating the window.
  const priorScore = await prisma.complianceScoreSnapshot.findFirst({
    where: { restaurantId, capturedAt: { lt: buckets[0].start } },
    orderBy: { capturedAt: "desc" },
    select: { score: true },
  });

  let carry = priorScore?.score ?? null;
  return buckets.map((b, i) => {
    const inBucket = snapshots.filter((s) => s.capturedAt >= b.start && s.capturedAt < b.end);
    if (inBucket.length > 0) carry = inBucket[inBucket.length - 1].score;
    return {
      label: i === weeks - 1 ? "Now" : `W${i + 1}`,
      value: carry ?? 0,
      highlight: i === weeks - 1,
    };
  });
}

export async function getQrScanStats(restaurantId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [thisMonth, lastMonth] = await Promise.all([
    prisma.scanEvent.count({
      where: { qrCode: { restaurantId }, timestamp: { gte: startOfMonth } },
    }),
    prisma.scanEvent.count({
      where: { qrCode: { restaurantId }, timestamp: { gte: startOfLastMonth, lt: startOfMonth } },
    }),
  ]);

  const trendPct = lastMonth === 0 ? (thisMonth > 0 ? 100 : 0) : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

  return { thisMonth, lastMonth, trendPct };
}

/** 12-week scan trend, most recent week highlighted, for the Dashboard "QR Scan Trends" card. */
export async function getWeeklyScanTrend(restaurantId: string): Promise<BarDatum[]> {
  const weeks = 12;
  const now = new Date();
  const buckets: { start: Date; end: Date }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    buckets.push({ start, end });
  }

  const events = await prisma.scanEvent.findMany({
    where: { qrCode: { restaurantId }, timestamp: { gte: buckets[0].start } },
    select: { timestamp: true },
  });

  return buckets.map((b, i) => {
    const count = events.filter((e) => e.timestamp >= b.start && e.timestamp < b.end).length;
    return {
      label: i === weeks - 1 ? "Now" : `W${i + 1}`,
      value: count,
      highlight: i === weeks - 1,
    };
  });
}

export async function getRecentActivity(restaurantId: string, limit = 4) {
  return prisma.activityEvent.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getMenuCounts(restaurantId: string) {
  const [totalItems, flaggedItems] = await Promise.all([
    prisma.menuItem.count({ where: { menu: { restaurantId } } }),
    prisma.menuItem.count({
      where: { menu: { restaurantId }, allergens: { some: { status: "AUTO_DETECTED" } } },
    }),
  ]);
  return { totalItems, flaggedItems };
}
