import { cn } from "@/lib/cn";
import type { BarDatum } from "./BarChart";

export type { BarDatum };

interface LineChartProps {
  data: BarDatum[];
  height?: number;
  className?: string;
  /** Fixed scale (e.g. 100 for a percentage/score chart) instead of auto-scaling to the tallest point in view. */
  maxValue?: number;
}

// A small dependency-free line chart — same BarDatum shape as
// BarChart (the two are interchangeable for any of this app's trend
// data), rendered as an SVG path with a soft area fill underneath.
// Only the highlighted point (most-recent week) gets a dot marker —
// same single-highlight convention BarChart uses — and that marker is
// a plain CSS-positioned div, not an SVG circle, so it isn't distorted
// by the chart's non-uniform x/y scaling (`preserveAspectRatio="none"`
// stretches a 100x100 viewBox to the actual box, which would otherwise
// turn a circle into an ellipse).
export function LineChart({ data, height = 160, className, maxValue }: LineChartProps) {
  const max = maxValue ?? Math.max(1, ...data.map((d) => d.value));
  const n = data.length;

  const points = data.map((d, i) => {
    const xPct = n <= 1 ? 50 : (i / (n - 1)) * 100;
    const yPct = 100 - (Math.min(Math.max(d.value, 0), max) / max) * 100;
    return { xPct, yPct, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.xPct} ${p.yPct}`).join(" ");
  const lastX = points[n - 1]?.xPct ?? 0;
  const firstX = points[0]?.xPct ?? 0;
  const areaPath = `${linePath} L ${lastX} 100 L ${firstX} 100 Z`;
  const highlighted = points.find((p) => p.highlight) ?? points[n - 1];

  return (
    <div className={cn("w-full", className)}>
      <div className="relative w-full" style={{ height }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" className="absolute inset-0">
          <path d={areaPath} className="fill-primary-tint" stroke="none" />
          <path
            d={linePath}
            fill="none"
            className="stroke-primary"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        {highlighted && (
          <div
            className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-card"
            style={{ left: `${highlighted.xPct}%`, top: `${highlighted.yPct}%` }}
            title={`${highlighted.label}: ${highlighted.value}`}
          />
        )}
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
