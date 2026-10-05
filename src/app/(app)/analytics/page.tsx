import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { LineChart } from "@/components/ui/LineChart";
import {
  getWeeklyScanTrend,
  getQrScanStats,
  getComplianceTrend,
  getComplianceScoreForRestaurant,
} from "@/lib/dashboard-data";
import { getScanBreakdownByQrCode } from "@/lib/qr-data";

export const metadata: Metadata = { title: "Analytics", robots: { index: false } };

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = session!.user.restaurantId!;

  const [trend, stats, breakdown, compliance, complianceTrend] = await Promise.all([
    getWeeklyScanTrend(restaurantId),
    getQrScanStats(restaurantId),
    getScanBreakdownByQrCode(restaurantId),
    getComplianceScoreForRestaurant(restaurantId), // also opportunistically records today's snapshot
    getComplianceTrend(restaurantId),
  ]);

  return (
    <div>
      <AppHeader
        title="Analytics"
        subtitle="QR scan performance and allergen compliance across every location."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-h3 text-charcoal">Combined scan trend</h3>
              <p className="text-micro text-charcoal/56">Last 12 weeks, all QR codes</p>
            </div>
            <p className="text-h2 text-charcoal">{stats.thisMonth.toLocaleString()}</p>
          </div>
          <div className="mt-8">
            <LineChart data={trend} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-h3 text-charcoal">Compliance score trend</h3>
              <p className="text-micro text-charcoal/56">Last 12 weeks · {compliance.confirmedItems}/{compliance.totalItems} items reviewed</p>
            </div>
            <p className="text-h2 text-charcoal">{compliance.score}</p>
          </div>
          <div className="mt-8">
            <LineChart data={complianceTrend} maxValue={100} />
          </div>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-h3 text-charcoal">Scans by QR code</h3>
        </div>
        {/* A plain table has no way to shrink on a phone — this lets it
            scroll horizontally within its own card instead of either
            squashing columns illegibly or overflowing the whole page. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-border text-micro text-charcoal/56">
                <th className="px-6 py-3 font-medium">Placement</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium">This month</th>
                <th className="px-6 py-3 font-medium">All-time</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  <td className="px-6 py-4 text-label text-charcoal">{row.label}</td>
                  <td className="px-6 py-4 text-label text-charcoal/70">{row.locationName}</td>
                  <td className="px-6 py-4 text-label text-charcoal">{row.thisMonth.toLocaleString()}</td>
                  <td className="px-6 py-4 text-label text-charcoal">{row.total.toLocaleString()}</td>
                </tr>
              ))}
              {breakdown.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-body text-charcoal/56">
                    No QR codes yet — generate one from QR Code Management.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
