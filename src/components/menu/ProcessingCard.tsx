import { Card } from "@/components/ui/Card";
import { FileIcon } from "@/components/ui/icons";

export function ProcessingCard({ fileName, progress }: { fileName: string; progress: number }) {
  return (
    <Card className="flex items-center gap-4 p-6">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary-tint text-primary">
        <FileIcon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-label text-charcoal">{fileName}</p>
        <p className="mt-1 text-micro text-charcoal/56">Scanning for allergens… {Math.round(progress)}%</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-border">
          <div
            className="h-full rounded-pill bg-primary transition-[width] duration-200"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
