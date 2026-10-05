import { Card } from "@/components/ui/Card";
import { BarChart, type BarDatum } from "@/components/ui/BarChart";

export function ScanAnalyticsCard({ data, total }: { data: BarDatum[]; total: number }) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <h3 className="text-h3 text-charcoal">Scan analytics</h3>
        <p className="text-label font-semibold text-charcoal">{total.toLocaleString()} total scans</p>
      </div>
      <div className="mt-6">
        <BarChart data={data} height={120} />
      </div>
    </Card>
  );
}
