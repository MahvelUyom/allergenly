import { cn } from "@/lib/cn";

export interface BarDatum {
  label: string;
  value: number;
  highlight?: boolean;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  className?: string;
  /** Fixed scale (e.g. 100 for a percentage/score chart) instead of auto-scaling to the tallest bar in view. */
  maxValue?: number;
}

// A small dependency-free bar chart: gray bars, with the highlighted
// bar (most-recent week, or the peak day) rendered solid teal — matches
// the "QR Scan Trends" and "Scan analytics" charts in the design spec.
export function BarChart({ data, height = 160, className, maxValue }: BarChartProps) {
  const max = maxValue ?? Math.max(1, ...data.map((d) => d.value));

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const pct = Math.max(2, (d.value / max) * 100);
          return (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-2 h-full">
              {/* Full-height box, scaled with a transform instead of an
                  animated `height` — height is a layout property, so
                  animating it forces a reflow on every bar on every
                  render; scaleY is compositor-only. */}
              <div
                className={cn(
                  "w-full origin-bottom rounded-t-sm transition-transform",
                  d.highlight ? "bg-primary" : "bg-border"
                )}
                style={{ height: "100%", transform: `scaleY(${pct / 100})` }}
                title={`${d.label}: ${d.value}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-micro text-charcoal/56">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
