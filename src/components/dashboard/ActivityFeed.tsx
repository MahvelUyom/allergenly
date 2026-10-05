import { Card } from "@/components/ui/Card";
import { WarningIcon, MenuIcon, QrIcon, CheckCircleIcon, UploadIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ActivityType } from "@prisma/client";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  createdAt: Date;
  read?: boolean;
}

export const TYPE_STYLE: Record<ActivityType, { icon: React.ComponentType<{ size?: number }>; tone: string }> = {
  ALLERGEN_FLAGGED: { icon: WarningIcon, tone: "bg-amber-tint text-amber" },
  MENU_UPDATED: { icon: MenuIcon, tone: "bg-primary-tint text-primary" },
  QR_GENERATED: { icon: QrIcon, tone: "bg-primary-tint text-primary" },
  QR_SCANNED: { icon: QrIcon, tone: "bg-primary-tint text-primary" },
  ALLERGEN_CONFIRMED: { icon: CheckCircleIcon, tone: "bg-success-tint text-success" },
  MENU_UPLOADED: { icon: UploadIcon, tone: "bg-primary-tint text-primary" },
  ACCOUNT_CREATED: { icon: ShieldCheckIcon, tone: "bg-success-tint text-success" },
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-h3 text-charcoal">Recent activity</h3>

      {items.length === 0 ? (
        <p className="mt-6 text-body text-charcoal/56">No activity yet — upload a menu to get started.</p>
      ) : (
        <ol className="mt-6 flex flex-col gap-6">
          {items.map((item) => {
            const style = TYPE_STYLE[item.type];
            const Icon = style.icon;
            return (
              <li key={item.id} className="flex gap-3">
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", style.tone)}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-label text-charcoal">{item.title}</p>
                  <p className="text-micro text-charcoal/70">{item.description}</p>
                  <p className="mt-1 text-micro text-charcoal/45">{relativeTime(item.createdAt)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
