import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { ComplianceScoreCard, StatCard } from "@/components/dashboard/SummaryCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { BarChart } from "@/components/ui/BarChart";
import { QrIcon, MenuIcon, WarningIcon } from "@/components/ui/icons";
import {
  getComplianceScoreForRestaurant,
  getQrScanStats,
  getWeeklyScanTrend,
  getRecentActivity,
  getMenuCounts,
} from "@/lib/dashboard-data";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = session!.user.restaurantId!;

  const [compliance, scans, trend, activity, counts] = await Promise.all([
    getComplianceScoreForRestaurant(restaurantId),
    getQrScanStats(restaurantId),
    getWeeklyScanTrend(restaurantId),
    getRecentActivity(restaurantId),
    getMenuCounts(restaurantId),
  ]);

  return (
    <div>
      <AppHeader
        title="Dashboard"
        subtitle="Welcome back — here's what's happening across your locations."
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <ComplianceScoreCard score={compliance.score} trendPts={compliance.trendPts} />
        <StatCard
          label="QR Scans This Month"
          value={scans.thisMonth.toLocaleString()}
          icon={<QrIcon size={18} />}
          note={scans.lastMonth > 0 ? `${scans.trendPct >= 0 ? "+" : ""}${scans.trendPct}% vs last month` : undefined}
          noteTone={scans.trendPct >= 0 ? "success" : "danger"}
        />
        <StatCard
          label="Total Menu Items"
          value={counts.totalItems.toLocaleString()}
          icon={<MenuIcon size={18} />}
          note="Across your locations"
        />
        <StatCard
          label="Flagged Allergen Items"
          value={counts.flaggedItems.toLocaleString()}
          icon={<WarningIcon size={18} />}
          iconTint="amber"
          note={counts.flaggedItems > 0 ? "Needs review" : "All clear"}
          noteTone={counts.flaggedItems > 0 ? "danger" : "success"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-h3 text-charcoal">QR Scan Trends</h3>
              <p className="text-micro text-charcoal/56">Last 12 weeks, all locations</p>
            </div>
            {scans.trendPct !== 0 && (
              <span className="rounded-pill bg-primary-tint px-3 py-1 text-micro font-semibold text-primary">
                {scans.trendPct >= 0 ? "+" : ""}
                {scans.trendPct}%
              </span>
            )}
          </div>
          <div className="mt-8">
            <BarChart data={trend} />
          </div>
        </Card>

        <ActivityFeed items={activity} />
      </div>
    </div>
  );
}
