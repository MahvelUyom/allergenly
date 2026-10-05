// Minimal in-memory sliding-window rate limiter. Good enough for a
// single-instance deploy and for the /q/{qrId} public redirect route's
// "keep it narrowly scoped" requirement. A multi-instance production
// deploy should swap this for a shared store (e.g. Upstash Redis) —
// the call signature below is deliberately small so that swap is a
// one-file change.
const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export function rateLimit(
  key: string,
  { windowMs, max }: { windowMs: number; max: number }
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > windowStart);

  if (hits.length >= max) {
    buckets.set(key, hits);
    return { allowed: false, remaining: 0 };
  }

  hits.push(now);
  buckets.set(key, hits);

  // Opportunistic cleanup so the map doesn't grow unbounded in a
  // long-running process.
  if (buckets.size > 5000) {
    for (const [k, arr] of buckets) {
      if (arr.every((t) => t <= windowStart)) buckets.delete(k);
    }
  }

  return { allowed: true, remaining: max - hits.length };
}
