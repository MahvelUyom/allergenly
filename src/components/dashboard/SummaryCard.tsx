import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { TrendUpIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

interface BaseCardProps {
  label: string;
  className?: string;
}

export function ComplianceScoreCard({ score, trendPts }: { score: number; trendPts: number | null }) {
  return (
    <Card className="flex flex-col items-start gap-4 p-6">
      <p className="text-label text-charcoal/70">Compliance Score</p>
      <ProgressRing value={score} size={88} strokeWidth={9} />
      {trendPts !== null && trendPts !== 0 && (
        <p
          className={cn(
            "flex items-center gap-1.5 text-micro font-medium",
            trendPts > 0 ? "text-success" : "text-danger"
          )}
        >
          <TrendUpIcon size={14} className={trendPts < 0 ? "rotate-180" : undefined} />
          {trendPts > 0 ? "+" : ""}
          {trendPts}pts this month
        </p>
      )}
    </Card>
  );
}

interface StatCardProps extends BaseCardProps {
  value: string | number;
  icon: React.ReactNode;
  iconTint?: "primary" | "amber";
  note?: string;
  noteTone?: "success" | "danger" | "muted";
}

export function StatCard({ label, value, icon, iconTint = "primary", note, noteTone = "muted" }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-4 p-6">
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-control",
          iconTint === "primary" ? "bg-primary-tint text-primary" : "bg-amber-tint text-amber"
        )}
      >
        {icon}
      </span>
      <div>
        <p className="text-label text-charcoal/70">{label}</p>
        <p className="mt-1 text-h1 text-charcoal">{value}</p>
      </div>
      {note && (
        <p
          className={cn(
            "text-micro font-medium",
            noteTone === "success" && "text-success",
            noteTone === "danger" && "text-danger",
            noteTone === "muted" && "text-charcoal/56"
          )}
        >
          {note}
        </p>
      )}
    </Card>
  );
}
