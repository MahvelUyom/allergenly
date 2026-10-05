import { timingSafeEqual } from "crypto";

/**
 * Verify the `x-internal-secret` header on any service-to-service call
 * into /api/internal/*. Fails closed: if INTERNAL_SERVICE_SECRET isn't
 * configured, every call is rejected rather than silently allowed
 * through.
 */
export function verifyInternalSecret(headerValue: string | null): boolean {
  const expected = process.env.INTERNAL_SERVICE_SECRET;
  if (!expected) return false; // fail closed
  if (!headerValue) return false;

  const a = Buffer.from(headerValue);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false; // timingSafeEqual requires equal length
  return timingSafeEqual(a, b);
}
