// Shown by Next.js while a dashboard-area route segment's data is
// still loading. Sized to roughly match the real layout (header row +
// a card grid) so nothing visibly jumps once the real content swaps in.
export default function Loading() {
  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded-control bg-border" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded-control bg-border" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-card border border-border bg-white" />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="h-72 animate-pulse rounded-card border border-border bg-white" />
        <div className="h-72 animate-pulse rounded-card border border-border bg-white" />
      </div>
    </div>
  );
}
